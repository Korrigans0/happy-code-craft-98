// AI Game Master assistant — GM only.
// Streams answers from the `mj-assistant` edge function, grounded in the campaign
// data, lets the GM push a generated result straight into the campaign codex, and
// keeps a searchable history of past conversations (resumable with full context).

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Sparkles,
  Send,
  Loader2,
  BookPlus,
  Trash2,
  Copy,
  History,
  Plus,
  Search,
  Pencil,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { codexApi } from "@/lib/codex/api";
import type { EntityKind } from "@/lib/codex/types";
import AiEntityGenerator from "./AiEntityGenerator";
import {
  aiConversationsApi,
  deriveTitle,
  type AiChatMessage,
  type AiConversationSummary,
} from "@/lib/ai/conversations";


const SUPABASE_URL =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined) ||
  "https://snawpxrejmcxfbiiowxr.supabase.co";

type ChatMessage = AiChatMessage;

interface QuickPrompt {
  label: string;
  kind: EntityKind;
  prompt: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "PNJ", kind: "npc", prompt: "Crée un PNJ marquant pour ma prochaine scène : nom, rôle, apparence, voix, motivation secrète et une accroche d'intrigue." },
  { label: "Lieu", kind: "location", prompt: "Décris un lieu évocateur à explorer : ambiance, détails sensoriels, trois points d'intérêt et un danger latent." },
  { label: "Quête", kind: "quest", prompt: "Propose une quête secondaire : commanditaire, enjeu, obstacles, twist et récompense." },
  { label: "Rencontre", kind: "monster", prompt: "Compose une rencontre adaptée au niveau du groupe : opposants, terrain, tactique et condition de victoire alternative." },
  { label: "Objet", kind: "item", prompt: "Invente un objet remarquable : apparence, histoire, effet en jeu et son prix narratif." },
  { label: "Faction", kind: "faction", prompt: "Crée une faction : idéal, méthodes, figures clés, ressources et rivalités." },
];

const dateFormatter = new Intl.DateTimeFormat("fr-BE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function AIAssistant({ campaignId, system }: { campaignId: string; system: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get("conv");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [lastKind, setLastKind] = useState<EntityKind>("npc");

  const [history, setHistory] = useState<AiConversationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);


  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<string | null>(conversationId);
  conversationRef.current = conversationId;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── History list (search is debounced server-side on title + transcript) ──
  const refreshHistory = useCallback(
    async (term: string) => {
      try {
        setHistory(await aiConversationsApi.list(campaignId, term));
      } catch (e: any) {
        toast({ title: "Historique", description: e.message, variant: "destructive" });
      }
    },
    [campaignId],
  );

  useEffect(() => {
    const t = setTimeout(() => void refreshHistory(search), 250);
    return () => clearTimeout(t);
  }, [search, refreshHistory]);

  // ── Restore the conversation named in the URL (survives reloads/tab changes) ──
  useEffect(() => {
    let cancelled = false;
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoadingConversation(true);
    aiConversationsApi
      .get(conversationId)
      .then((conv) => {
        if (cancelled) return;
        if (!conv) {
          setMessages([]);
          setActiveConversation(null);
          return;
        }
        setMessages(conv.messages);
      })
      .catch((e: any) => {
        if (!cancelled) toast({ title: "Conversation", description: e.message, variant: "destructive" });
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingConversation(false);
          inputRef.current?.focus();
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function setActiveConversation(id: string | null) {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("conv", id);
    else next.delete("conv");
    setSearchParams(next, { replace: true });
  }

  function newConversation() {
    setMessages([]);
    setInput("");
    setActiveConversation(null);
    setHistoryOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function persist(next: ChatMessage[]) {
    try {
      const current = conversationRef.current;
      if (current) {
        await aiConversationsApi.saveMessages(current, next);
      } else {
        const id = await aiConversationsApi.create(campaignId, next);
        conversationRef.current = id;
        setActiveConversation(id);
      }
      void refreshHistory(search);
    } catch (e: any) {
      toast({ title: "Sauvegarde de la conversation", description: e.message, variant: "destructive" });
    }
  }

  async function send(text: string, kind?: EntityKind) {
    const content = text.trim();
    if (!content || streaming) return;
    if (kind) setLastKind(kind);

    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée, reconnectez-vous.");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/mj-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ campaignId, messages: next }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "L'assistant n'a pas pu répondre.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (delta) {
              answer += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: answer };
                return copy;
              });
            }
          } catch {
            /* partial frame, ignored */
          }
        }
      }

      if (!answer) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: "_Aucune réponse générée. Reformulez la demande._" };
          return copy;
        });
        return;
      }

      await persist([...next, { role: "assistant", content: answer }]);
    } catch (e: any) {
      setMessages((prev) => prev.slice(0, -1));
      toast({ title: "Assistant IA", description: e.message, variant: "destructive" });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";

  async function saveToCodex() {
    if (!lastAnswer) return;
    // First markdown heading or first bold run makes a decent name.
    const name =
      lastAnswer.match(/^#{1,4}\s*(.+)$/m)?.[1]?.trim() ||
      lastAnswer.match(/\*\*(.+?)\*\*/)?.[1]?.trim() ||
      "Création de l'assistant";
    try {
      await codexApi.create(campaignId, system, {
        kind: lastKind,
        name: name.slice(0, 120),
        summary: lastAnswer.replace(/[#*_`>]/g, "").slice(0, 200),
        content: { text: lastAnswer, source: "ai" },
        tags: ["ia"],
        visibility: "gm_only",
      });
      toast({ title: "Ajouté au Codex", description: `« ${name.slice(0, 60)} » créé en visibilité MJ.` });
    } catch (e: any) {
      toast({ title: "Échec de l'ajout", description: e.message, variant: "destructive" });
    }
  }

  async function renameConversation(id: string, currentTitle: string) {
    const title = window.prompt("Nouveau titre de la conversation", currentTitle);
    if (!title?.trim()) return;
    try {
      await aiConversationsApi.rename(id, title.trim());
      void refreshHistory(search);
    } catch (e: any) {
      toast({ title: "Renommage", description: e.message, variant: "destructive" });
    }
  }

  async function deleteConversation(id: string) {
    try {
      await aiConversationsApi.remove(id);
      if (conversationRef.current === id) newConversation();
      void refreshHistory(search);
      toast({ title: "Conversation supprimée" });
    } catch (e: any) {
      toast({ title: "Suppression", description: e.message, variant: "destructive" });
    }
  }

  const historyPanel = (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <Button size="sm" variant="secondary" onClick={newConversation} className="justify-start">
        <Plus className="mr-2 h-4 w-4" /> Nouvelle conversation
      </Button>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans l'historique…"
          className="h-9 pl-8 text-sm"
        />
      </div>
      <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border/60 bg-background/40">
        <div className="space-y-1 p-1.5">
          {history.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              {search ? "Aucune conversation ne correspond." : "Aucune conversation enregistrée."}
            </p>
          )}
          {history.map((c) => (
            <div
              key={c.id}
              className={`group flex items-start gap-1 rounded-md border px-2 py-1.5 transition-colors ${
                c.id === conversationId
                  ? "border-primary/50 bg-primary/10"
                  : "border-transparent hover:border-border/60 hover:bg-muted/40"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveConversation(c.id);
                  setHistoryOpen(false);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-medium">{c.title}</span>
                {c.preview && (
                  <span className="block truncate text-xs text-muted-foreground">{c.preview}</span>
                )}
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {dateFormatter.format(new Date(c.updated_at))}
                </span>
              </button>
              <div className="flex shrink-0 flex-col opacity-60 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  aria-label="Renommer la conversation"
                  onClick={() => renameConversation(c.id, c.title)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  aria-label="Supprimer la conversation"
                  onClick={() => deleteConversation(c.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-full gap-3 p-3 sm:p-4">
      <aside className="hidden w-64 shrink-0 lg:block">{historyPanel}</aside>

      <div className="flex h-full min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
            <Sparkles className="h-3 w-3" /> Assistant MJ
          </Badge>

          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="lg:hidden">
                <History className="mr-1 h-3.5 w-3.5" /> Historique
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[85vw] max-w-sm flex-col">
              <SheetHeader>
                <SheetTitle>Historique des conversations</SheetTitle>
              </SheetHeader>
              <div className="mt-3 min-h-0 flex-1">{historyPanel}</div>
            </SheetContent>
          </Sheet>

          <Button
            size="sm"
            variant="outline"
            className="border-primary/40 text-primary"
            onClick={() => setGeneratorOpen(true)}
          >
            <BookPlus className="mr-1 h-3.5 w-3.5" /> Fiche structurée
          </Button>

          <AiEntityGenerator
            campaignId={campaignId}
            system={system}
            open={generatorOpen}
            onOpenChange={setGeneratorOpen}
            initialKind={lastKind}
          />



          {QUICK_PROMPTS.map((q) => (
            <Button
              key={q.label}
              size="sm"
              variant="secondary"
              disabled={streaming}
              onClick={() => send(q.prompt, q.kind)}
            >
              {q.label}
            </Button>
          ))}
          {messages.length > 0 && (
            <Button size="sm" variant="ghost" onClick={newConversation} disabled={streaming}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nouvelle
            </Button>
          )}
        </div>

        <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border/60 bg-background/40">
          <div ref={scrollRef} className="space-y-3 p-3 sm:p-4">
            {loadingConversation && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" />
              </p>
            )}
            {!loadingConversation && messages.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Demandez un PNJ, un lieu, une quête ou un rebondissement.
                <br />
                L'assistant connaît votre campagne, votre codex et reste fidèle à votre système de jeu.
                <br />
                Vos échanges sont enregistrés : reprenez-les à tout moment depuis l'historique.
              </p>
            )}
            {messages.map((m, i) => (
              <Card
                key={i}
                className={`whitespace-pre-wrap p-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto max-w-[85%] border-primary/30 bg-primary/10"
                    : "mr-auto max-w-[95%] bg-card/70"
                }`}
              >
                {m.content || (streaming ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null)}
              </Card>
            ))}
          </div>
        </ScrollArea>

        {lastAnswer && !streaming && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={saveToCodex}>
              <BookPlus className="mr-1 h-3.5 w-3.5" /> Ajouter au Codex
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(lastAnswer);
                toast({ title: "Copié", description: "Réponse copiée dans le presse-papiers." });
              }}
            >
              <Copy className="mr-1 h-3.5 w-3.5" /> Copier
            </Button>
            {conversationId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  renameConversation(
                    conversationId,
                    history.find((h) => h.id === conversationId)?.title ?? deriveTitle(messages),
                  )
                }
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Renommer
              </Button>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Que voulez-vous préparer ?"
            rows={2}
            className="min-h-[56px] resize-none"
            disabled={streaming}
          />
          <Button onClick={() => send(input)} disabled={streaming || !input.trim()} className="h-[56px]">
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

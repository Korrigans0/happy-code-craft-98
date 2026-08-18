// AI Game Master assistant — GM only.
// Streams answers from the `mj-assistant` edge function, grounded in the campaign
// data, and lets the GM push a generated result straight into the campaign codex.

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, BookPlus, Trash2, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { codexApi } from "@/lib/codex/api";
import type { EntityKind } from "@/lib/codex/types";

const SUPABASE_URL =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined) ||
  "https://snawpxrejmcxfbiiowxr.supabase.co";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

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

export default function AIAssistant({ campaignId }: { campaignId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [lastKind, setLastKind] = useState<EntityKind>("npc");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
      }
    } catch (e: any) {
      setMessages((prev) => prev.slice(0, -1));
      toast({ title: "Assistant IA", description: e.message, variant: "destructive" });
    } finally {
      setStreaming(false);
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
      await codexApi.create(campaignId, "", {
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

  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
          <Sparkles className="h-3 w-3" /> Assistant MJ
        </Badge>
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
          <Button size="sm" variant="ghost" onClick={() => setMessages([])} disabled={streaming}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Effacer
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 rounded-lg border border-border/60 bg-background/40">
        <div ref={scrollRef} className="space-y-3 p-3 sm:p-4">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Demandez un PNJ, un lieu, une quête ou un rebondissement.
              <br />
              L'assistant connaît votre campagne, votre codex et reste fidèle à votre système de jeu.
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
        </div>
      )}

      <div className="flex items-end gap-2">
        <Textarea
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
  );
}

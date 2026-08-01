// MacroBar — barre de macros permanente (MJ et joueurs).
// Un clic exécute la macro : les variables sont résolues sur la fiche liée à
// l'instant du clic, puis le résultat part dans le chat de campagne.

import { useMemo, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { charactersApi, campaignsApi } from "@/lib/api";
import { useMacros } from "@/hooks/useMacros";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, MoreVertical, Copy, Pencil, Trash2, Sparkles, EyeOff, Users, GripVertical,
} from "lucide-react";
import MacroEditorDialog from "./MacroEditorDialog";
import { macroColorClass, type Macro, type MacroDraft } from "@/lib/macros/types";
import { resolveVariables } from "@/lib/macros/variables";
import { rollFormula, formatRoll, DiceError } from "@/lib/macros/engine";

interface Props {
  campaignId: string;
  isGM: boolean;
  system?: string | null;
}

const MacroBar = ({ campaignId, isGM, system }: Props) => {
  const queryClient = useQueryClient();
  const {
    macros, isLoading, userId,
    createMacro, updateMacro, deleteMacro, duplicateMacro, reorder, seedDefaults,
  } = useMacros(campaignId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Macro | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Toutes");
  const dragId = useRef<string | null>(null);

  const { data: characters = [] } = useQuery({
    queryKey: ["myCharacters"],
    queryFn: () => charactersApi.list(),
  });

  const sendMessage = useMutation({
    mutationFn: (data: { content: string; message_type: string; metadata?: any }) =>
      campaignsApi.postMessage(campaignId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["campaignMessages", campaignId] }),
    onError: (e: any) =>
      toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const categories = useMemo(() => {
    const set = new Set(macros.map((m) => m.category || "Général"));
    return ["Toutes", ...Array.from(set).sort()];
  }, [macros]);

  const visible = useMemo(
    () =>
      macros
        .filter((m) => activeCategory === "Toutes" || m.category === activeCategory)
        .sort((a, b) => a.sort_order - b.sort_order),
    [macros, activeCategory],
  );

  const execute = useCallback(
    (macro: Macro) => {
      const character = characters.find((c: any) => c.id === macro.character_id) ?? null;
      const systemId = character?.system ?? macro.system;
      const lines: string[] = [];
      const rolls: any[] = [];

      for (const action of macro.actions) {
        if (action.type === "text") {
          const { text } = resolveVariables(action.content, character, systemId);
          if (text.trim()) lines.push(text.trim());
          continue;
        }
        const { text, unknown } = resolveVariables(action.formula, character, systemId);
        if (unknown.length) {
          toast({
            title: "Variables inconnues",
            description: `${unknown.join(", ")} — remplacées par 0.`,
          });
        }
        try {
          const result = rollFormula(text);
          lines.push(formatRoll(result, action.label || undefined));
          rolls.push({
            label: action.label ?? null,
            dice: result.formula,
            results: result.results,
            total: result.total,
            modifier: result.modifier,
          });
        } catch (e) {
          toast({
            title: `Macro « ${macro.name} »`,
            description: e instanceof DiceError ? e.message : "Formule invalide",
            variant: "destructive",
          });
          return;
        }
      }

      if (!lines.length) return;
      const header = `⚔️ ${macro.name}`;
      sendMessage.mutate({
        content: [header, ...lines].join("\n"),
        message_type: macro.is_private_roll ? "whisper" : "dice_roll",
        metadata: {
          macro: macro.name,
          rolls,
          whisper: macro.is_private_roll || undefined,
          ...(rolls[0] ?? {}),
        },
      });
    },
    [characters, sendMessage],
  );

  const handleSubmit = (draft: MacroDraft) => {
    if (editing) updateMacro.mutate({ id: editing.id, patch: draft });
    else createMacro.mutate({ ...draft, sort_order: macros.length });
  };

  const handleDrop = (target: Macro) => {
    const sourceId = dragId.current;
    dragId.current = null;
    if (!sourceId || sourceId === target.id) return;
    const list = [...visible];
    const from = list.findIndex((m) => m.id === sourceId);
    const to = list.findIndex((m) => m.id === target.id);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    reorder.mutate(list);
  };

  return (
    <div className="flex flex-col rounded-xl border border-amber-500/25 bg-card/70 backdrop-blur-sm">
      {/* En-tête */}
      <div className="flex items-center gap-2 border-b border-amber-500/20 px-3 py-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <span className="font-display text-sm font-semibold text-gradient-gold">Macros</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost" size="sm" className="h-7 text-xs"
            onClick={() =>
              seedDefaults({
                system: system ?? "Aetheria",
                campaignId,
                characterId: characters[0]?.id ?? null,
              })
            }
          >
            Macros de base
          </Button>
          <Button
            size="sm" className="h-7 gap-1 text-xs"
            onClick={() => { setEditing(null); setEditorOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" /> Nouvelle
          </Button>
        </div>
      </div>

      {/* Catégories */}
      <div className="flex flex-wrap gap-1 px-3 py-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`rounded-md border px-2 py-0.5 text-[11px] transition ${
              activeCategory === c
                ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Liste */}
      <ScrollArea className="max-h-56">
        <div className="flex flex-wrap gap-2 p-3 pt-0">
          {isLoading && <p className="text-xs text-muted-foreground">Chargement…</p>}
          {!isLoading && visible.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Aucune macro. Créez-en une ou ajoutez les macros de base de votre système.
            </p>
          )}
          {visible.map((macro) => {
            const owned = macro.owner_user_id === userId;
            return (
              <div
                key={macro.id}
                draggable={owned}
                onDragStart={() => { dragId.current = macro.id; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(macro)}
                className={`group flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition hover:brightness-125 ${macroColorClass(macro.color)}`}
              >
                {owned && (
                  <GripVertical className="h-3 w-3 cursor-grab opacity-40 group-hover:opacity-80" />
                )}
                <button className="max-w-[160px] truncate font-medium" onClick={() => execute(macro)}>
                  {macro.name}
                </button>
                {macro.is_private_roll && <EyeOff className="h-3 w-3 opacity-70" />}
                {macro.is_shared && <Users className="h-3 w-3 opacity-70" />}
                {!owned && (
                  <Badge variant="outline" className="h-4 border-current/40 px-1 text-[9px]">MJ</Badge>
                )}
                {owned && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-50 hover:opacity-100">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(macro); setEditorOpen(true); }}>
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateMacro(macro)}>
                        <Copy className="mr-2 h-3.5 w-3.5" /> Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteMacro.mutate(macro.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <MacroEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        macro={editing}
        campaignId={campaignId}
        isGM={isGM}
        characters={characters as any[]}
        defaultSystem={system ?? "Aetheria"}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default MacroBar;

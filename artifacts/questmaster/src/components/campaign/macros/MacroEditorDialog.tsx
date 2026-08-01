// Éditeur de macro — création, édition, duplication.
// Aperçu live de la formule résolue avec les stats actuelles du personnage lié.

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Dices, MessageSquare } from "lucide-react";
import {
  MACRO_CATEGORIES, MACRO_COLORS,
  type Macro, type MacroAction, type MacroDraft,
} from "@/lib/macros/types";
import { listVariables, resolveVariables } from "@/lib/macros/variables";
import { rollFormula, DiceError } from "@/lib/macros/engine";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  macro: Macro | null;
  campaignId: string;
  isGM: boolean;
  characters: any[];
  defaultSystem: string;
  onSubmit: (draft: MacroDraft) => void;
}

const emptyDraft = (campaignId: string, system: string): MacroDraft => ({
  campaign_id: campaignId,
  character_id: null,
  system,
  name: "",
  category: "Général",
  icon: null,
  color: "amber",
  actions: [{ type: "roll", label: "Jet", formula: "1d20" }],
  is_shared: false,
  is_private_roll: false,
  sort_order: 0,
});

const MacroEditorDialog = ({
  open, onOpenChange, macro, campaignId, isGM, characters, defaultSystem, onSubmit,
}: Props) => {
  const [draft, setDraft] = useState<MacroDraft>(() => emptyDraft(campaignId, defaultSystem));

  useEffect(() => {
    if (!open) return;
    if (macro) {
      const { id, owner_user_id, created_at, updated_at, ...rest } = macro;
      setDraft(rest);
    } else {
      setDraft(emptyDraft(campaignId, defaultSystem));
    }
  }, [open, macro, campaignId, defaultSystem]);

  const linkedCharacter = useMemo(
    () => characters.find((c) => c.id === draft.character_id) ?? null,
    [characters, draft.character_id],
  );
  const systemId = linkedCharacter?.system ?? draft.system;
  const variables = useMemo(() => listVariables(systemId), [systemId]);

  const patch = (p: Partial<MacroDraft>) => setDraft((d) => ({ ...d, ...p }));

  const setAction = (index: number, action: MacroAction) =>
    patch({ actions: draft.actions.map((a, i) => (i === index ? action : a)) });

  const removeAction = (index: number) =>
    patch({ actions: draft.actions.filter((_, i) => i !== index) });

  const preview = (formula: string) => {
    const { text, unknown } = resolveVariables(formula, linkedCharacter, systemId);
    try {
      rollFormula(text);
      return { text, error: unknown.length ? `Variables inconnues : ${unknown.join(", ")}` : null };
    } catch (e) {
      return { text, error: e instanceof DiceError ? e.message : "Formule invalide" };
    }
  };

  const canSave = draft.name.trim().length > 0 && draft.actions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-amber-500/30 bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient-gold">
            {macro ? "Modifier la macro" : "Nouvelle macro"}
          </DialogTitle>
          <DialogDescription>
            Les variables sont résolues au moment du clic, avec les stats actuelles de la fiche liée.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Épée longue"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Select value={draft.category} onValueChange={(v) => patch({ category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MACRO_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Personnage lié</Label>
                <Select
                  value={draft.character_id ?? "none"}
                  onValueChange={(v) => {
                    const char = characters.find((c) => c.id === v);
                    patch({
                      character_id: v === "none" ? null : v,
                      system: char?.system ?? draft.system,
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Générique" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Générique (aucune fiche)</SelectItem>
                    {characters.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {MACRO_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => patch({ color: c.key })}
                      className={`h-7 rounded-md border px-2 text-[11px] ${c.class} ${
                        draft.color === c.key ? "ring-2 ring-amber-400/70" : ""
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Label>Actions (exécutées dans l'ordre)</Label>
              {draft.actions.map((action, i) => (
                <div key={i} className="rounded-lg border border-amber-500/20 bg-background/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {action.type === "roll" ? (
                      <Dices className="h-4 w-4 text-amber-400" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-sky-400" />
                    )}
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {action.type === "roll" ? "Jet de dés" : "Texte"}
                    </span>
                    <Button
                      variant="ghost" size="icon" className="ml-auto h-7 w-7"
                      onClick={() => removeAction(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {action.type === "roll" ? (
                    <>
                      <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                        <Input
                          value={action.label ?? ""}
                          onChange={(e) => setAction(i, { ...action, label: e.target.value })}
                          placeholder="Libellé (Attaque)"
                        />
                        <Input
                          value={action.formula}
                          onChange={(e) => setAction(i, { ...action, formula: e.target.value })}
                          placeholder="1d20+{FOR}"
                          className="font-mono"
                        />
                      </div>
                      {(() => {
                        const p = preview(action.formula);
                        return (
                          <p className={`text-xs ${p.error ? "text-red-400" : "text-muted-foreground"}`}>
                            {p.error ?? `Aperçu résolu : ${p.text}`}
                          </p>
                        );
                      })()}
                    </>
                  ) : (
                    <Textarea
                      value={action.content}
                      onChange={(e) => setAction(i, { ...action, content: e.target.value })}
                      placeholder="Description affichée dans le chat…"
                      rows={2}
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() =>
                    patch({ actions: [...draft.actions, { type: "roll", label: "", formula: "1d6" }] })
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Jet
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => patch({ actions: [...draft.actions, { type: "text", content: "" }] })}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Texte
                </Button>
              </div>
            </div>

            {/* Variables disponibles */}
            <div className="space-y-1.5">
              <Label>Variables disponibles ({systemId})</Label>
              <div className="flex flex-wrap gap-1">
                {variables.map((v) => (
                  <Badge
                    key={v.token}
                    variant="outline"
                    title={v.label}
                    className="cursor-pointer border-amber-500/30 font-mono text-[10px] hover:bg-amber-500/10"
                    onClick={() => {
                      const last = draft.actions.length - 1;
                      const a = draft.actions[last];
                      if (a && a.type === "roll") {
                        setAction(last, { ...a, formula: `${a.formula}+${v.token}` });
                      }
                    }}
                  >
                    {v.token}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 rounded-lg border border-amber-500/20 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Jet privé (chuchoté au MJ)</p>
                  <p className="text-xs text-muted-foreground">Seuls vous et le MJ voyez le résultat.</p>
                </div>
                <Switch
                  checked={draft.is_private_roll}
                  onCheckedChange={(v) => patch({ is_private_roll: v })}
                />
              </div>
              {isGM && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Macro de table (partagée)</p>
                    <p className="text-xs text-muted-foreground">
                      Visible et utilisable par tous les joueurs de la campagne.
                    </p>
                  </div>
                  <Switch
                    checked={draft.is_shared}
                    onCheckedChange={(v) => patch({ is_shared: v })}
                  />
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button disabled={!canSave} onClick={() => { onSubmit(draft); onOpenChange(false); }}>
            {macro ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MacroEditorDialog;

// Structured codex generation — the assistant fills a real sheet (sections,
// hooks, GM secret, tags) that the GM reviews before it lands in the codex.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, RefreshCw, BookPlus, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { codexApi } from "@/lib/codex/api";
import { ENTITY_KINDS, type EntityKind } from "@/lib/codex/types";
import { generateEntity, toEntityInput, type GeneratedEntity } from "@/lib/ai/generation";

interface Props {
  campaignId: string;
  system: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kind pre-selected when the dialog opens. */
  initialKind?: EntityKind;
}

// Kinds worth generating; "note" and "handout" stay manual.
const GENERATABLE: EntityKind[] = ["npc", "faction", "location", "quest", "item", "monster", "event"];

export default function AiEntityGenerator({
  campaignId,
  system,
  open,
  onOpenChange,
  initialKind = "npc",
}: Props) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<EntityKind>(initialKind);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<GeneratedEntity | null>(null);

  async function run() {
    setLoading(true);
    try {
      const gen = await generateEntity(campaignId, kind, brief);
      setResult(gen);
    } catch (e: any) {
      toast({ title: "Génération", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!result) return;
    setSaving(true);
    try {
      const created = await codexApi.create(campaignId, system, toEntityInput(kind, result));
      qc.invalidateQueries({ queryKey: ["codex", campaignId] });
      toast({
        title: "Fiche créée",
        description: `« ${created.name} » ajoutée au Codex en visibilité MJ.`,
      });
      setResult(null);
      setBrief("");
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Échec de l'ajout", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function patch(p: Partial<GeneratedEntity>) {
    setResult((r) => (r ? { ...r, ...p } : r));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Générer une fiche de Codex
          </DialogTitle>
          <DialogDescription>
            L'assistant écrit une fiche complète, fidèle à votre univers et à votre système. Relisez, ajustez, publiez.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[62vh] pr-3">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de fiche</Label>
              <div className="flex flex-wrap gap-1.5">
                {ENTITY_KINDS.filter((k) => GENERATABLE.includes(k.id)).map((k) => (
                  <Button
                    key={k.id}
                    type="button"
                    size="sm"
                    variant={kind === k.id ? "default" : "outline"}
                    onClick={() => setKind(k.id)}
                  >
                    <span className="mr-1">{k.emoji}</span>
                    {k.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Consignes (optionnel)</Label>
              <Textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={3}
                placeholder="Ex. : une prêtresse ambiguë liée à la faction rivale, qui pousse le groupe vers les catacombes."
              />
            </div>

            <Button onClick={run} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Écriture en cours…
                </>
              ) : result ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Régénérer
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Générer la fiche
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-3 border-t border-border/60 pt-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={result.name} onChange={(e) => patch({ name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Accroche</Label>
                  <Textarea
                    value={result.summary}
                    rows={2}
                    onChange={(e) => patch({ summary: e.target.value })}
                  />
                </div>

                {result.sections.map((s, i) => (
                  <div key={`${s.title}-${i}`} className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">{s.title}</Label>
                    <Textarea
                      value={s.body}
                      rows={3}
                      onChange={(e) => {
                        const sections = [...result.sections];
                        sections[i] = { ...s, body: e.target.value };
                        patch({ sections });
                      }}
                    />
                  </div>
                ))}

                {result.hooks.length > 0 && (
                  <Card className="space-y-1 bg-card/60 p-3">
                    <p className="text-xs font-medium text-primary">Accroches d'intrigue</p>
                    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {result.hooks.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {result.secret && (
                  <Card className="space-y-1 border-primary/30 bg-primary/5 p-3">
                    <p className="flex items-center gap-1 text-xs font-medium text-primary">
                      <EyeOff className="h-3 w-3" /> Secret MJ
                    </p>
                    <p className="text-sm text-muted-foreground">{result.secret}</p>
                  </Card>
                )}

                {result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={save} disabled={!result || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookPlus className="mr-2 h-4 w-4" />}
            Ajouter au Codex
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

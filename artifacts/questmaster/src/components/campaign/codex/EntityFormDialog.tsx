import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENTITY_KINDS, VISIBILITY_OPTIONS } from "@/lib/codex/types";
import type { CampaignEntity, EntityKind, EntityVisibility } from "@/lib/codex/types";
import type { EntityInput } from "@/lib/codex/api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entity?: CampaignEntity | null;
  defaultKind?: EntityKind;
  onSubmit: (input: EntityInput) => Promise<void> | void;
  saving?: boolean;
}

export default function EntityFormDialog({
  open, onOpenChange, entity, defaultKind = "npc", onSubmit, saving,
}: Props) {
  const [kind, setKind] = useState<EntityKind>(defaultKind);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [visibility, setVisibility] = useState<EntityVisibility>("gm_only");

  useEffect(() => {
    if (!open) return;
    setKind(entity?.kind ?? defaultKind);
    setName(entity?.name ?? "");
    setSummary(entity?.summary ?? "");
    setDescription(((entity?.content as any)?.description as string) ?? "");
    setTags((entity?.tags ?? []).join(", "));
    setImageUrl(entity?.image_url ?? "");
    setVisibility(entity?.visibility ?? "gm_only");
  }, [open, entity, defaultKind]);

  const submit = async () => {
    if (!name.trim()) return;
    await onSubmit({
      kind,
      name: name.trim(),
      summary: summary.trim() || null,
      content: { ...(entity?.content ?? {}), description },
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      image_url: imageUrl.trim() || null,
      visibility,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {entity ? "Modifier la fiche" : "Nouvelle fiche du Codex"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as EntityKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITY_KINDS.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.emoji} {k.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibilité</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as EntityVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-name">Nom</Label>
            <Input id="entity-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la fiche" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-summary">Résumé</Label>
            <Input id="entity-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Une phrase d'accroche" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-description">Description</Label>
            <Textarea
              id="entity-description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Histoire, apparence, motivations…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entity-tags">Tags (séparés par des virgules)</Label>
              <Input id="entity-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="brume, veilleurs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity-image">Illustration (URL)</Label>
              <Input id="entity-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={!name.trim() || saving}>
            {entity ? "Enregistrer" : "Créer la fiche"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

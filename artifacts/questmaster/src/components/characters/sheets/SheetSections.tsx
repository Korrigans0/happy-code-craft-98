// SheetSections — sections partagées entre toutes les fiches système.
// Header (avatar + nom + race/classe), section Notes/Inventaire/Histoire.

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Edit, User as UserIcon } from "lucide-react";
import type { SystemDefinition } from "@/lib/systems";

interface SheetHeaderProps {
  character: any;
  system: SystemDefinition;
  onClose?: () => void;
  onEdit?: () => void;
  editable?: boolean;
  onChange?: (key: string, value: any) => void;
}

export function SheetHeader({ character, system, onClose, onEdit, editable, onChange }: SheetHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border p-4 bg-card/40 backdrop-blur">
      <div className="flex items-center gap-3 min-w-0">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-14 w-14 rounded-full object-cover border-2 border-primary/50 shrink-0"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 shrink-0">
            <UserIcon className="h-7 w-7 text-primary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {editable && onChange ? (
              <Input
                value={character.name ?? ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="font-display text-lg font-bold h-8"
              />
            ) : (
              <h2 className="font-display text-xl font-bold text-foreground truncate">
                {character.name}
              </h2>
            )}
            <Badge variant="outline" className="shrink-0 border-primary/50 text-primary">
              {system.shortLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {character.race} • {character.class}
            {character.subclass && ` (${character.subclass})`} • Niv. {character.level ?? 1}
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" /> Modifier
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface NotesProps {
  character: any;
  editable?: boolean;
  onChange?: (key: string, value: any) => void;
}

export function SheetNotes({ character, editable, onChange }: NotesProps) {
  if (!editable && !character.backstory && !character.personality_traits) return null;
  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-semibold text-foreground">Histoire & Personnalité</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { key: "appearance",         label: "Apparence" },
          { key: "personality_traits", label: "Traits de personnalité" },
          { key: "ideals",             label: "Idéaux" },
          { key: "bonds",              label: "Liens" },
          { key: "flaws",              label: "Défauts" },
          { key: "backstory",          label: "Histoire" },
        ].map(({ key, label }) => (
          <div key={key} className={key === "backstory" ? "sm:col-span-2" : ""}>
            <label className="text-xs font-medium text-primary">{label}</label>
            {editable && onChange ? (
              <Textarea
                value={character[key] ?? ""}
                onChange={(e) => onChange(key, e.target.value)}
                className="mt-1 min-h-[60px] text-sm"
              />
            ) : (
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                {character[key] || <span className="italic">Non renseigné</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SheetInventory({ character, editable, onChange }: NotesProps) {
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold text-foreground">Inventaire</h3>
      {editable && onChange ? (
        <Textarea
          value={character.inventory ?? ""}
          onChange={(e) => onChange("inventory", e.target.value)}
          className="min-h-[100px] text-sm font-mono"
          placeholder="Une ligne par objet..."
        />
      ) : (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {character.inventory || <span className="italic">Sac vide</span>}
          </p>
        </div>
      )}
    </div>
  );
}

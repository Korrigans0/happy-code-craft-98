// HomebrewSheet — fiche personnalisable. Le MJ/PJ peut ajouter ses propres
// caractéristiques, ressources et champs libres. Tout est stocké dans
// characters.system_data (jsonb) : `custom_stats`, `custom_resources`, `custom_fields`.

import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Heart, Plus, Trash2 } from "lucide-react";
import { CUSTOM_SYSTEM } from "@/lib/systems/custom";
import { SheetHeader, SheetNotes, SheetInventory } from "./SheetSections";
import { useAutosave } from "./useAutosave";

interface HomebrewSheetProps {
  character: any;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
}

interface CustomField {
  key: string;
  label: string;
  value: number | string;
}

const HomebrewSheet = ({ character, editable = false, onSave, onClose, onEdit }: HomebrewSheetProps) => {
  const handleSave = useMemo(() => onSave ?? (() => {}), [onSave]);
  const { local, update } = useAutosave<any>(character, handleSave);
  const sysData = (local.system_data as Record<string, any>) ?? {};

  const customStats: CustomField[] = sysData.custom_stats ?? [];
  const customResources: Array<CustomField & { max?: number }> = sysData.custom_resources ?? [];
  const customFields: CustomField[] = sysData.custom_fields ?? [];

  const updateSysData = (patch: Record<string, any>) => {
    update("system_data", { ...sysData, ...patch });
  };

  const addStat = () => {
    const next = [...customStats, { key: `stat_${customStats.length}`, label: "Nouvelle stat", value: 0 }];
    updateSysData({ custom_stats: next });
  };
  const setStat = (i: number, patch: Partial<CustomField>) => {
    const next = customStats.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    updateSysData({ custom_stats: next });
  };
  const removeStat = (i: number) => updateSysData({ custom_stats: customStats.filter((_, idx) => idx !== i) });

  const addResource = () => {
    const next = [...customResources, { key: `res_${customResources.length}`, label: "Ressource", value: 0, max: 10 }];
    updateSysData({ custom_resources: next });
  };
  const setResource = (i: number, patch: any) => {
    const next = customResources.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    updateSysData({ custom_resources: next });
  };
  const removeResource = (i: number) => updateSysData({ custom_resources: customResources.filter((_, idx) => idx !== i) });

  const addField = () => {
    const next = [...customFields, { key: `field_${customFields.length}`, label: "Champ libre", value: "" }];
    updateSysData({ custom_fields: next });
  };
  const setField = (i: number, patch: Partial<CustomField>) => {
    const next = customFields.map((f, idx) => (idx === i ? { ...f, ...patch } : f));
    updateSysData({ custom_fields: next });
  };
  const removeField = (i: number) => updateSysData({ custom_fields: customFields.filter((_, idx) => idx !== i) });

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/80">
      <SheetHeader
        character={local}
        system={CUSTOM_SYSTEM}
        onClose={onClose}
        onEdit={!editable ? onEdit : undefined}
        editable={editable}
        onChange={update}
      />

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {editable && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label className="text-xs">Race</Label>
                <Input value={local.race ?? ""} onChange={(e) => update("race", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Classe</Label>
                <Input value={local.class ?? ""} onChange={(e) => update("class", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Niveau</Label>
                <Input type="number" min={1} value={local.level ?? 1}
                  onChange={(e) => update("level", Number(e.target.value) || 1)} />
              </div>
              <div>
                <Label className="text-xs">Vitesse</Label>
                <Input type="number" value={local.speed ?? 0}
                  onChange={(e) => update("speed", Number(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* PV — toujours présent */}
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 flex items-center gap-3">
            <Heart className="h-5 w-5 text-red-400" />
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Points de vie</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input type="number" value={local.hp ?? 10}
                  onChange={(e) => update("hp", Number(e.target.value) || 0)}
                  className="h-8 w-20" disabled={!editable} />
                <span>/</span>
                <Input type="number" value={local.max_hp ?? 10}
                  onChange={(e) => update("max_hp", Number(e.target.value) || 0)}
                  className="h-8 w-20" disabled={!editable} />
              </div>
            </div>
          </div>

          {/* Caractéristiques personnalisées */}
          <SectionEditor
            title="Caractéristiques personnalisées"
            items={customStats}
            editable={editable}
            onAdd={addStat}
            renderItem={(s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                <Input value={s.label} onChange={(e) => setStat(i, { label: e.target.value })}
                  disabled={!editable} className="h-8 flex-1" />
                <Input type="number" value={s.value as number}
                  onChange={(e) => setStat(i, { value: Number(e.target.value) || 0 })}
                  disabled={!editable} className="h-8 w-20 text-center font-bold" />
                {editable && (
                  <Button size="icon" variant="ghost" onClick={() => removeStat(i)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            )}
          />

          {/* Ressources personnalisées */}
          <SectionEditor
            title="Ressources (mana, énergie, charges...)"
            items={customResources}
            editable={editable}
            onAdd={addResource}
            renderItem={(r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                <Input value={r.label} onChange={(e) => setResource(i, { label: e.target.value })}
                  disabled={!editable} className="h-8 flex-1" />
                <Input type="number" value={r.value as number}
                  onChange={(e) => setResource(i, { value: Number(e.target.value) || 0 })}
                  disabled={!editable} className="h-8 w-16" />
                <span>/</span>
                <Input type="number" value={r.max ?? 0}
                  onChange={(e) => setResource(i, { max: Number(e.target.value) || 0 })}
                  disabled={!editable} className="h-8 w-16" />
                {editable && (
                  <Button size="icon" variant="ghost" onClick={() => removeResource(i)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            )}
          />

          {/* Champs libres */}
          <SectionEditor
            title="Champs libres (texte)"
            items={customFields}
            editable={editable}
            onAdd={addField}
            renderItem={(f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                <Input value={f.label} onChange={(e) => setField(i, { label: e.target.value })}
                  disabled={!editable} className="h-8 w-1/3" />
                <Input value={f.value as string} onChange={(e) => setField(i, { value: e.target.value })}
                  disabled={!editable} className="h-8 flex-1" />
                {editable && (
                  <Button size="icon" variant="ghost" onClick={() => removeField(i)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            )}
          />

          <SheetInventory character={local} editable={editable} onChange={update} />
          <SheetNotes character={local} editable={editable} onChange={update} />
        </div>
      </ScrollArea>
    </div>
  );
};

function SectionEditor<T>({
  title, items, editable, onAdd, renderItem,
}: {
  title: string;
  items: T[];
  editable?: boolean;
  onAdd: () => void;
  renderItem: (item: T, i: number) => React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        {editable && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="mr-1 h-3 w-3" /> Ajouter
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            {editable ? "Aucun élément — cliquez sur Ajouter." : "Aucun élément défini."}
          </p>
        ) : (
          items.map(renderItem)
        )}
      </div>
    </div>
  );
}

export default HomebrewSheet;

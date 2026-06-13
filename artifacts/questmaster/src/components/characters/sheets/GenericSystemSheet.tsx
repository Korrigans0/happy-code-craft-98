// GenericSystemSheet — fiche pilotée par SystemDefinition.
// Utilisée pour les systèmes sans fiche React dédiée (Pathfinder 2e, CoC).
// Affiche stats, défenses, compétences, ressources selon la définition.

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import type { SystemDefinition } from "@/lib/systems";
import { SheetHeader, SheetNotes, SheetInventory } from "./SheetSections";
import { useAutosave } from "./useAutosave";

interface GenericSystemSheetProps {
  character: any;
  system: SystemDefinition;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
}

function fmt(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

const GenericSystemSheet = ({ character, system, editable = false, onSave, onClose, onEdit }: GenericSystemSheetProps) => {
  const handleSave = useMemo(() => onSave ?? (() => {}), [onSave]);
  const { local, update } = useAutosave<any>(character, handleSave);
  const sysData = (local.system_data as Record<string, any>) ?? {};

  // Stats lues dans system_data.stats (clés du système, ex: STR, DEX, POU…)
  const statsValues: Record<string, number> = sysData.stats ?? {};
  const updateSysData = (patch: Record<string, any>) => update("system_data", { ...sysData, ...patch });

  const setStat = (key: string, value: number) => {
    updateSysData({ stats: { ...statsValues, [key]: value } });
  };

  const calc = system.calculations;
  const ctxStats: Record<string, number> = {};
  for (const s of system.stats) {
    const v = statsValues[s.key] ?? s.default;
    ctxStats[s.key] = calc?.statModifier(s, v) ?? v;
  }

  const defenseValues: Record<string, number> = sysData.defenses ?? {};

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/80">
      <SheetHeader
        character={local}
        system={system}
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
                <Label className="text-xs">{system.raceLabel}</Label>
                <Input value={local.race ?? ""} onChange={(e) => update("race", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{system.classLabel}</Label>
                <Input value={local.class ?? ""} onChange={(e) => update("class", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Niveau</Label>
                <Input type="number" min={1} value={local.level ?? 1}
                  onChange={(e) => update("level", Number(e.target.value) || 1)} />
              </div>
              <div>
                <Label className="text-xs">Vit. ({system.speedUnit})</Label>
                <Input type="number" value={local.speed ?? 0}
                  onChange={(e) => update("speed", Number(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* PV */}
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <Heart className="h-5 w-5 text-red-400" />
            <Label className="text-xs">PV</Label>
            <Input type="number" value={local.hp ?? 10}
              onChange={(e) => update("hp", Number(e.target.value) || 0)}
              className="h-8 w-20" disabled={!editable} />
            <span>/</span>
            <Input type="number" value={local.max_hp ?? 10}
              onChange={(e) => update("max_hp", Number(e.target.value) || 0)}
              className="h-8 w-20" disabled={!editable} />
          </div>

          {/* Caractéristiques */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Caractéristiques</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {system.stats.map((s) => {
                const v = statsValues[s.key] ?? s.default;
                const m = calc?.statModifier(s, v) ?? v;
                return (
                  <div key={s.key} className="rounded-lg border border-border bg-card p-3" title={s.longLabel}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
                      {s.mode !== "percentage" && (
                        <span className="text-sm font-bold text-primary">{fmt(m)}</span>
                      )}
                    </div>
                    {editable ? (
                      <Input
                        type="number" min={s.min} max={s.max} value={v}
                        onChange={(e) => setStat(s.key, Number(e.target.value) || s.default)}
                        className="mt-1 h-8 text-center text-lg font-bold"
                      />
                    ) : (
                      <div className="mt-1 text-center text-lg font-bold">
                        {v}{s.mode === "percentage" ? "%" : ""}
                      </div>
                    )}
                    {s.mode === "percentage" && (
                      <div className="mt-1 text-center text-[10px] text-muted-foreground">
                        ½: {Math.floor(v / 2)} • ⅕: {Math.floor(v / 5)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Défenses */}
          {system.defenses.length > 0 && (
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold">Défenses</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {system.defenses.map((d) => (
                  <div key={d.key} className="rounded-lg border border-border bg-card p-2 text-center">
                    <div className="text-xs text-muted-foreground">{d.label}</div>
                    {editable ? (
                      <Input type="number" value={defenseValues[d.key] ?? d.default}
                        onChange={(e) => updateSysData({ defenses: { ...defenseValues, [d.key]: Number(e.target.value) || d.default } })}
                        className="mt-1 h-8 text-center text-lg font-bold" />
                    ) : (
                      <div className="text-lg font-bold">{defenseValues[d.key] ?? d.default}</div>
                    )}
                    {d.hint && <div className="text-[10px] text-muted-foreground">{d.hint}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compétences */}
          {(system.skills?.length ?? 0) > 0 && (
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold">Compétences</h3>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {system.skills!.map((sk) => {
                  const stat = system.stats.find((s) => s.key === sk.stat);
                  const v = stat ? statsValues[stat.key] ?? stat.default : 0;
                  const m = stat ? calc?.statModifier(stat, v) ?? v : 0;
                  return (
                    <div key={sk.key} className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm truncate">{sk.label}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">({sk.stat})</span>
                      </div>
                      <span className="text-sm font-mono font-semibold text-primary">
                        {stat?.mode === "percentage" ? `${v}%` : fmt(m)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ressources additionnelles */}
          {(system.resources?.length ?? 0) > 1 && (
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold">Ressources</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {system.resources!.filter((r) => r.key !== "hp").map((r) => {
                  const value = sysData[`res_${r.key}`] ?? 0;
                  const max = sysData[`res_${r.key}_max`] ?? 0;
                  return (
                    <div key={r.key} className="rounded-lg border border-border bg-card p-2">
                      <div className="text-xs text-muted-foreground">{r.label}</div>
                      <div className="flex items-center gap-1">
                        <Input type="number" value={value}
                          onChange={(e) => updateSysData({ [`res_${r.key}`]: Number(e.target.value) || 0 })}
                          className="h-7 w-14 text-xs" disabled={!editable} />
                        <span>/</span>
                        <Input type="number" value={max}
                          onChange={(e) => updateSysData({ [`res_${r.key}_max`]: Number(e.target.value) || 0 })}
                          className="h-7 w-14 text-xs" disabled={!editable} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <SheetInventory character={local} editable={editable} onChange={update} />
          <SheetNotes character={local} editable={editable} onChange={update} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default GenericSystemSheet;

// Dnd5eSheet — fiche dédiée D&D 5e.
// Scores 1-20, modificateurs dérivés, bonus de maîtrise, jets de sauvegarde,
// 18 compétences SRD, CA, vitesse en ft, slots de sorts, inventaire.
// Autosave 800 ms via useAutosave.

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Shield, Footprints, Zap, Sparkles, Sword } from "lucide-react";
import { DND5E_SYSTEM } from "@/lib/systems/dnd5e";
import { SheetHeader, SheetNotes, SheetInventory } from "./SheetSections";
import { useAutosave } from "./useAutosave";

interface Dnd5eSheetProps {
  character: any;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
}

const STAT_MAP: Array<{ key: string; field: string; label: string; long: string }> = [
  { key: "STR", field: "strength",     label: "FOR", long: "Force" },
  { key: "DEX", field: "dexterity",    label: "DEX", long: "Dextérité" },
  { key: "CON", field: "constitution", label: "CON", long: "Constitution" },
  { key: "INT", field: "intelligence", label: "INT", long: "Intelligence" },
  { key: "WIS", field: "wisdom",       label: "SAG", long: "Sagesse" },
  { key: "CHA", field: "charisma",     label: "CHA", long: "Charisme" },
];

const STAT_FIELD_BY_KEY: Record<string, string> = Object.fromEntries(
  STAT_MAP.map((s) => [s.key, s.field]),
);

function mod(score: number) {
  return Math.floor(((score ?? 10) - 10) / 2);
}
function fmtMod(m: number) {
  return m >= 0 ? `+${m}` : `${m}`;
}

const Dnd5eSheet = ({ character, editable = false, onSave, onClose, onEdit }: Dnd5eSheetProps) => {
  const handleSave = useMemo(() => onSave ?? (() => {}), [onSave]);
  const { local, update } = useAutosave<any>(character, handleSave);

  const level = local.level ?? 1;
  const calc = DND5E_SYSTEM.calculations!;
  const stats: Record<string, number> = Object.fromEntries(
    STAT_MAP.map((s) => [s.key, local[s.field] ?? 10]),
  );
  const profBonus = calc.proficiencyBonus!({ level, stats });
  const saveDC = calc.spellSaveDC?.({ level, stats, systemData: local.system_data ?? {} }) ?? 8;

  const skills = DND5E_SYSTEM.skills ?? [];
  const proficientSkills = (local.skills as string[]) ?? [];
  const savingThrows = (local.saving_throws as string[]) ?? [];

  const toggleSkill = (key: string) => {
    if (!editable) return;
    const next = proficientSkills.includes(key)
      ? proficientSkills.filter((s) => s !== key)
      : [...proficientSkills, key];
    update("skills", next);
  };

  const toggleSave = (statKey: string) => {
    if (!editable) return;
    const next = savingThrows.includes(statKey)
      ? savingThrows.filter((s) => s !== statKey)
      : [...savingThrows, statKey];
    update("saving_throws", next);
  };

  const sysData = (local.system_data as Record<string, any>) ?? {};
  const updateSystemData = (key: string, value: any) => {
    update("system_data", { ...sysData, [key]: value });
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/80">
      <SheetHeader
        character={local}
        system={DND5E_SYSTEM}
        onClose={onClose}
        onEdit={!editable ? onEdit : undefined}
        editable={editable}
        onChange={update}
      />

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Identité */}
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
                <Label className="text-xs">Archétype</Label>
                <Input value={local.subclass ?? ""} onChange={(e) => update("subclass", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Niveau</Label>
                <Input
                  type="number" min={1} max={20}
                  value={local.level ?? 1}
                  onChange={(e) => update("level", Number(e.target.value) || 1)}
                />
              </div>
            </div>
          )}

          {/* Combat */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <CombatStat icon={<Heart className="h-4 w-4 text-red-400" />} label="PV"
              value={`${local.hp ?? 0}/${local.max_hp ?? 0}`}
              editable={editable}
              onChange={(v) => update("hp", Number(v) || 0)} editValue={local.hp ?? 0}
              onChangeMax={(v) => update("max_hp", Number(v) || 0)} editMax={local.max_hp ?? 0}
              hasMax />
            <CombatStat icon={<Shield className="h-4 w-4 text-blue-400" />} label="CA"
              value={local.armor_class ?? 10}
              editable={editable} onChange={(v) => update("armor_class", Number(v) || 10)} editValue={local.armor_class ?? 10} />
            <CombatStat icon={<Zap className="h-4 w-4 text-amber-400" />} label="Maîtrise" value={fmtMod(profBonus)} />
            <CombatStat icon={<Footprints className="h-4 w-4 text-emerald-400" />} label="Vit. (ft)"
              value={local.speed ?? 30}
              editable={editable} onChange={(v) => update("speed", Number(v) || 30)} editValue={local.speed ?? 30} />
            <CombatStat icon={<Sword className="h-4 w-4 text-orange-400" />} label="Init."
              value={fmtMod(mod(local.dexterity ?? 10))} />
          </div>

          {/* Caractéristiques + jets de sauvegarde */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Caractéristiques</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {STAT_MAP.map(({ key, field, label, long }) => {
                const value = local[field] ?? 10;
                const m = mod(value);
                const profSave = savingThrows.includes(key);
                const saveTotal = m + (profSave ? profBonus : 0);
                return (
                  <div key={key} className="rounded-lg border border-border bg-card p-3" title={long}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                      <span className="text-sm font-bold text-primary">{fmtMod(m)}</span>
                    </div>
                    {editable ? (
                      <Input
                        type="number" min={1} max={30}
                        value={value}
                        onChange={(e) => update(field as any, Number(e.target.value) || 10)}
                        className="mt-1 h-8 text-center text-lg font-bold"
                      />
                    ) : (
                      <div className="mt-1 text-center text-lg font-bold">{value}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSave(key)}
                      className={`mt-2 flex w-full items-center justify-between rounded px-1 py-0.5 text-[10px] transition ${
                        profSave ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/30"
                      }`}
                      disabled={!editable}
                      title="Jet de sauvegarde"
                    >
                      <span>Sauv.</span>
                      <span className="font-semibold">{fmtMod(saveTotal)}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compétences */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Compétences</h3>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((sk) => {
                const value = local[STAT_FIELD_BY_KEY[sk.stat]] ?? 10;
                const m = mod(value);
                const prof = proficientSkills.includes(sk.key);
                const total = m + (prof ? profBonus : 0);
                return (
                  <label
                    key={sk.key}
                    className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox checked={prof} onCheckedChange={() => toggleSkill(sk.key)} disabled={!editable} />
                      <span className="text-sm truncate">{sk.label}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">({sk.stat})</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-primary">{fmtMod(total)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Sorts */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-purple-400" /> Lancement de sorts
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label className="text-xs">Caractéristique</Label>
                {editable ? (
                  <select
                    value={sysData.spellcastingAbility ?? "WIS"}
                    onChange={(e) => updateSystemData("spellcastingAbility", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    {STAT_MAP.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                ) : (
                  <div className="rounded-md border border-border bg-card px-2 py-1 text-sm">
                    {sysData.spellcastingAbility ?? "—"}
                  </div>
                )}
              </div>
              <CombatStat label="DD Sort" value={saveDC} />
              <CombatStat label="Att. Sort"
                value={fmtMod(mod(stats[sysData.spellcastingAbility ?? "WIS"] ?? 10) + profBonus)} />
              <CombatStat label="Or" value={local.gold ?? 0}
                editable={editable} onChange={(v) => update("gold", Number(v) || 0)} editValue={local.gold ?? 0} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const slotKey = `slot${lvl}`;
                const used = sysData[`${slotKey}_used`] ?? 0;
                const max = sysData[`${slotKey}_max`] ?? 0;
                return (
                  <div key={lvl} className="rounded border border-purple-500/30 bg-purple-500/5 p-2">
                    <div className="text-[10px] text-purple-300">Niv. {lvl}</div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" min={0}
                        value={used}
                        onChange={(e) => updateSystemData(`${slotKey}_used`, Number(e.target.value) || 0)}
                        className="h-7 w-12 text-xs"
                        disabled={!editable}
                      />
                      <span className="text-xs">/</span>
                      <Input
                        type="number" min={0}
                        value={max}
                        onChange={(e) => updateSystemData(`${slotKey}_max`, Number(e.target.value) || 0)}
                        className="h-7 w-12 text-xs"
                        disabled={!editable}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <SheetInventory character={local} editable={editable} onChange={update} />
          <SheetNotes character={local} editable={editable} onChange={update} />
        </div>
      </ScrollArea>
    </div>
  );
};

interface CombatStatProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  editable?: boolean;
  editValue?: number;
  onChange?: (v: string) => void;
  hasMax?: boolean;
  editMax?: number;
  onChangeMax?: (v: string) => void;
}
function CombatStat({ icon, label, value, editable, editValue, onChange, hasMax, editMax, onChangeMax }: CombatStatProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card p-2">
      {icon && <div className="mb-1">{icon}</div>}
      {editable && onChange ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={editValue ?? 0}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-14 text-center text-base font-bold"
          />
          {hasMax && onChangeMax && (
            <>
              <span className="text-xs">/</span>
              <Input
                type="number"
                value={editMax ?? 0}
                onChange={(e) => onChangeMax(e.target.value)}
                className="h-7 w-14 text-center text-base font-bold"
              />
            </>
          )}
        </div>
      ) : (
        <span className="text-lg font-bold">{value}</span>
      )}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default Dnd5eSheet;

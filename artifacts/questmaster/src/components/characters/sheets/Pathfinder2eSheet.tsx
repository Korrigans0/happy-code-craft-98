// Pathfinder2eSheet — fiche dédiée Pathfinder 2e.
// Ascendance / Héritage / Origine / Classe — Niveau — Tradition.
// Caractéristiques en modificateurs, défenses (CA, Réflexes/Vigueur/Volonté avec
// niveaux de maîtrise U/T/E/M/L), PV, Vitesse, Points de Héros, compétences avec
// rangs de maîtrise, actions/réactions, inventaire et notes.

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Shield, Footprints, Sparkles, Crown } from "lucide-react";
import { PF2E_SYSTEM } from "@/lib/systems/pathfinder2e";
import { SheetHeader, SheetNotes, SheetInventory } from "./SheetSections";
import { useAutosave } from "./useAutosave";

interface Props {
  character: any;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
}

const PROF_TIERS = [
  { key: "U", label: "Non-formé", bonus: 0 },
  { key: "T", label: "Formé",     bonus: 2 },
  { key: "E", label: "Expert",    bonus: 4 },
  { key: "M", label: "Maître",    bonus: 6 },
  { key: "L", label: "Légendaire",bonus: 8 },
];

function fmt(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

const Pathfinder2eSheet = ({ character, editable = false, onSave, onClose, onEdit }: Props) => {
  const handleSave = useMemo(() => onSave ?? (() => {}), [onSave]);
  const { local, update } = useAutosave<any>(character, handleSave);

  const sysData = (local.system_data as Record<string, any>) ?? {};
  const updateSysData = (patch: Record<string, any>) =>
    update("system_data", { ...sysData, ...patch });

  const level = local.level ?? 1;
  const statsValues: Record<string, number> = sysData.stats ?? {};
  const setStat = (key: string, v: number) =>
    updateSysData({ stats: { ...statsValues, [key]: v } });

  // PF2 utilise des modificateurs directs (mode "modifier"). Le total d'un jet
  // = modificateur + niveau + bonus de maîtrise.
  const profTier = (key: string): string => sysData.prof?.[key] ?? "U";
  const setProfTier = (key: string, tier: string) =>
    updateSysData({ prof: { ...(sysData.prof ?? {}), [key]: tier } });
  const profBonus = (key: string): number => {
    const t = PROF_TIERS.find((p) => p.key === profTier(key));
    if (!t || t.key === "U") return 0;
    return level + t.bonus;
  };

  const saves = [
    { key: "fortitude", label: "Vigueur",   stat: "CON" },
    { key: "reflex",    label: "Réflexes",  stat: "DEX" },
    { key: "will",      label: "Volonté",   stat: "WIS" },
  ];

  const heroPoints = sysData.hero_points ?? 1;
  const focus = sysData.focus ?? 0;
  const focusMax = sysData.focus_max ?? 0;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/80">
      <SheetHeader
        character={local}
        system={PF2E_SYSTEM}
        onClose={onClose}
        onEdit={!editable ? onEdit : undefined}
        editable={editable}
        onChange={update}
      />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Identité */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Ascendance" value={local.race} onChange={(v) => update("race", v)} editable={editable} />
            <Field label="Héritage"   value={sysData.heritage} onChange={(v) => updateSysData({ heritage: v })} editable={editable} />
            <Field label="Origine"    value={sysData.background} onChange={(v) => updateSysData({ background: v })} editable={editable} />
            <Field label="Classe"     value={local.class} onChange={(v) => update("class", v)} editable={editable} />
            <Field label="Alignement" value={local.alignment} onChange={(v) => update("alignment", v)} editable={editable} />
            <Field label="Divinité"   value={sysData.deity} onChange={(v) => updateSysData({ deity: v })} editable={editable} />
            <Field label="Taille"     value={sysData.size} onChange={(v) => updateSysData({ size: v })} editable={editable} />
            <div>
              <Label className="text-xs">Niveau</Label>
              <Input type="number" min={1} max={20} value={level}
                onChange={(e) => update("level", Number(e.target.value) || 1)} disabled={!editable} />
            </div>
          </div>

          {/* Combat */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Combat icon={<Heart className="h-4 w-4 text-red-400" />} label="PV"
              cur={local.hp ?? 0} max={local.max_hp ?? 0}
              onCur={(v) => update("hp", v)} onMax={(v) => update("max_hp", v)} editable={editable} hasMax />
            <Combat icon={<Shield className="h-4 w-4 text-blue-400" />} label="CA"
              cur={local.armor_class ?? 10} onCur={(v) => update("armor_class", v)} editable={editable} />
            <Combat icon={<Footprints className="h-4 w-4 text-emerald-400" />} label={`Vit. (${PF2E_SYSTEM.speedUnit})`}
              cur={local.speed ?? 25} onCur={(v) => update("speed", v)} editable={editable} />
            <Combat icon={<Crown className="h-4 w-4 text-amber-400" />} label="Pts héros"
              cur={heroPoints} onCur={(v) => updateSysData({ hero_points: v })} editable={editable} />
            <Combat icon={<Sparkles className="h-4 w-4 text-violet-400" />} label="Focus"
              cur={focus} max={focusMax}
              onCur={(v) => updateSysData({ focus: v })} onMax={(v) => updateSysData({ focus_max: v })}
              editable={editable} hasMax />
          </div>

          {/* Caractéristiques */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Caractéristiques</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {PF2E_SYSTEM.stats.map((s) => {
                const v = statsValues[s.key] ?? s.default;
                return (
                  <div key={s.key} className="rounded-lg border border-border bg-card p-3" title={s.longLabel}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
                      <span className="text-sm font-bold text-primary">{fmt(v)}</span>
                    </div>
                    {editable ? (
                      <Input type="number" min={s.min} max={s.max} value={v}
                        onChange={(e) => setStat(s.key, Number(e.target.value) || s.default)}
                        className="mt-1 h-8 text-center text-lg font-bold" />
                    ) : (
                      <div className="mt-1 text-center text-lg font-bold">{fmt(v)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jets de sauvegarde */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Jets de sauvegarde</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {saves.map((sv) => {
                const m = statsValues[sv.stat] ?? 0;
                const pb = profBonus(`save_${sv.key}`);
                const total = m + pb;
                return (
                  <div key={sv.key} className="flex items-center justify-between rounded-lg border border-border bg-card p-2">
                    <div>
                      <div className="text-xs text-muted-foreground">{sv.label}</div>
                      <div className="text-[10px] text-muted-foreground">({sv.stat})</div>
                    </div>
                    <ProfPicker
                      tier={profTier(`save_${sv.key}`)}
                      onChange={(t) => setProfTier(`save_${sv.key}`, t)}
                      disabled={!editable}
                    />
                    <span className="text-lg font-bold text-primary">{fmt(total)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compétences */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Compétences</h3>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {(PF2E_SYSTEM.skills ?? []).map((sk) => {
                const m = statsValues[sk.stat] ?? 0;
                const pb = profBonus(`skill_${sk.key}`);
                const total = m + pb;
                return (
                  <div key={sk.key} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/30">
                    <span className="text-sm flex-1 truncate">{sk.label}</span>
                    <span className="text-[10px] text-muted-foreground">({sk.stat})</span>
                    <ProfPicker
                      tier={profTier(`skill_${sk.key}`)}
                      onChange={(t) => setProfTier(`skill_${sk.key}`, t)}
                      disabled={!editable}
                    />
                    <span className="text-sm font-mono font-semibold text-primary w-10 text-right">
                      {fmt(total)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              U Non-formé · T Formé (+2) · E Expert (+4) · M Maître (+6) · L Légendaire (+8) — sauf U : bonus = mod + niveau + rang.
            </p>
          </div>

          {/* Actions / Réactions */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Block label="Actions & activités" value={sysData.actions} onChange={(v) => updateSysData({ actions: v })} editable={editable} />
            <Block label="Réactions" value={sysData.reactions} onChange={(v) => updateSysData({ reactions: v })} editable={editable} />
            <Block label="Dons d'ascendance" value={sysData.ancestry_feats} onChange={(v) => updateSysData({ ancestry_feats: v })} editable={editable} />
            <Block label="Dons de classe" value={sysData.class_feats} onChange={(v) => updateSysData({ class_feats: v })} editable={editable} />
            <Block label="Dons de compétence" value={sysData.skill_feats} onChange={(v) => updateSysData({ skill_feats: v })} editable={editable} />
            <Block label="Dons généraux" value={sysData.general_feats} onChange={(v) => updateSysData({ general_feats: v })} editable={editable} />
          </div>

          {/* Sorts */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Sorts & magie</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Field label="Tradition" value={sysData.spell_tradition} onChange={(v) => updateSysData({ spell_tradition: v })} editable={editable} />
              <Field label="Caractéristique" value={sysData.spellcastingAbility} onChange={(v) => updateSysData({ spellcastingAbility: v })} editable={editable} placeholder="WIS/CHA/INT…" />
              <Field label="DD de sort" value={sysData.spell_dc} onChange={(v) => updateSysData({ spell_dc: v })} editable={editable} type="number" />
              <Field label="Attaque sort" value={sysData.spell_attack} onChange={(v) => updateSysData({ spell_attack: v })} editable={editable} type="number" />
            </div>
            <div className="mt-2">
              <Block label="Sorts connus / préparés" value={sysData.spells} onChange={(v) => updateSysData({ spells: v })} editable={editable} />
            </div>
          </div>

          <SheetInventory character={local} editable={editable} onChange={update} />
          <SheetNotes character={local} editable={editable} onChange={update} />
        </div>
      </ScrollArea>
    </div>
  );
};

function ProfPicker({ tier, onChange, disabled }: { tier: string; onChange: (t: string) => void; disabled?: boolean }) {
  return (
    <select
      value={tier}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded border border-input bg-background px-1 py-0.5 text-[10px] font-semibold"
      title={PROF_TIERS.find((p) => p.key === tier)?.label}
    >
      {PROF_TIERS.map((p) => <option key={p.key} value={p.key}>{p.key}</option>)}
    </select>
  );
}

function Field({ label, value, onChange, editable, placeholder, type = "text" }: { label: string; value: any; onChange: (v: any) => void; editable?: boolean; placeholder?: string; type?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) || 0 : e.target.value)}
        disabled={!editable}
        placeholder={placeholder}
      />
    </div>
  );
}

function Block({ label, value, onChange, editable }: any) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {editable ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[60px] rounded-md border border-input bg-background p-2 text-xs"
        />
      ) : (
        <p className="text-xs text-muted-foreground whitespace-pre-wrap rounded-md border border-border bg-card p-2 min-h-[60px]">
          {value || <span className="italic">—</span>}
        </p>
      )}
    </div>
  );
}

function Combat({ icon, label, cur, max, onCur, onMax, editable, hasMax }: { icon: React.ReactNode; label: string; cur: number; max?: number; onCur: (v: number) => void; onMax?: (v: number) => void; editable?: boolean; hasMax?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card p-2">
      {icon}
      {editable ? (
        <div className="mt-1 flex items-center gap-1">
          <Input type="number" value={cur}
            onChange={(e) => onCur(Number(e.target.value) || 0)}
            className="h-7 w-14 text-center text-base font-bold" />
          {hasMax && (
            <>
              <span className="text-xs">/</span>
              <Input type="number" value={max ?? 0}
                onChange={(e) => onMax(Number(e.target.value) || 0)}
                className="h-7 w-14 text-center text-base font-bold" />
            </>
          )}
        </div>
      ) : (
        <span className="mt-1 text-lg font-bold">
          {cur}{hasMax ? `/${max ?? 0}` : ""}
        </span>
      )}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default Pathfinder2eSheet;

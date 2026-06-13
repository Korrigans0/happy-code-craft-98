// Cthulhu7eSheet — fiche dédiée L'Appel de Cthulhu 7e.
// Caractéristiques en pourcentage (avec moitié ½ et cinquième ⅕),
// PV/Santé Mentale/Chance/Points de Magie, compétences % (cochables comme
// utilisées dans la partie pour le développement), profession, équipement, notes.

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Brain, Sparkles, Dices } from "lucide-react";
import { COC_SYSTEM } from "@/lib/systems/cthulhu7e";
import { SheetHeader, SheetNotes, SheetInventory } from "./SheetSections";
import { useAutosave } from "./useAutosave";

interface Props {
  character: any;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
}

const Cthulhu7eSheet = ({ character, editable = false, onSave, onClose, onEdit }: Props) => {
  const handleSave = useMemo(() => onSave ?? (() => {}), [onSave]);
  const { local, update } = useAutosave<any>(character, handleSave);

  const sysData = (local.system_data as Record<string, any>) ?? {};
  const updateSysData = (patch: Record<string, any>) =>
    update("system_data", { ...sysData, ...patch });

  const statsValues: Record<string, number> = sysData.stats ?? {};
  const setStat = (key: string, v: number) =>
    updateSysData({ stats: { ...statsValues, [key]: v } });

  const skillsState: Record<string, { value: number; used?: boolean }> = sysData.skills ?? {};
  const setSkill = (key: string, value: number) =>
    updateSysData({ skills: { ...skillsState, [key]: { ...(skillsState[key] ?? {}), value } } });
  const toggleSkillUsed = (key: string) =>
    updateSysData({
      skills: {
        ...skillsState,
        [key]: { ...(skillsState[key] ?? { value: 0 }), used: !skillsState[key]?.used },
      },
    });

  const con = statsValues.CON ?? 50;
  const tai = statsValues.TAI ?? 50;
  const pou = statsValues.POU ?? 50;
  const dex = statsValues.DEX ?? 50;
  const maxHpAuto = Math.floor((con + tai) / 10);
  const maxSanAuto = pou;
  const maxMpAuto = Math.floor(pou / 5);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/80">
      <SheetHeader
        character={local}
        system={COC_SYSTEM}
        onClose={onClose}
        onEdit={!editable ? onEdit : undefined}
        editable={editable}
        onChange={update}
      />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Investigateur */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label className="text-xs">Nationalité</Label>
              <Input value={local.race ?? ""} onChange={(e) => update("race", e.target.value)} disabled={!editable} />
            </div>
            <div>
              <Label className="text-xs">Profession</Label>
              <Input value={local.class ?? ""} onChange={(e) => update("class", e.target.value)} disabled={!editable} />
            </div>
            <div>
              <Label className="text-xs">Âge</Label>
              <Input
                type="number"
                value={sysData.age ?? ""}
                onChange={(e) => updateSysData({ age: Number(e.target.value) || 0 })}
                disabled={!editable}
              />
            </div>
            <div>
              <Label className="text-xs">Résidence</Label>
              <Input
                value={sysData.residence ?? ""}
                onChange={(e) => updateSysData({ residence: e.target.value })}
                disabled={!editable}
              />
            </div>
          </div>

          {/* Ressources */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Resource icon={<Heart className="h-4 w-4 text-red-400" />} label="PV"
              cur={local.hp ?? maxHpAuto} max={local.max_hp ?? maxHpAuto}
              onCur={(v) => update("hp", v)} onMax={(v) => update("max_hp", v)}
              editable={editable} hint={`Max auto: ${maxHpAuto}`} />
            <Resource icon={<Brain className="h-4 w-4 text-violet-400" />} label="Santé mentale"
              cur={sysData.san ?? maxSanAuto} max={sysData.san_max ?? maxSanAuto}
              onCur={(v) => updateSysData({ san: v })} onMax={(v) => updateSysData({ san_max: v })}
              editable={editable} hint={`POU = ${maxSanAuto}`} />
            <Resource icon={<Sparkles className="h-4 w-4 text-amber-400" />} label="Chance"
              cur={sysData.luck ?? 50} max={sysData.luck_max ?? 99}
              onCur={(v) => updateSysData({ luck: v })} onMax={(v) => updateSysData({ luck_max: v })}
              editable={editable} />
            <Resource icon={<Dices className="h-4 w-4 text-cyan-400" />} label="Pts de Magie"
              cur={sysData.mp ?? maxMpAuto} max={sysData.mp_max ?? maxMpAuto}
              onCur={(v) => updateSysData({ mp: v })} onMax={(v) => updateSysData({ mp_max: v })}
              editable={editable} hint={`POU÷5 = ${maxMpAuto}`} />
          </div>

          {/* Caractéristiques */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Caractéristiques</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COC_SYSTEM.stats.map((s) => {
                const v = statsValues[s.key] ?? s.default;
                return (
                  <div key={s.key} className="rounded-lg border border-border bg-card p-3" title={s.longLabel}>
                    <div className="text-xs font-semibold text-muted-foreground">{s.label}</div>
                    {editable ? (
                      <Input
                        type="number" min={s.min} max={s.max} value={v}
                        onChange={(e) => setStat(s.key, Number(e.target.value) || s.default)}
                        className="mt-1 h-8 text-center text-lg font-bold"
                      />
                    ) : (
                      <div className="mt-1 text-center text-lg font-bold">{v}%</div>
                    )}
                    <div className="mt-1 grid grid-cols-2 text-center text-[10px] text-muted-foreground">
                      <div>½ <span className="font-semibold">{Math.floor(v / 2)}</span></div>
                      <div>⅕ <span className="font-semibold">{Math.floor(v / 5)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 rounded border border-border bg-card/40 p-2 text-xs text-muted-foreground">
              Bonus de dégâts / Carrure : à renseigner manuellement selon FOR + TAI.
              Esquive de base = DEX÷2 = <span className="font-semibold text-foreground">{Math.floor(dex / 2)}</span>.
            </div>
          </div>

          {/* Compétences */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Compétences</h3>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Coche les compétences utilisées avec succès pour développement entre scénarios.
            </p>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {(COC_SYSTEM.skills ?? []).map((sk) => {
                const entry = skillsState[sk.key] ?? { value: 0 };
                const v = entry.value ?? 0;
                return (
                  <div key={sk.key} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/30">
                    <Checkbox
                      checked={!!entry.used}
                      onCheckedChange={() => toggleSkillUsed(sk.key)}
                      disabled={!editable}
                    />
                    <span className="text-sm flex-1 truncate">{sk.label}</span>
                    <span className="text-[10px] text-muted-foreground">({sk.stat})</span>
                    {editable ? (
                      <Input
                        type="number" min={0} max={99} value={v}
                        onChange={(e) => setSkill(sk.key, Number(e.target.value) || 0)}
                        className="h-7 w-14 text-xs text-center"
                      />
                    ) : (
                      <span className="text-sm font-mono font-semibold text-primary w-10 text-right">
                        {v}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Armes */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Armes</h3>
            {editable ? (
              <textarea
                value={sysData.weapons ?? ""}
                onChange={(e) => updateSysData({ weapons: e.target.value })}
                className="w-full min-h-[80px] rounded-md border border-input bg-background p-2 text-sm font-mono"
                placeholder="Nom — Régulier/Difficile/Extrême — Dégâts — Portée — Attaques — Munitions — Enrayage"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground rounded-md border border-border bg-card p-2">
                {sysData.weapons || "—"}
              </pre>
            )}
          </div>

          <SheetInventory character={local} editable={editable} onChange={update} />

          {/* Profil psychologique */}
          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold">Profil de l'investigateur</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["ideology", "Idéologie / Croyances"],
                ["significant_people", "Personnes importantes"],
                ["meaningful_locations", "Lieux importants"],
                ["treasured_possessions", "Possessions précieuses"],
                ["traits", "Traits"],
                ["injuries_scars", "Blessures & cicatrices"],
                ["phobias_manias", "Phobies & manies"],
                ["arcane_tomes", "Tomes & sorts"],
              ].map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs">{label}</Label>
                  {editable ? (
                    <textarea
                      value={sysData[key] ?? ""}
                      onChange={(e) => updateSysData({ [key]: e.target.value })}
                      className="w-full min-h-[50px] rounded-md border border-input bg-background p-2 text-xs"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {sysData[key] || <span className="italic">—</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <SheetNotes character={local} editable={editable} onChange={update} />
        </div>
      </ScrollArea>
    </div>
  );
};

interface ResourceProps {
  icon: React.ReactNode;
  label: string;
  cur: number;
  max: number;
  onCur: (v: number) => void;
  onMax: (v: number) => void;
  editable?: boolean;
  hint?: string;
}
function Resource({ icon, label, cur, max, onCur, onMax, editable, hint }: ResourceProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 flex items-center gap-1">
        <Input
          type="number" value={cur}
          onChange={(e) => onCur(Number(e.target.value) || 0)}
          className="h-7 w-14 text-center text-sm font-bold"
          disabled={!editable}
        />
        <span>/</span>
        <Input
          type="number" value={max}
          onChange={(e) => onMax(Number(e.target.value) || 0)}
          className="h-7 w-14 text-center text-sm"
          disabled={!editable}
        />
      </div>
      {hint && <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export default Cthulhu7eSheet;

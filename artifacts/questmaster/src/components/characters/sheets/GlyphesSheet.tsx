// GlyphesSheet — fiche personnage du système Glyphes, calquée sur la fiche officielle
// éditable (Fiche_perso-editable) : Potentiel, Protection, Armes, Capacités, Héroïsme,
// Actions héroïques/légendaires, Sens, Corps, Âme, Blessures (sur 3), Blessures graves,
// Tempête spirituelle, Glyphes, Immersion et Aptitudes.
//
// Système isolé : persistance via character.system_data (jsonb libre). Les anciennes
// clés (stats, ame, heroisme, tempete, def_blessure, def_resilience, armes, glyphes…)
// sont conservées pour rester compatibles avec les fiches existantes et la table.

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getSystem } from "@/lib/systems";
import { SheetHeader, SheetNotes } from "./SheetSections";
import { useAutosave } from "./useAutosave";

interface Props {
  character: any;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
}

const DICE_LEVELS = ["—", "D4", "D6", "D8", "D10", "D12"]; // index 0..5
const MAX_WOUNDS = 3;
const HEROISM_GROUPS = [5, 2, 3];
const STORM_GROUPS = [
  { size: 4, label: "Esp : D4" },
  { size: 2, label: "D6" },
  { size: 2, label: "D8" },
  { size: 2, label: "D10" },
  { size: 2, label: "D12" },
];
const SENSES = ["Vue", "Instinct", "Sens", "Ouïe", "Flux"] as const;
const BODY_STATS = [{ key: "PUI", label: "Pui" }, { key: "SOU", label: "Sou" }, { key: "CON", label: "Con" }];
const SOUL_STATS = [{ key: "FOI", label: "Foi" }, { key: "SOC", label: "Soc" }, { key: "ESP", label: "Esp" }];
const IMMERSION_ROWS = [
  ["+ 10 ft", "Commune", "+ 5 ft", "+ 5 sec", "1"],
  ["+ 20 ft", "Héroïque", "+ 10 ft", "+ 10 sec", "2"],
  ["+ 30 ft", "Grandiose", "+ 15 ft", "+ 20 sec", "3"],
  ["+ 40 ft", "Légendaire", "+ 20 ft", "+ 30 sec", "4"],
  ["+ 50 ft", "Mythique", "+ 25 ft", "+ 1 min", "5"],
];
const APTITUDES: [string, string][] = [
  ["Armes légères de mêlée", "Sou - Pui"], ["Armes lourdes de mêlée", "Pui"],
  ["Armes légères à distance", "Sou"], ["Armes lourdes à distance", "Sou"],
  ["Pugilat", "Sou - Pui"], ["Armes de jet", "Sou - Pui"], ["Athlétique", "Pui"],
  ["Pied léger", "Sou"], ["Sang pourri", "Con"], ["Camouflage", "Sou"],
  ["Main légère", "Sou"], ["Courageux", "Foi"], ["Charme", "Soc - Sou"],
  ["Intimidation", "Soc - Pui"], ["Négociateur", "Soc - Esp"],
  ["Persuasion", "Soc - Esp - Foi"], ["Tromperie", "Soc - Esp"], ["Forge-glyphe", "Flux"],
  ["Alchimiste", "Esp - Sou"], ["Ingénieur", "Esp - Sou"], ["Médecin", "Esp - Sou"],
  ["Scout", "Instinct"], ["Vigilant", "Sens"], ["Botanique", "Esp"],
  ["Déduction", "Esp"], ["Érudition", "Soc - Esp"],
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const toList = (v: unknown, n: number): string[] => {
  const arr = Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? v.split("\n") : [];
  return Array.from({ length: n }, (_, i) => arr[i] ?? "");
};

/** Row of square boxes; groups are separated like on the paper sheet. */
const Boxes = ({ value, groups, onChange, disabled }: {
  value: number; groups: number[]; onChange: (v: number) => void; disabled?: boolean;
}) => {
  let index = 0;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {groups.map((size, g) => (
        <div key={g} className="flex items-center gap-0.5">
          {g > 0 && <span className="mx-0.5 h-4 w-px bg-primary/60" />}
          {Array.from({ length: size }).map(() => {
            const i = index++;
            const filled = i < value;
            return (
              <button key={i} type="button" disabled={disabled}
                aria-label={`Case ${i + 1}`}
                onClick={() => onChange(filled && i + 1 === value ? i : i + 1)}
                className={`h-4 w-4 border border-primary/60 transition ${filled ? "bg-primary" : "bg-transparent"} ${disabled ? "cursor-default" : "hover:scale-110"}`} />
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Title = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="mb-2 flex flex-wrap items-center gap-3">
    <h3 className="font-display text-base font-semibold text-primary">{children}</h3>
    {right}
  </div>
);

const Box = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-lg border border-border bg-card/60 p-3 ${className}`}>{children}</section>
);

const GlyphesSheet = ({ character, editable = false, onSave, onClose, onEdit }: Props) => {
  const system = getSystem("Glyphes");
  const handleSave = useMemo(() => onSave ?? (() => {}), [onSave]);
  const { local, update } = useAutosave<any>(character, handleSave);
  const sysData = (local.system_data as Record<string, any>) ?? {};
  const stats: Record<string, number> = sysData.stats ?? {};
  const senses: Record<string, string> = sysData.senses ?? {};
  const aptitudes: Record<string, string> = sysData.aptitudes ?? {};
  const setSysData = (patch: Record<string, any>) => update("system_data", { ...sysData, ...patch });
  const setStat = (k: string, v: number) => setSysData({ stats: { ...stats, [k]: clamp(v, 0, 5) } });
  const setListItem = (key: string, n: number, i: number, v: string) => {
    const list = toList(sysData[key], n);
    list[i] = v;
    setSysData({ [key]: list });
  };

  const corps = clamp(local.hp ?? 5, 0, 5);
  const wounds = clamp(sysData.def_blessure ?? 0, 0, MAX_WOUNDS);

  const statInput = (k: string, label: string) => (
    <div key={k} className="flex items-center gap-2">
      <span className="w-10 text-sm font-semibold">{label}</span>
      <select disabled={!editable} value={stats[k] ?? 0} onChange={(e) => setStat(k, Number(e.target.value))}
        className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm">
        {DICE_LEVELS.map((d, i) => <option key={d} value={i}>{d}</option>)}
      </select>
    </div>
  );

  const lineList = (k: string, n: number, placeholder?: string) => (
    <div className="space-y-1">
      {toList(sysData[k], n).map((v, i) => (
        <Input key={i} value={v} disabled={!editable} placeholder={placeholder}
          onChange={(e) => setListItem(k, n, i, e.target.value)} className="h-8 text-sm" />
      ))}
    </div>
  );

  const actionTable = (k: string, title: string) => {
    const names = toList(sysData[k], 7);
    const costs = toList(sysData[`${k}_cout`], 7);
    return (
      <div>
        <div className="mb-1 grid grid-cols-[1fr_6rem] gap-2 text-xs font-semibold">
          <span>{title}</span><span>Coût héroïsme</span>
        </div>
        <div className="space-y-1">
          {names.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem] gap-2">
              <Input value={v} disabled={!editable} className="h-8 text-sm"
                onChange={(e) => setListItem(k, 7, i, e.target.value)} />
              <Input value={costs[i]} disabled={!editable} className="h-8 text-center text-sm"
                onChange={(e) => setListItem(`${k}_cout`, 7, i, e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/80">
      <SheetHeader character={local} system={system} onClose={onClose} onEdit={!editable ? onEdit : undefined} editable={editable} onChange={update} />
      <ScrollArea className="flex-1 p-4">
        <div className="grid gap-4 xl:grid-cols-3">
          {/* Colonne 1 */}
          <div className="space-y-4">
            <Box>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Race</Label>
                  <Input value={local.race ?? ""} disabled={!editable} onChange={(e) => update("race", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Potentiel</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" min={0} aria-label="Potentiel disponible" placeholder="Disponible" disabled={!editable}
                      value={sysData.potentiel_dispo ?? 0} onChange={(e) => setSysData({ potentiel_dispo: Math.max(0, Number(e.target.value) || 0) })} />
                    <Input type="number" min={0} aria-label="Potentiel dépensé" placeholder="Dépensé" disabled={!editable}
                      value={sysData.potentiel_depense ?? 0} onChange={(e) => setSysData({ potentiel_depense: Math.max(0, Number(e.target.value) || 0) })} />
                  </div>
                  <div className="mt-0.5 grid grid-cols-2 text-[10px] text-muted-foreground"><span>Disponible</span><span>Dépensé</span></div>
                </div>
              </div>
            </Box>

            <div className="grid gap-4 sm:grid-cols-2">
              <Box>
                <Title right={<Boxes value={clamp(sysData.protection ?? 0, 0, 3)} groups={[3]} disabled={!editable}
                  onChange={(v) => setSysData({ protection: v })} />}>Protection</Title>
                {lineList("protections_list", 2)}
              </Box>
              <Box>
                <Title>Armes</Title>
                {lineList("armes_list", 2)}
              </Box>
            </div>

            <Box>
              <Title>Capacités spéciales</Title>
              <div className="grid gap-1 sm:grid-cols-2">
                {toList(sysData.capacites, 4).map((v, i) => (
                  <Input key={i} value={v} disabled={!editable} className="h-8 text-sm"
                    onChange={(e) => setListItem("capacites", 4, i, e.target.value)} />
                ))}
              </div>
            </Box>

            <Box>
              <Title right={<Boxes value={clamp(sysData.heroisme ?? 0, 0, 10)} groups={HEROISM_GROUPS} disabled={!editable}
                onChange={(v) => setSysData({ heroisme: v })} />}>Héroïsme</Title>
              <div className="space-y-4">
                {actionTable("actions_heroiques", "Actions héroïques")}
                {actionTable("actions_legendaires", "Actions légendaires")}
              </div>
            </Box>
          </div>

          {/* Colonne 2 */}
          <div className="space-y-4">
            <Box>
              <Title>Sens</Title>
              <div className="grid grid-cols-3 items-center gap-2 text-center">
                <span />
                {senseField("Vue")}
                <span />
                {senseField("Instinct")}
                {senseField("Sens")}
                {senseField("Ouïe")}
                <span />
                {senseField("Flux")}
                <span />
              </div>
            </Box>

            <div className="grid gap-4 sm:grid-cols-2">
              <Box>
                <Title right={<Boxes value={corps} groups={[5]} disabled={!editable}
                  onChange={(v) => { update("hp", v); if ((local.max_hp ?? 0) !== 5) update("max_hp", 5); }} />}>Corps</Title>
                <div className="space-y-2">{BODY_STATS.map((s) => statInput(s.key, s.label))}</div>
              </Box>
              <Box>
                <Title right={<Boxes value={wounds} groups={[MAX_WOUNDS]} disabled={!editable}
                  onChange={(v) => setSysData({ def_blessure: clamp(v, 0, MAX_WOUNDS) })} />}>Blessures</Title>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Résilience</span>
                  <Input type="number" min={0} disabled={!editable} className="h-8 w-20 text-center"
                    value={sysData.def_resilience ?? 0}
                    onChange={(e) => setSysData({ def_resilience: Math.max(0, Number(e.target.value) || 0) })} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{wounds} / {MAX_WOUNDS}</p>
              </Box>
              <Box>
                <Title right={<Boxes value={clamp(sysData.ame ?? 5, 0, 5)} groups={[5]} disabled={!editable}
                  onChange={(v) => setSysData({ ame: v })} />}>Âme</Title>
                <div className="space-y-2">{SOUL_STATS.map((s) => statInput(s.key, s.label))}</div>
              </Box>
              <Box>
                <Title>Blessures graves</Title>
                {lineList("blessures_graves", 6)}
              </Box>
            </div>

            <Box>
              <Title>Tempête spirituelle</Title>
              <Boxes value={clamp(sysData.tempete ?? 0, 0, 12)} groups={STORM_GROUPS.map((g) => g.size)} disabled={!editable}
                onChange={(v) => setSysData({ tempete: v, tempeteMax: 12 })} />
              <div className="mt-1 flex gap-3 text-[10px] font-semibold text-muted-foreground">
                {STORM_GROUPS.map((g) => <span key={g.label}>{g.label}</span>)}
              </div>
            </Box>

            <Box>
              <Title>Glyphes</Title>
              <div className="grid gap-1 sm:grid-cols-3">
                {toList(sysData.glyphes, 9).map((v, i) => (
                  <Input key={i} value={v} disabled={!editable} className="h-8 text-sm"
                    onChange={(e) => setListItem("glyphes", 9, i, e.target.value)} />
                ))}
              </div>
            </Box>

            <Box>
              <Title>Immersion</Title>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="p-1">Portée</th><th className="p-1">Magnitude</th><th className="p-1">Zone (rayon)</th>
                      <th className="p-1">Durée</th><th className="p-1">Coût (points d'immersion)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {IMMERSION_ROWS.map((r) => (
                      <tr key={r[4]} className="odd:bg-muted/40">{r.map((c, i) => <td key={i} className="p-1">{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Box>
          </div>

          {/* Colonne 3 : Aptitudes */}
          <Box className="h-fit">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="p-1 text-left">Aptitude</th><th className="p-1">Cara</th><th className="p-1">Niv</th>
                </tr>
              </thead>
              <tbody>
                {APTITUDES.map(([name, cara]) => (
                  <tr key={name} className="odd:bg-muted/40">
                    <td className="p-1">{name}</td>
                    <td className="p-1 text-center text-xs text-muted-foreground">{cara}</td>
                    <td className="p-1">
                      <Input value={aptitudes[name] ?? ""} disabled={!editable} aria-label={`Niveau ${name}`}
                        className="h-7 w-16 text-center text-sm"
                        onChange={(e) => setSysData({ aptitudes: { ...aptitudes, [name]: e.target.value } })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </div>

        {/* Hors fiche papier : conservé pour ne perdre aucune donnée existante */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs">Inventaire</Label>
            <Textarea value={sysData.inventaire ?? ""} onChange={(e) => setSysData({ inventaire: e.target.value })}
              disabled={!editable} rows={4} />
          </div>
          <div>
            <Label className="text-xs">Richesses</Label>
            <div className="grid grid-cols-3 gap-2">
              {[["Bronze", "bronze"], ["Argent", "argent"], ["Brume", "brume"], ["Rubis", "rubis"], ["Saphir", "saphir"]].map(([label, key]) => (
                <div key={key}>
                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                  <Input type="number" value={sysData[`coin_${key}`] ?? 0} disabled={!editable} className="h-7 text-sm"
                    onChange={(e) => setSysData({ [`coin_${key}`]: Number(e.target.value) || 0 })} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4"><SheetNotes character={local} editable={editable} onChange={update} /></div>
      </ScrollArea>
    </div>
  );

  function senseField(name: (typeof SENSES)[number]) {
    return (
      <div>
        <div className="text-xs font-semibold">{name}</div>
        <Input value={senses[name] ?? ""} disabled={!editable} aria-label={name} className="mx-auto h-8 w-20 text-center"
          onChange={(e) => setSysData({ senses: { ...senses, [name]: e.target.value } })} />
      </div>
    );
  }
};

export default GlyphesSheet;

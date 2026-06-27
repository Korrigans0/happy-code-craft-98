// GlyphesSheet — fiche personnage spécifique au système Glyphes (Nouvel Empire).
// Suit la fiche officielle PDF v1.2 : Corps/Âme (jauges 5), 6 caractéristiques en
// niveaux de dé (D4→D12), sens dérivés, héroïsme, attaque/défense, évocation, inventaire.
//
// Système isolé : ne lit jamais de données d'un autre univers. Persistance via
// character.system_data (jsonb libre).

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles, Shield, Sword, Scroll, Wand2 } from "lucide-react";
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

const CARACS = [
  { key: "PUI", label: "Puissance" },
  { key: "SOU", label: "Souplesse" },
  { key: "CON", label: "Constitution" },
  { key: "FOI", label: "Foi" },
  { key: "ESP", label: "Esprit" },
  { key: "SOC", label: "Social" },
];

const Pips = ({
  value, max, onChange, color = "bg-amber-400", disabled,
}: { value: number; max: number; onChange?: (v: number) => void; color?: string; disabled?: boolean }) => (
  <div className="flex gap-1">
    {Array.from({ length: max }).map((_, i) => {
      const filled = i < value;
      return (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(filled && i + 1 === value ? i : i + 1)}
          className={`h-4 w-4 rounded-full border border-amber-500/40 transition ${
            filled ? color : "bg-transparent"
          } ${disabled ? "cursor-default" : "hover:scale-110"}`}
        />
      );
    })}
  </div>
);

const GlyphesSheet = ({ character, editable = false, onSave, onClose, onEdit }: Props) => {
  const system = getSystem("Glyphes");
  const handleSave = useMemo(() => onSave ?? (() => {}), [onSave]);
  const { local, update } = useAutosave<any>(character, handleSave);
  const sysData = (local.system_data as Record<string, any>) ?? {};
  const stats: Record<string, number> = sysData.stats ?? {};
  const setSysData = (patch: Record<string, any>) => update("system_data", { ...sysData, ...patch });
  const setStat = (k: string, v: number) =>
    setSysData({ stats: { ...stats, [k]: Math.max(0, Math.min(5, v)) } });

  const corps = local.hp ?? 5;
  const corpsMax = local.max_hp ?? 5;
  const ame = sysData.ame ?? 5;
  const heroisme = sysData.heroisme ?? 0;
  const tempete = sysData.tempete ?? 0;
  const tempeteMax = sysData.tempeteMax ?? 10;

  const sens = {
    Vue: Math.min(stats.ESP ?? 0, stats.CON ?? 0),
    Ouïe: Math.min(stats.ESP ?? 0, stats.CON ?? 0),
    Instinct: Math.min(stats.ESP ?? 0, stats.FOI ?? 0),
    Flux: Math.max(0, (stats.ESP ?? 0) - 1),
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/80">
      <SheetHeader character={local} system={system} onClose={onClose} onEdit={!editable ? onEdit : undefined} editable={editable} onChange={update} />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-5">
          {editable && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label className="text-xs">Race</Label>
                <Input value={local.race ?? ""} onChange={(e) => update("race", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Origine</Label>
                <Input value={local.class ?? ""} onChange={(e) => update("class", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Niveau</Label>
                <Input type="number" min={1} value={local.level ?? 1}
                  onChange={(e) => update("level", Number(e.target.value) || 1)} />
              </div>
              <div>
                <Label className="text-xs">Encombrement max</Label>
                <Input type="number" value={sysData.encMax ?? 0}
                  onChange={(e) => setSysData({ encMax: Number(e.target.value) || 0 })} />
              </div>
            </div>
          )}

          {/* Corps / Âme / Héroïsme */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <div className="flex items-center gap-2 text-red-300"><Heart className="h-4 w-4" /> <span className="text-xs font-semibold">Corps</span></div>
              <div className="mt-2 flex items-center gap-2">
                <Pips value={corps} max={corpsMax} onChange={(v) => update("hp", v)} color="bg-red-400" disabled={!editable} />
                <span className="text-xs text-muted-foreground">{corps}/{corpsMax}</span>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 text-amber-300"><Sparkles className="h-4 w-4" /> <span className="text-xs font-semibold">Âme</span></div>
              <div className="mt-2"><Pips value={ame} max={5} onChange={(v) => setSysData({ ame: v })} disabled={!editable} /></div>
            </div>
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
              <div className="flex items-center gap-2 text-purple-300"><Scroll className="h-4 w-4" /> <span className="text-xs font-semibold">Héroïsme</span></div>
              <div className="mt-2"><Pips value={heroisme} max={5} onChange={(v) => setSysData({ heroisme: v })} color="bg-purple-400" disabled={!editable} /></div>
            </div>
          </div>

          {/* Caractéristiques (niveaux de dé 0..5) */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">Caractéristiques (niveau de dé)</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CARACS.map((c) => {
                const v = stats[c.key] ?? 0;
                return (
                  <div key={c.key} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">{c.label}</span>
                      <span className="font-mono text-sm font-bold text-amber-300">{DICE_LEVELS[v]}</span>
                    </div>
                    {editable ? (
                      <div className="mt-2 flex items-center gap-1">
                        <button type="button" className="rounded bg-muted px-2 text-sm" onClick={() => setStat(c.key, v - 1)}>−</button>
                        <Input type="number" min={0} max={5} value={v}
                          onChange={(e) => setStat(c.key, Number(e.target.value) || 0)}
                          className="h-8 text-center" />
                        <button type="button" className="rounded bg-muted px-2 text-sm" onClick={() => setStat(c.key, v + 1)}>+</button>
                      </div>
                    ) : (
                      <div className="mt-2 text-center text-lg font-bold">{v}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sens */}
          <div className="rounded-lg border border-border bg-card p-3">
            <h3 className="mb-2 font-display text-sm font-semibold">Sens (dérivés)</h3>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {Object.entries(sens).map(([k, v]) => (
                <div key={k} className="rounded border border-white/10 bg-white/[0.02] p-2 text-center">
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="font-mono font-bold text-amber-300">{DICE_LEVELS[v]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Défenses */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Défense</h3>
            <div className="grid grid-cols-3 gap-2">
              {["blessure", "resilience", "esquive"].map((k) => (
                <div key={k} className="rounded-lg border border-border bg-card p-2 text-center">
                  <div className="text-xs capitalize text-muted-foreground">{k}</div>
                  <Input type="number" value={sysData[`def_${k}`] ?? 0}
                    onChange={(e) => setSysData({ [`def_${k}`]: Number(e.target.value) || 0 })}
                    disabled={!editable} className="mt-1 h-8 text-center text-lg font-bold" />
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Label className="text-xs">Protections</Label>
              <Input value={sysData.protections ?? ""} onChange={(e) => setSysData({ protections: e.target.value })}
                disabled={!editable} placeholder="Armure, bouclier, charmes…" />
            </div>
          </div>

          {/* Attaque */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold flex items-center gap-2"><Sword className="h-4 w-4" /> Attaque</h3>
            <Label className="text-xs">Armes (mêlée / distance)</Label>
            <Textarea value={sysData.armes ?? ""} onChange={(e) => setSysData({ armes: e.target.value })}
              disabled={!editable} rows={3} placeholder="Épée bâtarde (mêlée), arc court (distance)…" />
            <p className="mt-1 text-[10px] text-muted-foreground">Coût d'attaque : 2 PA. Mouvement : 15 ft / 1 PA.</p>
          </div>

          {/* Évocation */}
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
            <h3 className="mb-2 font-display text-sm font-semibold flex items-center gap-2 text-purple-300"><Wand2 className="h-4 w-4" /> Évocation — Glyphes</h3>
            <Textarea value={sysData.glyphes ?? ""} onChange={(e) => setSysData({ glyphes: e.target.value })}
              disabled={!editable} rows={4} placeholder="Liste des glyphes connus…" />
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Tempête spirituelle</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={tempeteMax} value={tempete}
                    onChange={(e) => setSysData({ tempete: Number(e.target.value) || 0 })}
                    disabled={!editable} className="h-8 w-16" />
                  <span>/</span>
                  <Input type="number" value={tempeteMax}
                    onChange={(e) => setSysData({ tempeteMax: Number(e.target.value) || 10 })}
                    disabled={!editable} className="h-8 w-16" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Flux (niveau de dé)</Label>
                <div className="font-mono text-base text-amber-300">{DICE_LEVELS[sens.Flux]}</div>
              </div>
            </div>
          </div>

          {/* Inventaire & Richesses */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">Inventaire</Label>
              <Textarea value={sysData.inventaire ?? ""} onChange={(e) => setSysData({ inventaire: e.target.value })}
                disabled={!editable} rows={5} placeholder="Un objet par ligne — Q pour quantité, En pour encombrement." />
            </div>
            <div>
              <Label className="text-xs">Richesses</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Bronze", "bronze"], ["Argent", "argent"],
                  ["Brume", "brume"], ["Rubis", "rubis"], ["Saphir", "saphir"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <Label className="text-[10px] text-muted-foreground">{label}</Label>
                    <Input type="number" value={sysData[`coin_${key}`] ?? 0}
                      onChange={(e) => setSysData({ [`coin_${key}`]: Number(e.target.value) || 0 })}
                      disabled={!editable} className="h-7 text-sm" />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">10 Bronze = 1 Argent · 1 Brume = 100 Argent · 1 Rubis = 250 · 1 Saphir = 500</p>
            </div>
          </div>

          {/* Fabrication */}
          <div>
            <Label className="text-xs">Fabrication (type & recettes)</Label>
            <Textarea value={sysData.fabrication ?? ""} onChange={(e) => setSysData({ fabrication: e.target.value })}
              disabled={!editable} rows={3} placeholder="Type : alchimie · Recettes habituelles…" />
          </div>

          <SheetNotes character={local} editable={editable} onChange={update} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default GlyphesSheet;

// Glyphes V0.2 — Fenêtre d'attaque et de réaction entre deux jetons.
// L'attaque est une ÉPREUVE : TD = résilience de la cible, rang = protection.
// La cible peut ensuite réagir (esquive par annulation de dés, levée de
// bouclier, serrer les dents) avant application des blessures.
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Swords, Plus, X, ShieldCheck } from "lucide-react";
import {
  ARMORS,
  DIE_LEVELS,
  WEAPON_CATEGORIES,
  DODGE_RULE_UNDEFINED,
  availableReactions,
  cancelSuccesses,
  formatAttack,
  getWeaponCategory,
  resolveAttack,
  resolveDodge,
  type AttackResult,
  type DieSize,
  type DodgeResult,
  type ReactionKey,
  type Superiority,
} from "@/lib/game-systems/glyphes";
import { broadcastGlyphesEntry, entryFromAttack } from "@/lib/game-systems/glyphes/broadcast";
import type { GlyphesTokenState } from "@/lib/game-systems/glyphes/useGlyphesCombat";

export interface GlyphesTargetOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string | null;
  authorName: string;
  attackerName: string;
  attackerState?: GlyphesTokenState | null;
  targets: GlyphesTargetOption[];
  /** État de combat d'un jeton (résilience, armure, bouclier, héroïsme). */
  getTargetState: (tokenId: string) => GlyphesTokenState;
  /** Applique les blessures finales à la cible. */
  onApplyWounds: (tokenId: string, wounds: number) => void;
  /** Dépense d'héroïsme de la cible pour sa réaction. */
  onSpendTargetHeroism: (tokenId: string, cost: number) => void;
  /** Coût en points d'action de l'attaquant (2 PA). */
  onSpendActionPoints?: (cost: number) => boolean;
}

type Phase = "setup" | "reaction" | "done";

export default function GlyphesAttackDialog({
  open,
  onOpenChange,
  campaignId,
  authorName,
  attackerName,
  attackerState,
  targets,
  getTargetState,
  onApplyWounds,
  onSpendTargetHeroism,
  onSpendActionPoints,
}: Props) {
  const [targetId, setTargetId] = useState<string>(targets[0]?.id ?? "");
  const [weaponId, setWeaponId] = useState(WEAPON_CATEGORIES[0].id);
  const [dieSize, setDieSize] = useState<DieSize>(6);
  const [aptitudeLevel, setAptitudeLevel] = useState(1);
  const [superiorities, setSuperiorities] = useState<Superiority[]>([]);
  const [superioritySource, setSuperioritySource] = useState("");
  const [attack, setAttack] = useState<AttackResult | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [reaction, setReaction] = useState<ReactionKey>("aucune");
  const [dodgeDieSize, setDodgeDieSize] = useState<DieSize>(6);
  const [baseDodgeDice, setBaseDodgeDice] = useState(0);
  const [extraDodgeDice, setExtraDodgeDice] = useState(0);
  const [dodge, setDodge] = useState<DodgeResult | null>(null);
  const [finalWounds, setFinalWounds] = useState(0);

  const weapon = useMemo(() => getWeaponCategory(weaponId), [weaponId]);
  const target = targets.find((t) => t.id === targetId);
  const targetState = targetId ? getTargetState(targetId) : null;

  useEffect(() => {
    if (!open) return;
    setPhase("setup");
    setAttack(null);
    setDodge(null);
    setReaction("aucune");
    setExtraDodgeDice(0);
    setFinalWounds(0);
    if (!targets.some((t) => t.id === targetId)) setTargetId(targets[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const totalDice = aptitudeLevel + superiorities.reduce((s, x) => s + x.dice, 0);

  const reactions = useMemo(
    () =>
      availableReactions({
        heroism: targetState?.heroism ?? 0,
        hasShield: targetState?.hasShield,
      }),
    [targetState],
  );

  const launchAttack = () => {
    if (!target || !targetState) return;
    if (onSpendActionPoints && !onSpendActionPoints(2)) return;
    const res = resolveAttack({
      attackerName,
      targetName: target.name,
      weaponLabel: weapon.name,
      dieSize,
      aptitudeLevel,
      targetResilience: targetState.resilience,
      targetArmor: targetState.armor,
      superiorities,
      spentHeroismThisTurn: attackerState?.spentHeroismThisTurn,
    });
    setAttack(res);
    setFinalWounds(res.wounds);
    broadcastGlyphesEntry(campaignId, entryFromAttack(authorName, res));
    setPhase(res.reactionWindowOpen ? "reaction" : "done");
  };

  const applyReaction = () => {
    if (!attack || !targetId) return;
    if (reaction === "esquive") {
      const res = resolveDodge({
        attack,
        dodgeDieSize,
        armor: targetState?.armor,
        baseDice: baseDodgeDice,
        extraDice: extraDodgeDice,
      });
      setDodge(res);
      setFinalWounds(res.wounds);
      onSpendTargetHeroism(targetId, res.heroismSpent);
    } else if (reaction === "levee-bouclier" || reaction === "serrer-les-dents") {
      const spent = 2 + extraDodgeDice * 2;
      const res = cancelSuccesses({ attack, heroismSpent: spent });
      setFinalWounds(res.wounds);
      onSpendTargetHeroism(targetId, spent);
    }
    setPhase("done");
  };

  const confirmWounds = () => {
    if (targetId && finalWounds > 0) onApplyWounds(targetId, finalWounds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:max-w-none max-sm:rounded-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Swords className="h-5 w-5 text-primary" />
            Attaque — {attackerName}
          </DialogTitle>
          <DialogDescription>
            L'attaque est une épreuve : le TD est la résilience de la cible, le rang son taux de protection.
          </DialogDescription>
        </DialogHeader>

        {phase === "setup" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Cible</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder="Choisir une cible" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {targets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetState && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Résilience {targetState.resilience}+ · {ARMORS.find((a) => a.key === targetState.armor)?.label ?? "Sans armure"} (protection{" "}
                  {ARMORS.find((a) => a.key === targetState.armor)?.protection ?? 0}) · Héroïsme {targetState.heroism}
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs">Arme</Label>
              <Select value={weaponId} onValueChange={setWeaponId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEAPON_CATEGORIES.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {weapon.hint} · Caractéristique : {weapon.stats.join(" ou ")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Dé de caractéristique</Label>
                <Select value={String(dieSize)} onValueChange={(v) => setDieSize(Number(v) as DieSize)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIE_LEVELS.map((d) => (
                      <SelectItem key={d.size} value={String(d.size)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Niveau d'aptitude martiale</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  value={aptitudeLevel}
                  onChange={(e) => setAptitudeLevel(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Supériorité</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Source (flanc, hauteur, objet de qualité…)"
                  value={superioritySource}
                  onChange={(e) => setSuperioritySource(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSuperiorities((p) => [...p, { source: superioritySource.trim() || "Supériorité", dice: 1 }]);
                    setSuperioritySource("");
                  }}
                >
                  <Plus className="h-3 w-3" /> 1D
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSuperiorities((p) => [...p, { source: superioritySource.trim() || "Infériorité", dice: -1 }]);
                    setSuperioritySource("");
                  }}
                >
                  −1D
                </Button>
              </div>
              {superiorities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {superiorities.map((s, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {s.dice > 0 ? `+${s.dice}D` : `${s.dice}D`} — {s.source}
                      <button onClick={() => setSuperiorities((p) => p.filter((_, j) => j !== i))} aria-label="Retirer">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full" onClick={launchAttack} disabled={!target}>
              <Swords className="mr-2 h-4 w-4" />
              Attaquer — {Math.max(totalDice, 0) || 2}D{dieSize} (2 PA)
            </Button>
          </div>
        )}

        {attack && phase !== "setup" && (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="mb-2 flex flex-wrap gap-1">
                {(dodge?.attackDice ?? attack.check.pool.dice).map((d, i) => (
                  <span
                    key={i}
                    className={`flex h-8 w-8 items-center justify-center rounded border text-sm font-bold ${
                      d.ignored || d.cancelled
                        ? "border-border text-muted-foreground line-through"
                        : d.value >= attack.check.difficulty.minScore
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {d.value}
                  </span>
                ))}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-foreground">{formatAttack(attack)}</pre>
            </div>

            {phase === "reaction" && (
              <div className="space-y-2 rounded-md border border-border p-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Réaction de {target?.name} (héroïsme : {targetState?.heroism ?? 0})
                </p>
                <Select value={reaction} onValueChange={(v) => setReaction(v as ReactionKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {reactions.map((r) => (
                      <SelectItem key={r.key} value={r.key}>
                        {r.icon} {r.label}
                        {r.heroismCost > 0 ? ` (${r.heroismCost} héroïsme)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {reactions.find((r) => r.key === reaction)?.hint}
                </p>

                {reaction === "esquive" && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px]">Dé (SOU)</Label>
                        <Select value={String(dodgeDieSize)} onValueChange={(v) => setDodgeDieSize(Number(v) as DieSize)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DIE_LEVELS.map((d) => (
                              <SelectItem key={d.size} value={String(d.size)}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px]">Pool de base</Label>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          value={baseDodgeDice}
                          onChange={(e) => setBaseDodgeDice(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Dés achetés</Label>
                        <Input
                          type="number"
                          min={0}
                          max={3}
                          value={extraDodgeDice}
                          onChange={(e) => setExtraDodgeDice(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-400">{DODGE_RULE_UNDEFINED}</p>
                  </>
                )}

                {(reaction === "levee-bouclier" || reaction === "serrer-les-dents") && (
                  <div>
                    <Label className="text-[10px]">Réussites annulées supplémentaires (2 héroïsme chacune)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={3}
                      value={extraDodgeDice}
                      onChange={(e) => setExtraDodgeDice(Number(e.target.value))}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={applyReaction}>
                    Résoudre la réaction
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPhase("done")}>
                    Subir l'attaque
                  </Button>
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="space-y-2">
                {dodge && (
                  <p className="text-xs text-muted-foreground">
                    Esquive : {dodge.dodgeDice.map((d) => d.value).join(" / ") || "aucun dé"} → {dodge.cancelled} dé
                    {dodge.cancelled > 1 ? "s" : ""} annulé{dodge.cancelled > 1 ? "s" : ""} · {dodge.heroismSpent} héroïsme dépensé
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Blessures infligées</Label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    className="w-20"
                    value={finalWounds}
                    onChange={(e) => setFinalWounds(Number(e.target.value))}
                  />
                </div>
                <Button className="w-full" onClick={confirmWounds}>
                  Appliquer à {target?.name}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

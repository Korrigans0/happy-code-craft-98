// Lanceur d'épreuve Glyphes V0.2 — caractéristique (taille de dé),
// aptitude (nombre de dés), type de difficulté, rang, supériorités.
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Dices } from "lucide-react";
import {
  APTITUDES,
  APTITUDE_GROUPS,
  DIE_LEVELS,
  DIFFICULTY_TYPES,
  MAX_RANK,
  MIN_RANK,
  RANK_GUIDANCE,
  STATS,
  Superiority,
  resolveCheck,
  formatCheck,
  type CheckResult,
  type DieSize,
  type DifficultyTypeKey,
} from "@/lib/game-systems/glyphes";
import { broadcastGlyphesEntry, entryFromCheck } from "@/lib/game-systems/glyphes/broadcast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string | null;
  authorName: string;
  /** Nom du personnage / jeton concerné (préfixe du libellé). */
  actorName?: string;
  /** Niveaux de dé par caractéristique, si un personnage est lié. */
  statLevels?: Record<string, number>;
  onResolved?: (result: CheckResult) => void;
}

export default function GlyphesCheckDialog({
  open,
  onOpenChange,
  campaignId,
  authorName,
  actorName,
  statLevels,
  onResolved,
}: Props) {
  const [aptitudeKey, setAptitudeKey] = useState<string>(APTITUDES[0].key);
  const [statKey, setStatKey] = useState<string>("PUI");
  const [dieSize, setDieSize] = useState<DieSize>(6);
  const [aptitudeLevel, setAptitudeLevel] = useState(1);
  const [difficulty, setDifficulty] = useState<DifficultyTypeKey>("commun");
  const [rank, setRank] = useState(1);
  const [superiorities, setSuperiorities] = useState<Superiority[]>([]);
  const [superioritySource, setSuperioritySource] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);

  const aptitude = useMemo(() => APTITUDES.find((a) => a.key === aptitudeKey), [aptitudeKey]);

  const selectAptitude = (key: string) => {
    setAptitudeKey(key);
    const def = APTITUDES.find((a) => a.key === key);
    const first = def?.stats[0];
    if (first) {
      setStatKey(first);
      const level = statLevels?.[first];
      if (level) setDieSize(DIE_LEVELS[Math.max(0, Math.min(4, level - 1))].size);
    }
  };

  const selectStat = (key: string) => {
    setStatKey(key);
    const level = statLevels?.[key];
    if (level) setDieSize(DIE_LEVELS[Math.max(0, Math.min(4, level - 1))].size);
  };

  const addSuperiority = (dice: number) => {
    setSuperiorities((prev) => [
      ...prev,
      { source: superioritySource.trim() || (dice > 0 ? "Supériorité" : "Infériorité"), dice },
    ]);
    setSuperioritySource("");
  };

  const totalDice = aptitudeLevel + superiorities.reduce((s, x) => s + x.dice, 0);

  const roll = () => {
    const label = `${actorName ? `${actorName} — ` : ""}${aptitude?.label ?? "Épreuve"} (${statKey})`;
    const res = resolveCheck({
      label,
      dieSize,
      aptitudeLevel,
      difficulty,
      rank,
      superiorities,
    });
    setResult(res);
    onResolved?.(res);
    broadcastGlyphesEntry(campaignId, entryFromCheck(authorName, res));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:max-w-none max-sm:rounded-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Dices className="h-5 w-5 text-primary" />
            Lancer une épreuve
          </DialogTitle>
          <DialogDescription>
            Caractéristique = taille du dé, aptitude = nombre de dés. Chaque dé atteignant le TD est une réussite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Aptitude</Label>
            <Select value={aptitudeKey} onValueChange={selectAptitude}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {APTITUDE_GROUPS.map((group) => (
                  <div key={group}>
                    <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{group}</p>
                    {APTITUDES.filter((a) => a.group === group).map((a) => (
                      <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Caractéristique</Label>
              <Select value={statKey} onValueChange={selectStat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(aptitude?.stats ?? STATS.map((s) => s.key)).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Dé</Label>
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
              <Label className="text-xs">Niveau d'aptitude</Label>
              <Input
                type="number"
                min={0}
                max={5}
                value={aptitudeLevel}
                onChange={(e) => setAptitudeLevel(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type de difficulté (TD)</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyTypeKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_TYPES.map((d) => (
                    <SelectItem key={d.key} value={d.key}>
                      {d.label} ({d.minScore}+)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Rang de difficulté</Label>
              <Input
                type="number"
                min={MIN_RANK}
                max={MAX_RANK}
                value={rank}
                onChange={(e) => setRank(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {RANK_GUIDANCE.map((g) => `${g.label} : ${g.value}`).join(" · ")}
          </p>

          <div>
            <Label className="text-xs">Supériorité</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Source (aide d'un allié, équipement…)"
                value={superioritySource}
                onChange={(e) => setSuperioritySource(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addSuperiority(1)}>
                <Plus className="h-3 w-3" /> 1D
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addSuperiority(-1)}>
                −1D
              </Button>
            </div>
            {superiorities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {superiorities.map((s, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {s.dice > 0 ? `+${s.dice}D` : `${s.dice}D`} — {s.source}
                    <button onClick={() => setSuperiorities((p) => p.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button className="w-full" onClick={roll}>
            <Dices className="mr-2 h-4 w-4" />
            Lancer {Math.max(totalDice, 0) || 2}D{dieSize}
          </Button>

          {result && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="mb-2 flex flex-wrap gap-1">
                {result.pool.dice.map((d, i) => (
                  <span
                    key={i}
                    className={`flex h-8 w-8 items-center justify-center rounded border text-sm font-bold ${
                      d.ignored || d.cancelled
                        ? "border-border text-muted-foreground line-through"
                        : d.value >= result.difficulty.minScore
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {d.value}
                  </span>
                ))}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-foreground">{formatCheck(result)}</pre>
              {result.pool.degraded && (
                <p className="mt-1 text-[10px] text-amber-400">
                  Pool nul ou négatif : 2 dés lancés, seul le moins bon score est conservé.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

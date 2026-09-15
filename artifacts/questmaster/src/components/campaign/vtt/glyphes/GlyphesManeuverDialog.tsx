// Glyphes V0.2 — Charge et désengagement.
// La charge vérifie distance minimale, ligne droite et coût total en PA ;
// le désengagement lance l'épreuve de Souplesse et propose les conséquences.
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wind } from "lucide-react";
import {
  DIE_LEVELS,
  evaluateCharge,
  formatCheck,
  resolveDisengage,
  type ChargeCheck,
  type DieSize,
  type DisengageResult,
} from "@/lib/game-systems/glyphes";
import { broadcastGlyphesEntry, entryFromCheck } from "@/lib/game-systems/glyphes/broadcast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string | null;
  authorName: string;
  actorName: string;
  availablePoints: number;
  /** Dépense les points d'action ; renvoie false si insuffisants. */
  onSpend: (cost: number) => boolean;
}

export default function GlyphesManeuverDialog({
  open,
  onOpenChange,
  campaignId,
  authorName,
  actorName,
  availablePoints,
  onSpend,
}: Props) {
  // Charge
  const [distanceFt, setDistanceFt] = useState(15);
  const [straightLine, setStraightLine] = useState(true);
  const [heroicCharge, setHeroicCharge] = useState(false);
  const [charge, setCharge] = useState<ChargeCheck | null>(null);
  const [chargeError, setChargeError] = useState<string | null>(null);

  // Désengagement
  const [souplesseDie, setSouplesseDie] = useState<DieSize>(6);
  const [aptitudeLevel, setAptitudeLevel] = useState(1);
  const [enemyMax, setEnemyMax] = useState(6);
  const [disengage, setDisengage] = useState<DisengageResult | null>(null);

  const evaluate = () => {
    const res = evaluateCharge({ distanceFt, straightLine, heroicCharge });
    setCharge(res);
    setChargeError(null);
  };

  const confirmCharge = () => {
    if (!charge?.valid) return;
    if (!onSpend(charge.totalCost)) {
      setChargeError("Points d'action insuffisants pour cette charge.");
      return;
    }
    setChargeError(null);
    onOpenChange(false);
  };

  const rollDisengage = () => {
    if (!onSpend(1)) return;
    const res = resolveDisengage({
      souplesseDie,
      aptitudeLevel,
      enemySouplesseMax: enemyMax,
    });
    setDisengage(res);
    broadcastGlyphesEntry(campaignId, entryFromCheck(authorName, res.check));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:max-w-none max-sm:rounded-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Wind className="h-5 w-5 text-primary" />
            Manœuvres — {actorName}
          </DialogTitle>
          <DialogDescription>
            Points d'action disponibles : {availablePoints}.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="charge">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charge">💨 Charge</TabsTrigger>
            <TabsTrigger value="desengagement">↩️ Désengagement</TabsTrigger>
          </TabsList>

          <TabsContent value="charge" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Distance parcourue (ft)</Label>
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={distanceFt}
                  onChange={(e) => setDistanceFt(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2 pt-5 text-xs">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={straightLine} onChange={(e) => setStraightLine(e.target.checked)} />
                  Ligne droite
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={heroicCharge} onChange={(e) => setHeroicCharge(e.target.checked)} />
                  Charge héroïque (15 ft offerts)
                </label>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={evaluate}>
              Vérifier la charge
            </Button>

            {charge && (
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
                <p>
                  Coût total : <span className="font-mono font-bold">{charge.totalCost} PA</span> (déplacement + attaque
                  ou mise à terre)
                </p>
                {charge.valid ? (
                  <p className="text-primary">
                    ✓ Charge valide — supériorité {charge.superiority.dice > 0 ? "+" : ""}
                    {charge.superiority.dice}D sur l'épreuve d'attaque.
                  </p>
                ) : (
                  <ul className="list-inside list-disc text-destructive">
                    {charge.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
                <Button size="sm" className="w-full" disabled={!charge.valid} onClick={confirmCharge}>
                  Dépenser {charge.totalCost} PA et charger
                </Button>
                {chargeError && <p className="text-destructive">{chargeError}</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="desengagement" className="space-y-3 pt-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Dé (SOU)</Label>
                <Select value={String(souplesseDie)} onValueChange={(v) => setSouplesseDie(Number(v) as DieSize)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIE_LEVELS.map((d) => (
                      <SelectItem key={d.size} value={String(d.size)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Aptitude</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  value={aptitudeLevel}
                  onChange={(e) => setAptitudeLevel(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs">TD (dé SOU adverse)</Label>
                <Input type="number" min={1} value={enemyMax} onChange={(e) => setEnemyMax(Number(e.target.value))} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Le TD est le score maximal du dé de Souplesse de l'adversaire. Coût : 1 point d'action.
            </p>

            <Button className="w-full" onClick={rollDisengage}>
              Lancer l'épreuve de désengagement (1 PA)
            </Button>

            {disengage && (
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <div className="flex flex-wrap gap-1">
                  {disengage.check.pool.dice.map((d, i) => (
                    <span
                      key={i}
                      className={`flex h-8 w-8 items-center justify-center rounded border text-sm font-bold ${
                        d.ignored || d.cancelled
                          ? "border-border text-muted-foreground line-through"
                          : d.value >= disengage.check.difficulty.minScore
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border text-muted-foreground"
                      }`}
                    >
                      {d.value}
                    </span>
                  ))}
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs text-foreground">
                  {formatCheck(disengage.check)}
                </pre>
                {!disengage.check.isSuccess && (
                  <div className="text-xs text-amber-400">
                    <p className="font-semibold">Échec — choix de l'adversaire :</p>
                    <ul className="list-inside list-disc">
                      {disengage.failureOptions.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

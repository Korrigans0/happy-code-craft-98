// ============================================================
// GÉNÉRATEUR DE CARTE PROCÉDURALE — Interface MJ
// Fichier : src/components/campaign/vtt/MapGeneratorDialog.tsx
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Dices, Wand2, Check } from "lucide-react";
import {
  DEFAULT_MAP_GEN_OPTIONS, MAP_GEN_DESCRIPTIONS, MAP_GEN_LABELS,
  generateProceduralMap, randomSeed,
  type GeneratedMap, type MapGenKind, type MapGenOptions,
} from "@/lib/vtt/mapGenerator";

const KINDS: MapGenKind[] = ["dungeon", "cave", "forest", "ruins"];

interface MapGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Taille de case courante du plateau (px) pour aligner la carte sur la grille. */
  cellSize: number;
  /** Applique la carte générée au plateau. */
  onApply: (map: GeneratedMap, opts: { replaceWalls: boolean }) => void;
}

const MapGeneratorDialog = ({ open, onOpenChange, cellSize, onApply }: MapGeneratorDialogProps) => {
  const [opts, setOpts] = useState<MapGenOptions>({
    ...DEFAULT_MAP_GEN_OPTIONS,
    cellSize,
    seed: randomSeed(),
  });
  const [map, setMap] = useState<GeneratedMap | null>(null);
  const [busy, setBusy] = useState(false);
  const [replaceWalls, setReplaceWalls] = useState(true);
  const previewRef = useRef<HTMLImageElement | null>(null);

  const patch = (p: Partial<MapGenOptions>) => setOpts(prev => ({ ...prev, ...p }));

  const run = useCallback((override?: Partial<MapGenOptions>) => {
    setBusy(true);
    // Laisse le navigateur peindre l'état « en cours » avant le calcul synchrone.
    requestAnimationFrame(() => {
      try {
        const next = { ...opts, ...override };
        setOpts(next);
        setMap(generateProceduralMap(next));
      } finally {
        setBusy(false);
      }
    });
  }, [opts]);

  // Première génération à l'ouverture.
  useEffect(() => {
    if (!open) return;
    setOpts(prev => ({ ...prev, cellSize }));
    if (!map) run({ cellSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const apply = () => {
    if (!map) return;
    onApply(map, { replaceWalls });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Générateur de carte
          </DialogTitle>
          <DialogDescription>
            Crée instantanément un décor jouable, aligné sur la grille, avec ses murs dynamiques.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          {/* Aperçu */}
          <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/20">
            {map ? (
              <img
                ref={previewRef}
                src={map.dataUrl}
                alt="Aperçu de la carte générée"
                className="max-h-[420px] w-full object-contain"
              />
            ) : (
              <span className="text-sm text-muted-foreground">Aucun aperçu</span>
            )}
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Réglages */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Type de décor</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {KINDS.map(k => (
                  <Button
                    key={k}
                    type="button"
                    size="sm"
                    variant={opts.kind === k ? "default" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => run({ kind: k })}
                  >
                    {MAP_GEN_LABELS[k]}
                  </Button>
                ))}
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {MAP_GEN_DESCRIPTIONS[opts.kind]}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-xs">Largeur</Label>
                <span className="font-mono text-primary">{opts.cols} cases</span>
              </div>
              <Slider value={[opts.cols]} min={12} max={70} step={1}
                onValueChange={v => patch({ cols: v[0] })}
                onValueCommit={v => run({ cols: v[0] })} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-xs">Hauteur</Label>
                <span className="font-mono text-primary">{opts.rows} cases</span>
              </div>
              <Slider value={[opts.rows]} min={12} max={70} step={1}
                onValueChange={v => patch({ rows: v[0] })}
                onValueCommit={v => run({ rows: v[0] })} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-xs">Densité</Label>
                <span className="font-mono text-primary">{Math.round(opts.density * 100)} %</span>
              </div>
              <Slider value={[Math.round(opts.density * 100)]} min={0} max={100} step={5}
                onValueChange={v => patch({ density: (v[0] ?? 50) / 100 })}
                onValueCommit={v => run({ density: (v[0] ?? 50) / 100 })} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-2">
              <div>
                <Label className="text-xs">Murs dynamiques</Label>
                <p className="text-[10px] text-muted-foreground">Vision et collisions générées</p>
              </div>
              <Switch checked={opts.withWalls} onCheckedChange={c => run({ withWalls: c })} />
            </div>

            {opts.withWalls && (
              <div className="flex items-center justify-between rounded-md border border-border p-2">
                <div>
                  <Label className="text-xs">Remplacer les murs</Label>
                  <p className="text-[10px] text-muted-foreground">Sinon les murs sont ajoutés</p>
                </div>
                <Switch checked={replaceWalls} onCheckedChange={setReplaceWalls} />
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Graine</span>
              <span className="font-mono text-primary">{opts.seed}</span>
            </div>

            <Button type="button" variant="outline" className="w-full gap-2" disabled={busy}
              onClick={() => run({ seed: randomSeed() })}>
              <Dices className="h-4 w-4" />
              Nouvelle variante
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={apply} disabled={!map || busy} className="gap-2">
            <Check className="h-4 w-4" />
            Appliquer au plateau
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapGeneratorDialog;

// ============================================================
// PANNEAU DE RÉGLAGES DE GRILLE (MJ) — par scène
// Fichier : src/components/campaign/vtt/GridSettingsPanel.tsx
// ============================================================

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  GridConfig, GridType, HexOrientation,
  GRID_TYPE_LABELS, HEX_ORIENTATION_LABELS,
} from "@/lib/vtt/grid";

interface GridSettingsPanelProps {
  config: GridConfig;
  onChange: (next: GridConfig) => void;
  /** Appelé quand le type change : permet de ré-accrocher les jetons. */
  onTypeChange?: (next: GridConfig) => void;
  disabled?: boolean;
}

const GridSettingsPanel = ({ config, onChange, onTypeChange, disabled }: GridSettingsPanelProps) => {
  const set = (patch: Partial<GridConfig>) => onChange({ ...config, ...patch });

  const changeType = (type: GridType) => {
    const next = { ...config, type };
    onChange(next);
    onTypeChange?.(next);
  };

  return (
    <div className={`space-y-4 ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      {/* Type de grille */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Type de grille</Label>
        <RadioGroup
          value={config.type}
          onValueChange={(v) => changeType(v as GridType)}
          className="grid gap-1"
        >
          {(["square", "hex", "none"] as GridType[]).map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border/50 px-2 py-1.5 text-sm hover:bg-muted/40"
            >
              <RadioGroupItem value={t} id={`grid-type-${t}`} />
              <span>{GRID_TYPE_LABELS[t]}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Orientation hexagonale */}
      {config.type === "hex" && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Orientation</Label>
          <div className="grid grid-cols-2 gap-1">
            {(["pointy", "flat"] as HexOrientation[]).map((o) => (
              <Button
                key={o}
                type="button"
                size="sm"
                variant={config.orientation === o ? "default" : "outline"}
                onClick={() => set({ orientation: o })}
              >
                {HEX_ORIENTATION_LABELS[o]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Échelle (10–400 %) */}
      {config.type !== "none" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Échelle</Label>
            <span className="text-xs text-muted-foreground">{Math.round(config.scale * 100)} %</span>
          </div>
          <Slider
            value={[Math.round(config.scale * 100)]}
            min={10}
            max={400}
            step={5}
            onValueChange={([v]) => set({ scale: v / 100 })}
          />
        </div>
      )}

      {/* Unités */}
      <div className="grid grid-cols-2 gap-2">
        {config.type !== "none" ? (
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Unités / case</Label>
            <Input
              type="number"
              min={0.1}
              step={0.1}
              value={config.unitsPerCell}
              onChange={(e) => set({ unitsPerCell: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
              className="h-8"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Pixels / unité</Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={Math.round(config.pixelsPerUnit)}
              onChange={(e) => set({ pixelsPerUnit: Math.max(1, parseFloat(e.target.value) || 1) })}
              className="h-8"
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Unité</Label>
          <div className="grid grid-cols-2 gap-1">
            {(["m", "ft"] as const).map((u) => (
              <Button
                key={u}
                type="button"
                size="sm"
                variant={config.unitLabel === u ? "default" : "outline"}
                onClick={() => set({ unitLabel: u })}
                className="h-8"
              >
                {u === "m" ? "Mètres" : "Pieds"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Affichage / snap */}
      <div className="space-y-2 rounded-md border border-border/50 p-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="grid-show-lines" className="text-sm">Afficher les lignes</Label>
          <Switch
            id="grid-show-lines"
            checked={config.showLines}
            onCheckedChange={(v) => set({ showLines: v })}
            disabled={config.type === "none"}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="grid-snap" className="text-sm">Accrochage des jetons</Label>
          <Switch
            id="grid-snap"
            checked={config.snapEnabled && config.type !== "none"}
            onCheckedChange={(v) => set({ snapEnabled: v })}
            disabled={config.type === "none"}
          />
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          La grille possède son propre calque verrouillé : la gomme, le dessin libre
          et le brouillard ne peuvent jamais l'effacer.
        </p>
      </div>
    </div>
  );
};

export default GridSettingsPanel;

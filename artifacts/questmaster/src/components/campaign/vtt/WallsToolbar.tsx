// ============================================================
// TOOLBAR MURS — Aetheria VTT
// Fichier : artifacts/questmaster/src/components/campaign/vtt/WallsToolbar.tsx
// ============================================================

import { useState } from "react";
import { Trash2, DoorOpen, DoorClosed, Eye, Layers, Square, Undo2, Redo2, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { type WallType, WALL_COLORS, WALL_LABELS } from "./types";

interface WallsToolbarProps {
  selectedWallType: WallType;
  onSelectType: (type: WallType) => void;
  onClearAll: () => void;
  wallCount: number;
  activeTool: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  rafThrottle: number;
  onRafThrottleChange: (value: number) => void;
}

const WALL_TYPES: { type: WallType; icon: React.ReactNode; shortLabel: string }[] = [
  {
    type: "solid",
    icon: <Square className="h-4 w-4" />,
    shortLabel: "Mur",
  },
  {
    type: "door",
    icon: <DoorClosed className="h-4 w-4" />,
    shortLabel: "Porte",
  },
  {
    type: "window",
    icon: <Eye className="h-4 w-4" />,
    shortLabel: "Fenêtre",
  },
  {
    type: "terrain",
    icon: <Layers className="h-4 w-4" />,
    shortLabel: "Terrain",
  },
];

export default function WallsToolbar({
  selectedWallType,
  onSelectType,
  onClearAll,
  wallCount,
  activeTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  rafThrottle,
  onRafThrottleChange,
}: WallsToolbarProps) {
  const [openThrottle, setOpenThrottle] = useState(false);

  if (!["wall", "wallDoor", "wallDelete"].includes(activeTool)) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Undo / Redo */}
      <button
        title="Annuler (Ctrl+Z)"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border/50 bg-background/40 text-foreground/80 transition-all hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        title="Rétablir (Ctrl+Shift+Z)"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border/50 bg-background/40 text-foreground/80 transition-all hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Redo2 className="h-4 w-4" />
      </button>

      {/* Throttle rAF */}
      <Popover open={openThrottle} onOpenChange={setOpenThrottle}>
        <PopoverTrigger asChild>
          <button
            title="Fluidité aperçu murs"
            className="flex h-9 w-9 flex-col items-center justify-center gap-0 rounded-md border border-border/50 bg-background/40 text-foreground/80 transition-all hover:bg-background/80"
          >
            <Gauge className="h-3.5 w-3.5" />
            <span className="text-[8px] font-bold leading-tight">{rafThrottle + 1}x</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-44 p-3 space-y-2">
          <p className="text-xs font-medium">Fluidité aperçu</p>
          <Slider
            value={[rafThrottle]}
            onValueChange={([v]) => onRafThrottleChange(v)}
            min={0}
            max={5}
            step={1}
          />
          <p className="text-[10px] text-muted-foreground leading-tight">
            {rafThrottle === 0
              ? "Max fluide (redraw chaque frame)"
              : `Skip ${rafThrottle} frame${rafThrottle > 1 ? "s" : ""} entre redraws`}
          </p>
        </PopoverContent>
      </Popover>

      {/* Séparateur */}
      <div className="my-0.5 w-7 border-t border-border/50" />

      {/* Label */}
      <span className="text-center text-[8px] uppercase tracking-wider text-muted-foreground">
        Type
      </span>

      {/* Sélecteur de type */}
      {WALL_TYPES.map(({ type, icon, shortLabel }) => {
        const color = WALL_COLORS[type];
        const isSelected = selectedWallType === type;
        return (
          <button
            key={type}
            title={WALL_LABELS[type]}
            onClick={() => onSelectType(type)}
            className="flex h-9 w-9 items-center justify-center rounded-md transition-all"
            style={{
              background: isSelected ? `${color}33` : "transparent",
              color: isSelected ? color : "#64748b",
              border: isSelected ? `1px solid ${color}66` : "1px solid transparent",
              boxShadow: isSelected ? `0 0 8px ${color}44` : "none",
            }}
          >
            {icon}
          </button>
        );
      })}

      {/* Séparateur */}
      <div className="my-0.5 w-7 border-t border-border/50" />

      {/* Effacer tous les murs */}
      {wallCount > 0 && (
        <>
          <span className="text-center text-[8px] text-slate-500">
            {wallCount}
          </span>
          <button
            title={`Effacer tous les murs (${wallCount})`}
            onClick={() => {
              if (confirm(`Effacer les ${wallCount} murs ?`)) onClearAll();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <span className="text-center text-[8px] text-red-400/60 leading-none">
            Clear
          </span>
        </>
      )}
    </div>
  );
}

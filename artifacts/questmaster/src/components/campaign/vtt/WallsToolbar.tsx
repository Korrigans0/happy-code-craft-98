// ============================================================
// TOOLBAR MURS — Aetheria VTT
// Fichier : artifacts/questmaster/src/components/campaign/vtt/WallsToolbar.tsx
// ============================================================

import { useState } from "react";
import {
  Trash2, DoorOpen, DoorClosed,
  Undo2, Redo2, Gauge, HelpCircle,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { type WallType } from "./types";

interface WallsToolbarProps {
  selectedWallType?: WallType;
  onSelectType?: (type: WallType) => void;
  onClearAll: () => void;
  wallCount: number;
  activeTool: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  rafThrottle: number;
  onRafThrottleChange: (value: number) => void;
  // Portes
  doorsOpen?: number;
  doorsClosed?: number;
  onOpenAllDoors?: () => void;
  onCloseAllDoors?: () => void;
}


export default function WallsToolbar({
  onClearAll,
  wallCount,
  activeTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  rafThrottle,
  onRafThrottleChange,
  doorsOpen = 0,
  doorsClosed = 0,
  onOpenAllDoors,
  onCloseAllDoors,
}: WallsToolbarProps) {
  const [openThrottle, setOpenThrottle] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);

  if (!["wall", "wallDoor", "wallWindow", "wallTerrain", "wallDelete"].includes(activeTool)) return null;

  const totalDoors = doorsOpen + doorsClosed;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Aide */}
      <Popover open={openHelp} onOpenChange={setOpenHelp}>
        <PopoverTrigger asChild>
          <button
            title="Aide murs & portes"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 transition-all hover:bg-amber-500/20"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-72 p-3 space-y-2 text-xs">
          <p className="font-display text-sm font-semibold text-amber-400">
            Murs dynamiques
          </p>
          <ul className="space-y-1.5 text-muted-foreground leading-snug">
            <li>• <b>Mur solide</b> (W) : bloque mouvement et vision.</li>
            <li>• <b>Porte</b> (D) : bloque si fermée ; clic = ouvrir/fermer.</li>
            <li>• <b>Fenêtre</b> : bloque mouvement, laisse passer la vision.</li>
            <li>• <b>Terrain difficile</b> : ralentit, ne bloque pas.</li>
            <li>• <b>Clic-glisser</b> pour tracer ; <b>clic droit</b> ou Suppr pour effacer.</li>
            <li>• Ctrl+Z / Ctrl+Shift+Z : annuler / rétablir.</li>
          </ul>
        </PopoverContent>
      </Popover>

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

      {/* Fluidité */}
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

      <div className="my-0.5 w-7 border-t border-border/50" />


      {/* Contrôles portes globaux */}
      {totalDoors > 0 && (
        <>
          <div className="my-0.5 w-7 border-t border-border/50" />
          <span className="text-center text-[8px] uppercase tracking-wider text-muted-foreground leading-none">
            Portes
          </span>
          <span className="text-center text-[8px] text-amber-400/80 leading-none">
            {doorsOpen}/{totalDoors}
          </span>
          {onOpenAllDoors && (
            <button
              title="Ouvrir toutes les portes"
              onClick={onOpenAllDoors}
              disabled={doorsClosed === 0}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <DoorOpen className="h-4 w-4" />
            </button>
          )}
          {onCloseAllDoors && (
            <button
              title="Fermer toutes les portes"
              onClick={onCloseAllDoors}
              disabled={doorsOpen === 0}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <DoorClosed className="h-4 w-4" />
            </button>
          )}
        </>
      )}

      <div className="my-0.5 w-7 border-t border-border/50" />

      {/* Effacer tous les murs */}
      {wallCount > 0 && (
        <>
          <span className="text-center text-[8px] text-slate-500 leading-none">
            {wallCount} mur{wallCount > 1 ? "s" : ""}
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
        </>
      )}
    </div>
  );
}

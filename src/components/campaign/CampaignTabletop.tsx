import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Pencil, Eraser, Ruler, Square, Circle, Type, Move,
  Undo2, Redo2, Trash2, Download, Palette, Minus
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Tool = "pencil" | "eraser" | "line" | "rect" | "circle" | "text" | "move";

interface DrawAction {
  type: Tool;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  text?: string;
}

const COLORS = [
  "hsl(0, 0%, 100%)",
  "hsl(0, 0%, 0%)",
  "hsl(0, 72%, 51%)",
  "hsl(142, 70%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(42, 65%, 58%)",
  "hsl(270, 70%, 60%)",
  "hsl(32, 95%, 55%)",
];

interface CampaignTabletopProps {
  campaignId: string;
  isGM: boolean;
}

const CampaignTabletop = ({ campaignId, isGM }: CampaignTabletopProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [undoneActions, setUndoneActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x),
      y: (e.clientY - rect.top - panOffset.y),
    };
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    // Draw grid
    ctx.strokeStyle = "hsl(216, 20%, 15%)";
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    const startX = -panOffset.x - ((-panOffset.x) % gridSize);
    const startY = -panOffset.y - ((-panOffset.y) % gridSize);
    for (let x = startX; x < canvas.width - panOffset.x; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -panOffset.y);
      ctx.lineTo(x, canvas.height - panOffset.y);
      ctx.stroke();
    }
    for (let y = startY; y < canvas.height - panOffset.y; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-panOffset.x, y);
      ctx.lineTo(canvas.width - panOffset.x, y);
      ctx.stroke();
    }

    // Draw all actions
    const allActions = currentAction ? [...actions, currentAction] : actions;
    for (const action of allActions) {
      ctx.strokeStyle = action.type === "eraser" ? "hsl(216, 28%, 7%)" : action.color;
      ctx.fillStyle = action.color;
      ctx.lineWidth = action.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (action.type === "pencil" || action.type === "eraser") {
        if (action.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
      } else if (action.type === "line" && action.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        const last = action.points[action.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();

        // Ruler: show distance
        if (action.points.length >= 2) {
          const dx = last.x - action.points[0].x;
          const dy = last.y - action.points[0].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const squares = Math.round(dist / gridSize);
          const feet = squares * 5;
          ctx.font = "14px 'Lora', serif";
          ctx.fillStyle = action.color;
          const midX = (action.points[0].x + last.x) / 2;
          const midY = (action.points[0].y + last.y) / 2;
          ctx.fillText(`${feet} ft (${squares} cases)`, midX + 8, midY - 8);
        }
      } else if (action.type === "rect" && action.points.length >= 2) {
        const last = action.points[action.points.length - 1];
        const w = last.x - action.points[0].x;
        const h = last.y - action.points[0].y;
        ctx.strokeRect(action.points[0].x, action.points[0].y, w, h);
      } else if (action.type === "circle" && action.points.length >= 2) {
        const last = action.points[action.points.length - 1];
        const dx = last.x - action.points[0].x;
        const dy = last.y - action.points[0].y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(action.points[0].x, action.points[0].y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (action.type === "text" && action.text) {
        ctx.font = `${action.size * 5}px 'Cinzel', serif`;
        ctx.fillText(action.text, action.points[0].x, action.points[0].y);
      }
    }

    ctx.restore();
  }, [actions, currentAction, panOffset]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    if (tool === "move") {
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      setIsDrawing(true);
      return;
    }

    if (tool === "text") {
      const text = prompt("Texte à ajouter :");
      if (text) {
        const action: DrawAction = { type: "text", points: [coords], color, size: brushSize, text };
        setActions((prev) => [...prev, action]);
        setUndoneActions([]);
      }
      return;
    }

    setIsDrawing(true);
    setCurrentAction({ type: tool, points: [coords], color, size: brushSize });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    if (tool === "move" && lastPanPoint) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const coords = getCanvasCoords(e);
    if (currentAction) {
      if (tool === "pencil" || tool === "eraser") {
        setCurrentAction((prev) => prev ? { ...prev, points: [...prev.points, coords] } : null);
      } else {
        setCurrentAction((prev) => prev ? { ...prev, points: [prev.points[0], coords] } : null);
      }
    }
  };

  const handleMouseUp = () => {
    if (tool === "move") {
      setIsDrawing(false);
      setLastPanPoint(null);
      return;
    }

    if (currentAction) {
      setActions((prev) => [...prev, currentAction]);
      setUndoneActions([]);
      setCurrentAction(null);
    }
    setIsDrawing(false);
  };

  const undo = () => {
    setActions((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUndoneActions((u) => [...u, last]);
      return prev.slice(0, -1);
    });
  };

  const redo = () => {
    setUndoneActions((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setActions((a) => [...a, last]);
      return prev.slice(0, -1);
    });
  };

  const clearAll = () => {
    setActions([]);
    setUndoneActions([]);
    setPanOffset({ x: 0, y: 0 });
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "tabletop.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "pencil", icon: <Pencil className="h-4 w-4" />, label: "Crayon" },
    { id: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Gomme" },
    { id: "line", icon: <Ruler className="h-4 w-4" />, label: "Règle" },
    { id: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
    { id: "circle", icon: <Circle className="h-4 w-4" />, label: "Cercle" },
    { id: "text", icon: <Type className="h-4 w-4" />, label: "Texte" },
    { id: "move", icon: <Move className="h-4 w-4" />, label: "Déplacer" },
  ];

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
        {/* Tool buttons */}
        {tools.map((t) => (
          <Button
            key={t.id}
            variant={tool === t.id ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setTool(t.id)}
            title={t.label}
          >
            {t.icon}
          </Button>
        ))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Color picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" title="Couleur">
              <div
                className="h-5 w-5 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? "border-primary scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Brush size */}
        <div className="flex items-center gap-2 px-2">
          <Minus className="h-3 w-3 text-muted-foreground" />
          <Slider
            value={[brushSize]}
            onValueChange={([v]) => setBrushSize(v)}
            min={1}
            max={20}
            step={1}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground w-5 text-center">{brushSize}</span>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Actions */}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={undo} title="Annuler" disabled={actions.length === 0}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={redo} title="Rétablir" disabled={undoneActions.length === 0}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={clearAll} title="Tout effacer">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={exportCanvas} title="Exporter">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden rounded-lg border border-border bg-background"
        style={{ cursor: tool === "move" ? "grab" : "crosshair" }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block h-full w-full"
        />
      </div>
    </div>
  );
};

export default CampaignTabletop;

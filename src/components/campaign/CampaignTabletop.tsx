import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pencil, Eraser, Ruler, Square, Circle, Type, Move,
  Undo2, Redo2, Trash2, Download, Minus, ZoomIn, ZoomOut,
  Layers, Image, Users, PaintBucket, Eye, EyeOff, Upload,
  X, Plus, Search, Skull, Dices
} from "lucide-react";
import DiceRoller3D from "./DiceRoller3D";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Tool = "pencil" | "eraser" | "line" | "rect" | "circle" | "text" | "move" | "token";

interface DrawAction {
  type: Tool;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  text?: string;
  layer: string;
}

interface TokenItem {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  layer: string;
  visible: boolean;
  // Compendium link
  creatureId?: string;
  creatureType?: "wa_creature" | "monster";
  hp?: number;
  maxHp?: number;
  ac?: number;
}

interface MapLayer {
  id: string;
  name: string;
  type: "map" | "tokens" | "drawings" | "fog";
  visible: boolean;
  locked: boolean;
  opacity: number;
  imageUrl?: string;
}

const COLORS = [
  "hsl(0, 0%, 100%)", "hsl(0, 0%, 0%)",
  "hsl(0, 72%, 51%)", "hsl(142, 70%, 45%)",
  "hsl(217, 91%, 60%)", "hsl(42, 65%, 58%)",
  "hsl(270, 70%, 60%)", "hsl(32, 95%, 55%)",
];

const TOKEN_COLORS = [
  "hsl(0, 72%, 51%)", "hsl(217, 91%, 60%)", "hsl(142, 70%, 45%)",
  "hsl(42, 65%, 58%)", "hsl(270, 70%, 60%)", "hsl(32, 95%, 55%)",
  "hsl(330, 80%, 55%)", "hsl(180, 70%, 45%)",
];

interface CampaignTabletopProps {
  campaignId: string;
  isGM: boolean;
}

const GRID_SIZE = 40;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

const CampaignTabletop = ({ campaignId, isGM }: CampaignTabletopProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<Tool>("move");
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [undoneActions, setUndoneActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [draggedToken, setDraggedToken] = useState<string | null>(null);
  const [tokenDragOffset, setTokenDragOffset] = useState({ x: 0, y: 0 });
  const [activeDrawLayer, setActiveDrawLayer] = useState("drawings");
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenColor, setNewTokenColor] = useState(TOKEN_COLORS[0]);
  const [bestiarySearch, setBestiarySearch] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [diceOpen, setDiceOpen] = useState(false);

  const [layers, setLayers] = useState<MapLayer[]>([
    { id: "map", name: "Carte", type: "map", visible: true, locked: false, opacity: 100 },
    { id: "tokens", name: "Jetons", type: "tokens", visible: true, locked: false, opacity: 100 },
    { id: "drawings", name: "Dessins", type: "drawings", visible: true, locked: false, opacity: 100 },
    { id: "fog", name: "Brouillard", type: "fog", visible: false, locked: false, opacity: 70 },
  ]);

  // Fetch WA creatures for bestiary panel
  const { data: waCreatures = [] } = useQuery({
    queryKey: ['vtt-wa-creatures', bestiarySearch],
    queryFn: async () => {
      let query = supabase.from('wa_creatures').select('id, name, power_level, size, profile, strength, dexterity, constitution, intelligence, wisdom, charisma, ra');
      if (bestiarySearch.trim()) {
        query = query.ilike('name', `%${bestiarySearch.trim()}%`);
      }
      const { data } = await query.limit(50);
      return data || [];
    },
  });

  const spawnWACreature = (creature: typeof waCreatures[0]) => {
    const newToken: TokenItem = {
      id: crypto.randomUUID(),
      name: creature.name,
      x: (-panOffset.x / zoom) + 200,
      y: (-panOffset.y / zoom) + 200,
      size: creature.size === "Grand" ? GRID_SIZE * 2 : creature.size === "Très grand" ? GRID_SIZE * 3 : GRID_SIZE,
      color: "hsl(0, 72%, 51%)",
      label: creature.name.substring(0, 2).toUpperCase(),
      layer: "tokens",
      visible: true,
      creatureId: creature.id,
      creatureType: "wa_creature",
      hp: (creature.constitution || 0) * 5 + 10,
      maxHp: (creature.constitution || 0) * 5 + 10,
      ac: 10 + (creature.dexterity || 0),
    };
    setTokens(prev => [...prev, newToken]);
  };

  const updateTokenHp = (tokenId: string, delta: number) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      const newHp = Math.max(0, Math.min(t.maxHp || 999, (t.hp || 0) + delta));
      return { ...t, hp: newHp };
    }));
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, opacity } : l));
  };

  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        mapImageRef.current = img;
        setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: ev.target?.result as string } : l));
        redrawCanvas();
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addToken = () => {
    if (!newTokenName.trim()) return;
    const newToken: TokenItem = {
      id: crypto.randomUUID(),
      name: newTokenName.trim(),
      x: (-panOffset.x / zoom) + 200,
      y: (-panOffset.y / zoom) + 200,
      size: GRID_SIZE,
      color: newTokenColor,
      label: newTokenName.trim().substring(0, 2).toUpperCase(),
      layer: "tokens",
      visible: true,
    };
    setTokens(prev => [...prev, newToken]);
    setNewTokenName("");
  };

  const removeToken = (tokenId: string) => {
    setTokens(prev => prev.filter(t => t.id !== tokenId));
    if (selectedTokenId === tokenId) setSelectedTokenId(null);
  };

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    };
  }, [panOffset, zoom]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    const mapLayer = layers.find(l => l.id === "map");
    const tokensLayer = layers.find(l => l.id === "tokens");
    const drawingsLayer = layers.find(l => l.id === "drawings");
    const fogLayer = layers.find(l => l.id === "fog");

    // === MAP LAYER ===
    if (mapLayer?.visible && mapImageRef.current) {
      ctx.globalAlpha = mapLayer.opacity / 100;
      ctx.drawImage(mapImageRef.current, 0, 0);
      ctx.globalAlpha = 1;
    }

    // Draw grid
    ctx.strokeStyle = "hsl(216, 20%, 15%)";
    ctx.lineWidth = 0.5 / zoom;
    const viewLeft = -panOffset.x / zoom;
    const viewTop = -panOffset.y / zoom;
    const viewRight = viewLeft + canvas.width / zoom;
    const viewBottom = viewTop + canvas.height / zoom;
    const startX = Math.floor(viewLeft / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(viewTop / GRID_SIZE) * GRID_SIZE;
    for (let x = startX; x <= viewRight; x += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(x, viewTop); ctx.lineTo(x, viewBottom); ctx.stroke();
    }
    for (let y = startY; y <= viewBottom; y += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(viewLeft, y); ctx.lineTo(viewRight, y); ctx.stroke();
    }

    // === DRAWINGS LAYER ===
    if (drawingsLayer?.visible) {
      ctx.globalAlpha = drawingsLayer.opacity / 100;
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
          const dx = last.x - action.points[0].x;
          const dy = last.y - action.points[0].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const squares = Math.round(dist / GRID_SIZE);
          const feet = squares * 5;
          ctx.font = `${14 / zoom}px 'Lora', serif`;
          ctx.fillStyle = action.color;
          const midX = (action.points[0].x + last.x) / 2;
          const midY = (action.points[0].y + last.y) / 2;
          ctx.fillText(`${feet} ft (${squares} cases)`, midX + 8, midY - 8);
        } else if (action.type === "rect" && action.points.length >= 2) {
          const last = action.points[action.points.length - 1];
          ctx.strokeRect(action.points[0].x, action.points[0].y, last.x - action.points[0].x, last.y - action.points[0].y);
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
      ctx.globalAlpha = 1;
    }

    // === TOKENS LAYER ===
    if (tokensLayer?.visible) {
      ctx.globalAlpha = tokensLayer.opacity / 100;
      for (const token of tokens) {
        if (!token.visible) continue;
        const halfSize = token.size / 2;
        const isSelected = token.id === selectedTokenId;
        
        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(token.x + halfSize, token.y + halfSize, halfSize + 3, 0, Math.PI * 2);
          ctx.strokeStyle = "hsl(42, 65%, 58%)";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Token circle
        ctx.beginPath();
        ctx.arc(token.x + halfSize, token.y + halfSize, halfSize - 2, 0, Math.PI * 2);
        ctx.fillStyle = token.color;
        ctx.fill();
        ctx.strokeStyle = token.creatureId ? "hsl(0, 72%, 51%)" : "hsl(0, 0%, 100%)";
        ctx.lineWidth = token.creatureId ? 3 : 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = "hsl(0, 0%, 100%)";
        ctx.font = `bold ${14}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(token.label, token.x + halfSize, token.y + halfSize);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";

        // Name below
        ctx.fillStyle = "hsl(0, 0%, 90%)";
        ctx.font = `${10}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(token.name, token.x + halfSize, token.y + token.size + 12);
        
        // HP bar for linked creatures
        if (token.hp !== undefined && token.maxHp) {
          const barWidth = token.size - 4;
          const barHeight = 4;
          const barX = token.x + 2;
          const barY = token.y + token.size + 16;
          const hpRatio = token.hp / token.maxHp;
          
          ctx.fillStyle = "hsl(0, 0%, 20%)";
          ctx.fillRect(barX, barY, barWidth, barHeight);
          ctx.fillStyle = hpRatio > 0.5 ? "hsl(142, 70%, 45%)" : hpRatio > 0.25 ? "hsl(42, 65%, 58%)" : "hsl(0, 72%, 51%)";
          ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
          
          ctx.fillStyle = "hsl(0, 0%, 80%)";
          ctx.font = `${8}px sans-serif`;
          ctx.fillText(`${token.hp}/${token.maxHp}`, token.x + halfSize, barY + barHeight + 10);
        }
        
        ctx.textAlign = "start";
      }
      ctx.globalAlpha = 1;
    }

    // === FOG LAYER ===
    if (fogLayer?.visible) {
      ctx.globalAlpha = fogLayer.opacity / 100;
      ctx.fillStyle = "hsl(0, 0%, 0%)";
      ctx.fillRect(viewLeft, viewTop, viewRight - viewLeft, viewBottom - viewTop);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, [actions, currentAction, panOffset, zoom, tokens, layers, selectedTokenId]);

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

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const findTokenAt = (x: number, y: number): TokenItem | null => {
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      const half = t.size / 2;
      const dx = x - (t.x + half);
      const dy = y - (t.y + half);
      if (dx * dx + dy * dy <= half * half) return t;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const tokensLayer = layers.find(l => l.id === "tokens");
    if (tokensLayer?.visible && !tokensLayer.locked && (tool === "move" || tool === "token")) {
      const tokenHit = findTokenAt(coords.x, coords.y);
      if (tokenHit) {
        setDraggedToken(tokenHit.id);
        setSelectedTokenId(tokenHit.id);
        setTokenDragOffset({ x: coords.x - tokenHit.x, y: coords.y - tokenHit.y });
        setIsDrawing(true);
        return;
      } else {
        setSelectedTokenId(null);
      }
    }
    if (tool === "move") {
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      setIsDrawing(true);
      return;
    }
    if (tool === "token") return;
    if (tool === "text") {
      const text = prompt("Texte à ajouter :");
      if (text) {
        const action: DrawAction = { type: "text", points: [coords], color, size: brushSize, text, layer: activeDrawLayer };
        setActions(prev => [...prev, action]);
        setUndoneActions([]);
      }
      return;
    }
    setIsDrawing(true);
    setCurrentAction({ type: tool, points: [coords], color, size: brushSize, layer: activeDrawLayer });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (draggedToken) {
      const coords = getCanvasCoords(e);
      setTokens(prev => prev.map(t =>
        t.id === draggedToken
          ? { ...t, x: Math.round((coords.x - tokenDragOffset.x) / GRID_SIZE) * GRID_SIZE, y: Math.round((coords.y - tokenDragOffset.y) / GRID_SIZE) * GRID_SIZE }
          : t
      ));
      return;
    }
    if (tool === "move" && lastPanPoint) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    const coords = getCanvasCoords(e);
    if (currentAction) {
      if (tool === "pencil" || tool === "eraser") {
        setCurrentAction(prev => prev ? { ...prev, points: [...prev.points, coords] } : null);
      } else {
        setCurrentAction(prev => prev ? { ...prev, points: [prev.points[0], coords] } : null);
      }
    }
  };

  const handleMouseUp = () => {
    if (draggedToken) { setDraggedToken(null); setIsDrawing(false); return; }
    if (tool === "move") { setIsDrawing(false); setLastPanPoint(null); return; }
    if (currentAction) { setActions(prev => [...prev, currentAction]); setUndoneActions([]); setCurrentAction(null); }
    setIsDrawing(false);
  };

  const undo = () => { setActions(prev => { if (!prev.length) return prev; setUndoneActions(u => [...u, prev[prev.length - 1]]); return prev.slice(0, -1); }); };
  const redo = () => { setUndoneActions(prev => { if (!prev.length) return prev; setActions(a => [...a, prev[prev.length - 1]]); return prev.slice(0, -1); }); };
  const clearAll = () => { if (!confirm("Effacer tout le plateau ?")) return; setActions([]); setUndoneActions([]); setTokens([]); setPanOffset({ x: 0, y: 0 }); setZoom(1); mapImageRef.current = null; setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: undefined } : l)); };
  const exportCanvas = () => { const canvas = canvasRef.current; if (!canvas) return; const link = document.createElement("a"); link.download = "aetheria-tabletop.png"; link.href = canvas.toDataURL(); link.click(); };
  const zoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.15));
  const zoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.15));
  const resetView = () => { setZoom(1); setPanOffset({ x: 0, y: 0 }); };

  const selectedToken = tokens.find(t => t.id === selectedTokenId);

  const tools_list: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "move", icon: <Move className="h-4 w-4" />, label: "Déplacer" },
    { id: "token", icon: <Users className="h-4 w-4" />, label: "Sélection jeton" },
    { id: "pencil", icon: <Pencil className="h-4 w-4" />, label: "Crayon" },
    { id: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Gomme" },
    { id: "line", icon: <Ruler className="h-4 w-4" />, label: "Règle" },
    { id: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
    { id: "circle", icon: <Circle className="h-4 w-4" />, label: "Cercle" },
    { id: "text", icon: <Type className="h-4 w-4" />, label: "Texte" },
  ];

  const getLayerIcon = (type: string) => {
    switch (type) {
      case "map": return <Image className="h-4 w-4" />;
      case "tokens": return <Users className="h-4 w-4" />;
      case "drawings": return <Pencil className="h-4 w-4" />;
      case "fog": return <PaintBucket className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  const getCursor = () => {
    if (draggedToken) return "grabbing";
    if (tool === "move") return "grab";
    if (tool === "token") return "pointer";
    return "crosshair";
  };

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
        {tools_list.map(t => (
          <Button key={t.id} variant={tool === t.id ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setTool(t.id)} title={t.label}>
            {t.icon}
          </Button>
        ))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" title="Couleur">
              <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: color }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4 gap-1">
              {COLORS.map(c => (
                <button key={c} className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-primary scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 px-2">
          <Minus className="h-3 w-3 text-muted-foreground" />
          <Slider value={[brushSize]} onValueChange={([v]) => setBrushSize(v)} min={1} max={20} step={1} className="w-20" />
          <span className="text-xs text-muted-foreground w-5 text-center">{brushSize}</span>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={zoomOut} title="Dézoomer"><ZoomOut className="h-4 w-4" /></Button>
        <button onClick={resetView} className="min-w-[48px] rounded px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted" title="Réinitialiser">{Math.round(zoom * 100)}%</button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={zoomIn} title="Zoomer"><ZoomIn className="h-4 w-4" /></Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={undo} title="Annuler" disabled={actions.length === 0}><Undo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={redo} title="Rétablir" disabled={undoneActions.length === 0}><Redo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={clearAll} title="Tout effacer"><Trash2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={exportCanvas} title="Exporter"><Download className="h-4 w-4" /></Button>

        <div className="flex-1" />

        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDiceOpen(true)}>
          <Dices className="h-4 w-4" /> Dés
        </Button>

        {/* Bestiary + Layers panel */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Skull className="h-4 w-4" /> Bestiaire
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-96 p-0">
            <div className="flex h-full flex-col">
              <SheetHeader className="p-4 pb-2">
                <SheetTitle className="font-display text-gradient-gold">Bestiaire Aetheria</SheetTitle>
              </SheetHeader>
              
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher une créature..." 
                    value={bestiarySearch} 
                    onChange={e => setBestiarySearch(e.target.value)} 
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-[calc(100vh-240px)] px-4">
                    <div className="space-y-1.5 py-2">
                      {waCreatures.map(creature => (
                        <div key={creature.id} className="group flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2.5 hover:border-primary/30 hover:bg-muted/40 transition-colors">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
                            <Skull className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{creature.name}</p>
                            <p className="text-xs text-muted-foreground">{creature.power_level} • {creature.size} • {creature.profile}</p>
                          </div>
                          {isGM && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => spawnWACreature(creature)} title="Placer sur la carte">
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {waCreatures.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">Aucune créature trouvée</p>
                      )}
                    </div>
                  </ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Layers className="h-4 w-4" /> Calques
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Calques & Jetons</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Calques</h3>
                {layers.map(layer => (
                  <div key={layer.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
                    <div className="text-muted-foreground">{getLayerIcon(layer.type)}</div>
                    <span className="flex-1 text-sm font-medium">{layer.name}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleLayerVisibility(layer.id)}>
                      {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground w-7 text-right">{layer.opacity}%</span>
                      <Slider value={[layer.opacity]} onValueChange={([v]) => updateLayerOpacity(layer.id, v)} min={0} max={100} step={5} className="w-16" />
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {isGM && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Carte de fond</h3>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 transition-colors hover:border-primary/50 hover:bg-muted/30">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {layers.find(l => l.id === "map")?.imageUrl ? "Changer la carte" : "Charger une carte"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMapUpload} />
                  </label>
                  {layers.find(l => l.id === "map")?.imageUrl && (
                    <Button variant="destructive" size="sm" className="w-full" onClick={() => { mapImageRef.current = null; setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: undefined } : l)); }}>
                      <X className="mr-1 h-3 w-3" /> Retirer la carte
                    </Button>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Jetons manuels</h3>
                <div className="flex gap-2">
                  <Input placeholder="Nom" value={newTokenName} onChange={e => setNewTokenName(e.target.value)} className="flex-1 h-9" onKeyDown={e => e.key === "Enter" && addToken()} />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="h-9 w-9 shrink-0 rounded-md border border-border" style={{ backgroundColor: newTokenColor }} />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="grid grid-cols-4 gap-1">
                        {TOKEN_COLORS.map(c => (
                          <button key={c} className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${newTokenColor === c ? "border-primary scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setNewTokenColor(c)} />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={addToken} disabled={!newTokenName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {tokens.map(token => (
                    <div key={token.id} className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${token.id === selectedTokenId ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}>
                      <div className="h-5 w-5 shrink-0 rounded-full" style={{ backgroundColor: token.color }} />
                      <span className="flex-1 text-sm truncate">{token.name}</span>
                      {token.hp !== undefined && (
                        <span className="text-xs text-muted-foreground">{token.hp}/{token.maxHp}</span>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTokens(prev => prev.map(t => t.id === token.id ? { ...t, visible: !t.visible } : t))}>
                        {token.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeToken(token.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {tokens.length === 0 && (
                    <p className="py-2 text-center text-xs text-muted-foreground">Aucun jeton placé</p>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Canvas + selected token panel */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden rounded-lg border border-border bg-background"
          style={{ cursor: getCursor() }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block h-full w-full"
          />

          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-card/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <ZoomIn className="h-3 w-3" /> {Math.round(zoom * 100)}%
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-card/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <Layers className="h-3 w-3" /> {layers.filter(l => l.visible).length}/{layers.length}
          </div>
        </div>

        {/* Selected token detail panel */}
        {selectedToken && isGM && (
          <div className="w-56 shrink-0 space-y-3 rounded-lg border border-border bg-card p-3 overflow-y-auto">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full shrink-0" style={{ backgroundColor: selectedToken.color }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{selectedToken.name}</p>
                {selectedToken.creatureType && (
                  <p className="text-xs text-muted-foreground">
                    {selectedToken.creatureType === "wa_creature" ? "Aetheria" : "Créature"}
                  </p>
                )}
              </div>
            </div>
            
            {selectedToken.hp !== undefined && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">PV</span>
                    <span className="text-sm font-medium">{selectedToken.hp}/{selectedToken.maxHp}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={() => updateTokenHp(selectedToken.id, -1)}>-1</Button>
                    <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={() => updateTokenHp(selectedToken.id, -5)}>-5</Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => updateTokenHp(selectedToken.id, 1)}>+1</Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => updateTokenHp(selectedToken.id, 5)}>+5</Button>
                  </div>
                  {selectedToken.ac !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">CA</span>
                      <span className="text-sm font-medium">{selectedToken.ac}</span>
                    </div>
                  )}
                </div>
              </>
            )}
            
            <Separator />
            <Button size="sm" variant="destructive" className="w-full h-7 text-xs" onClick={() => removeToken(selectedToken.id)}>
              <Trash2 className="mr-1 h-3 w-3" /> Retirer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignTabletop;
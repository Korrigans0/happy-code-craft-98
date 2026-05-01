import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pencil, Eraser, Ruler, Square, Circle, Type, Move,
  Undo2, Redo2, Trash2, Download, Minus, ZoomIn, ZoomOut,
  Layers, Image, Users, PaintBucket, Eye, EyeOff, Upload,
  X, Plus, Search, Skull, Dices, RotateCw, Copy, Magnet, Crosshair,
  Maximize2,
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
  size: number;       // pixels (multiple of GRID_SIZE)
  sizeUnits: number;  // 1, 2, 3, 4 cases
  rotation: number;   // degrees
  color: string;
  label: string;
  layer: string;
  visible: boolean;
  creatureId?: string;
  creatureType?: "wa_creature" | "monster" | "character";
  hp?: number;
  maxHp?: number;
  ac?: number;
  imageUrl?: string;
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
const M_PER_SQUARE = 1.5;

const CampaignTabletop = ({ campaignId, isGM }: CampaignTabletopProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const tokenImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

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
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [tokenDragOffset, setTokenDragOffset] = useState({ x: 0, y: 0 });
  const [activeDrawLayer, setActiveDrawLayer] = useState("drawings");
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenColor, setNewTokenColor] = useState(TOKEN_COLORS[0]);
  const [bestiarySearch, setBestiarySearch] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [diceOpen, setDiceOpen] = useState(false);
  const [draggingCharId, setDraggingCharId] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [collisionEnabled, setCollisionEnabled] = useState(true);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [layers, setLayers] = useState<MapLayer[]>([
    { id: "map", name: "Carte", type: "map", visible: true, locked: false, opacity: 100 },
    { id: "tokens", name: "Jetons", type: "tokens", visible: true, locked: false, opacity: 100 },
    { id: "drawings", name: "Dessins", type: "drawings", visible: true, locked: false, opacity: 100 },
    { id: "fog", name: "Brouillard", type: "fog", visible: false, locked: false, opacity: 70 },
  ]);

  // Fetch WA creatures
  const { data: waCreatures = [] } = useQuery({
    queryKey: ['vtt-wa-creatures', bestiarySearch],
    queryFn: async () => {
      let query = supabase.from('wa_creatures').select('id, name, power_level, size, profile, strength, dexterity, constitution, intelligence, wisdom, charisma, ra');
      if (bestiarySearch.trim()) query = query.ilike('name', `%${bestiarySearch.trim()}%`);
      const { data } = await query.limit(50);
      return data || [];
    },
  });

  const { data: userCharacters = [] } = useQuery({
    queryKey: ['vtt-user-characters'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('characters')
        .select('id, name, race, class, level, hp, max_hp, armor_class, avatar_url')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      return data || [];
    },
  });

  // Preload token images
  useEffect(() => {
    for (const token of tokens) {
      if (!token.imageUrl) continue;
      if (tokenImagesRef.current.has(token.imageUrl)) continue;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        tokenImagesRef.current.set(token.imageUrl!, img);
        setTokens(prev => [...prev]);
      };
      img.src = token.imageUrl;
    }
  }, [tokens]);

  // === Helpers ===
  const snapValue = useCallback((v: number) => {
    return snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;
  }, [snapToGrid]);

  const tokensOverlap = (a: { x: number; y: number; size: number }, b: { x: number; y: number; size: number }) => {
    return !(a.x + a.size <= b.x || b.x + b.size <= a.x || a.y + a.size <= b.y || b.y + b.size <= a.y);
  };

  const findFreePosition = useCallback((x: number, y: number, size: number, ignoreId?: string): { x: number; y: number } => {
    if (!collisionEnabled) return { x, y };
    const others = tokens.filter(t => t.id !== ignoreId && t.visible);
    if (!others.some(o => tokensOverlap({ x, y, size }, { x: o.x, y: o.y, size: o.size }))) {
      return { x, y };
    }
    // Spiral search around target on grid
    for (let r = 1; r < 12; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nx = x + dx * GRID_SIZE;
          const ny = y + dy * GRID_SIZE;
          if (!others.some(o => tokensOverlap({ x: nx, y: ny, size }, { x: o.x, y: o.y, size: o.size }))) {
            return { x: nx, y: ny };
          }
        }
      }
    }
    return { x, y };
  }, [collisionEnabled, tokens]);

  const buildCharacterToken = (char: typeof userCharacters[0], worldX: number, worldY: number): TokenItem => {
    const targetX = snapValue(worldX - GRID_SIZE / 2);
    const targetY = snapValue(worldY - GRID_SIZE / 2);
    const free = findFreePosition(targetX, targetY, GRID_SIZE);
    return {
      id: crypto.randomUUID(),
      name: char.name,
      x: free.x,
      y: free.y,
      size: GRID_SIZE,
      sizeUnits: 1,
      rotation: 0,
      color: "hsl(42, 65%, 58%)",
      label: char.name.substring(0, 2).toUpperCase(),
      layer: "tokens",
      visible: true,
      creatureId: char.id,
      creatureType: "character",
      hp: char.hp ?? char.max_hp ?? 10,
      maxHp: char.max_hp ?? 10,
      ac: char.armor_class ?? 10,
      imageUrl: char.avatar_url || undefined,
    };
  };

  const spawnCharacter = (char: typeof userCharacters[0]) => {
    const wx = (-panOffset.x / zoom) + 200;
    const wy = (-panOffset.y / zoom) + 200;
    setTokens(prev => [...prev, buildCharacterToken(char, wx, wy)]);
  };

  const spawnCharacterAt = (char: typeof userCharacters[0], clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const wx = (clientX - rect.left - panOffset.x) / zoom;
    const wy = (clientY - rect.top - panOffset.y) / zoom;
    setTokens(prev => [...prev, buildCharacterToken(char, wx, wy)]);
  };

  const spawnWACreature = (creature: typeof waCreatures[0]) => {
    const sizeUnits = creature.size === "Très grand" ? 3 : creature.size === "Grand" ? 2 : 1;
    const size = GRID_SIZE * sizeUnits;
    const wx = snapValue((-panOffset.x / zoom) + 200 - size / 2);
    const wy = snapValue((-panOffset.y / zoom) + 200 - size / 2);
    const free = findFreePosition(wx, wy, size);
    const newToken: TokenItem = {
      id: crypto.randomUUID(),
      name: creature.name,
      x: free.x,
      y: free.y,
      size,
      sizeUnits,
      rotation: 0,
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

  const rotateToken = (tokenId: string, deg: number) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, rotation: (t.rotation + deg + 360) % 360 } : t));
  };

  const resizeToken = (tokenId: string, sizeUnits: number) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      const newSize = GRID_SIZE * sizeUnits;
      return { ...t, sizeUnits, size: newSize };
    }));
  };

  const duplicateToken = (tokenId: string) => {
    const src = tokens.find(t => t.id === tokenId);
    if (!src) return;
    const targetX = src.x + GRID_SIZE;
    const targetY = src.y;
    const free = findFreePosition(targetX, targetY, src.size);
    const copy: TokenItem = { ...src, id: crypto.randomUUID(), x: free.x, y: free.y };
    setTokens(prev => [...prev, copy]);
    setSelectedTokenId(copy.id);
  };

  const moveTokenBy = (tokenId: string, dx: number, dy: number) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      const targetX = t.x + dx;
      const targetY = t.y + dy;
      const free = findFreePosition(targetX, targetY, t.size, t.id);
      return { ...t, x: free.x, y: free.y };
    }));
  };

  const centerOnToken = (tokenId: string) => {
    const t = tokens.find(x => x.id === tokenId);
    const canvas = canvasRef.current;
    if (!t || !canvas) return;
    setPanOffset({
      x: canvas.width / 2 - (t.x + t.size / 2) * zoom,
      y: canvas.height / 2 - (t.y + t.size / 2) * zoom,
    });
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
    const wx = snapValue((-panOffset.x / zoom) + 200);
    const wy = snapValue((-panOffset.y / zoom) + 200);
    const free = findFreePosition(wx, wy, GRID_SIZE);
    const newToken: TokenItem = {
      id: crypto.randomUUID(),
      name: newTokenName.trim(),
      x: free.x,
      y: free.y,
      size: GRID_SIZE,
      sizeUnits: 1,
      rotation: 0,
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

    const viewLeft = -panOffset.x / zoom;
    const viewTop = -panOffset.y / zoom;
    const viewRight = viewLeft + canvas.width / zoom;
    const viewBottom = viewTop + canvas.height / zoom;
    const startX = Math.floor(viewLeft / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(viewTop / GRID_SIZE) * GRID_SIZE;

    const drawGrid = (alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      // Minor grid
      ctx.strokeStyle = "hsl(216, 20%, 25%)";
      ctx.lineWidth = 0.5 / zoom;
      for (let x = startX; x <= viewRight; x += GRID_SIZE) {
        const isMajor = Math.round(x / GRID_SIZE) % 5 === 0;
        if (isMajor) continue;
        ctx.beginPath(); ctx.moveTo(x, viewTop); ctx.lineTo(x, viewBottom); ctx.stroke();
      }
      for (let y = startY; y <= viewBottom; y += GRID_SIZE) {
        const isMajor = Math.round(y / GRID_SIZE) % 5 === 0;
        if (isMajor) continue;
        ctx.beginPath(); ctx.moveTo(viewLeft, y); ctx.lineTo(viewRight, y); ctx.stroke();
      }
      // Major grid (every 5 squares = 25 ft)
      ctx.strokeStyle = "hsl(42, 50%, 45%)";
      ctx.lineWidth = 1 / zoom;
      for (let x = startX; x <= viewRight; x += GRID_SIZE) {
        if (Math.round(x / GRID_SIZE) % 5 !== 0) continue;
        ctx.beginPath(); ctx.moveTo(x, viewTop); ctx.lineTo(x, viewBottom); ctx.stroke();
      }
      for (let y = startY; y <= viewBottom; y += GRID_SIZE) {
        if (Math.round(y / GRID_SIZE) % 5 !== 0) continue;
        ctx.beginPath(); ctx.moveTo(viewLeft, y); ctx.lineTo(viewRight, y); ctx.stroke();
      }
      ctx.restore();
    };

    drawGrid(1);

    // === DRAWINGS LAYER ===
    if (drawingsLayer?.visible) {
      ctx.globalAlpha = drawingsLayer.opacity / 100;
      const allActions = currentAction ? [...actions, currentAction] : actions;
      for (const action of allActions) {
        const isEraser = action.type === "eraser";
        if (isEraser) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.strokeStyle = "hsl(0, 0%, 0%)";
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = action.color;
        }
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
          const feet = squares * FT_PER_SQUARE;
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
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    // Re-draw grid ON TOP so it's never erased
    drawGrid(0.4);

    // === TOKENS LAYER ===
    if (tokensLayer?.visible) {
      ctx.globalAlpha = tokensLayer.opacity / 100;
      for (const token of tokens) {
        if (!token.visible) continue;
        const halfSize = token.size / 2;
        const cx = token.x + halfSize;
        const cy = token.y + halfSize;
        const isSelected = token.id === selectedTokenId;
        const isDragged = token.id === draggedToken;

        // Drop shadow under token
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = isDragged ? 18 : 8;
        ctx.shadowOffsetY = isDragged ? 6 : 3;
        ctx.beginPath();
        ctx.arc(cx, cy, halfSize - 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.001)";
        ctx.fill();
        ctx.restore();

        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(cx, cy, halfSize + 4, 0, Math.PI * 2);
          ctx.strokeStyle = "hsl(42, 65%, 58%)";
          ctx.lineWidth = 3 / zoom;
          ctx.setLineDash([6 / zoom, 4 / zoom]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const ringColor = token.creatureType === "character"
          ? "hsl(42, 65%, 58%)"
          : token.creatureId
          ? "hsl(0, 72%, 51%)"
          : "hsl(0, 0%, 100%)";

        // Rotate the token's body around its center
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((token.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);

        const cachedImg = token.imageUrl ? tokenImagesRef.current.get(token.imageUrl) : undefined;
        if (cachedImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, halfSize - 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(cachedImg, token.x, token.y, token.size, token.size);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, halfSize - 2, 0, Math.PI * 2);
          ctx.fillStyle = token.color;
          ctx.fill();
          ctx.fillStyle = "hsl(0, 0%, 100%)";
          ctx.font = `bold ${Math.max(12, halfSize * 0.5)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(token.label, cx, cy);
          ctx.textAlign = "start";
          ctx.textBaseline = "alphabetic";
        }

        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, halfSize - 2, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = (token.creatureId ? 3 : 2) / zoom;
        ctx.stroke();

        // Direction arrow (small triangle at top of rotated frame)
        ctx.beginPath();
        ctx.moveTo(cx, cy - halfSize - 6);
        ctx.lineTo(cx - 5, cy - halfSize + 2);
        ctx.lineTo(cx + 5, cy - halfSize + 2);
        ctx.closePath();
        ctx.fillStyle = ringColor;
        ctx.fill();

        ctx.restore(); // end rotation

        // Name below (not rotated)
        ctx.fillStyle = "hsl(0, 0%, 90%)";
        ctx.font = `${10}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(token.name, cx, token.y + token.size + 12);

        // HP bar
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
          ctx.fillText(`${token.hp}/${token.maxHp}`, cx, barY + barHeight + 10);
        }

        ctx.textAlign = "start";

        // Movement measurement while dragging
        if (isDragged && dragStart) {
          const sx = dragStart.x + halfSize;
          const sy = dragStart.y + halfSize;
          const dxw = cx - sx;
          const dyw = cy - sy;
          const dist = Math.sqrt(dxw * dxw + dyw * dyw);
          const squares = Math.round(dist / GRID_SIZE);
          const feet = squares * FT_PER_SQUARE;
          ctx.save();
          ctx.strokeStyle = "hsl(42, 65%, 58%)";
          ctx.lineWidth = 2 / zoom;
          ctx.setLineDash([5 / zoom, 4 / zoom]);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(cx, cy);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "hsl(42, 65%, 58%)";
          ctx.font = `bold ${14 / zoom}px 'Lora', serif`;
          ctx.fillText(`${feet} ft (${squares} cases)`, cx + 12, cy - 12);
          ctx.restore();
        }
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
  }, [actions, currentAction, panOffset, zoom, tokens, layers, selectedTokenId, draggedToken, dragStart]);

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

  // Wheel zoom anchored to cursor + Shift+wheel rotates selected token
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Shift+wheel rotates selected token
      if (e.shiftKey && selectedTokenId) {
        rotateToken(selectedTokenId, e.deltaY > 0 ? 15 : -15);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
        if (next === prev) return prev;
        // Zoom around cursor
        const wx = (mx - panOffset.x) / prev;
        const wy = (my - panOffset.y) / prev;
        setPanOffset({ x: mx - wx * next, y: my - wy * next });
        return next;
      });
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [selectedTokenId, panOffset]);

  // Touch support: 1 finger = pan/drag, 2 fingers = pinch-to-zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mode: "none" | "pan" | "pinch" | "token" = "none";
    let lastTouch = { x: 0, y: 0 };
    let lastDist = 0;
    let lastCenter = { x: 0, y: 0 };
    let activeTokenId: string | null = null;
    let tokenOffset = { x: 0, y: 0 };

    const dist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const center = (a: Touch, b: Touch) => ({
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    });
    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left - panOffset.x) / zoom,
        y: (clientY - rect.top - panOffset.y) / zoom,
      };
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const t = e.touches[0];
        lastTouch = { x: t.clientX, y: t.clientY };
        const tokensLayer = layers.find(l => l.id === "tokens");
        if (tokensLayer?.visible && !tokensLayer.locked && (tool === "move" || tool === "token")) {
          const w = toWorld(t.clientX, t.clientY);
          const hit = findTokenAt(w.x, w.y);
          if (hit) {
            activeTokenId = hit.id;
            tokenOffset = { x: w.x - hit.x, y: w.y - hit.y };
            setSelectedTokenId(hit.id);
            setDraggedToken(hit.id);
            mode = "token";
            return;
          }
          setSelectedTokenId(null);
        }
        mode = "pan";
      } else if (e.touches.length === 2) {
        mode = "pinch";
        lastDist = dist(e.touches[0], e.touches[1]);
        lastCenter = center(e.touches[0], e.touches[1]);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (mode === "token" && e.touches.length === 1 && activeTokenId) {
        const t = e.touches[0];
        const w = toWorld(t.clientX, t.clientY);
        const rawX = w.x - tokenOffset.x;
        const rawY = w.y - tokenOffset.y;
        const sx = snapValue(rawX);
        const sy = snapValue(rawY);
        const tokenId = activeTokenId;
        setTokens(prev => prev.map(tok => {
          if (tok.id !== tokenId) return tok;
          if (collisionEnabled) {
            const overlaps = prev.some(o =>
              o.id !== tokenId && o.visible &&
              tokensOverlap({ x: sx, y: sy, size: tok.size }, { x: o.x, y: o.y, size: o.size })
            );
            if (overlaps) return tok;
          }
          return { ...tok, x: sx, y: sy };
        }));
        return;
      }
      if (mode === "pan" && e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - lastTouch.x;
        const dy = t.clientY - lastTouch.y;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastTouch = { x: t.clientX, y: t.clientY };
        return;
      }
      if (mode === "pinch" && e.touches.length === 2) {
        const newDist = dist(e.touches[0], e.touches[1]);
        const newCenter = center(e.touches[0], e.touches[1]);
        const rect = canvas.getBoundingClientRect();
        const cx = newCenter.x - rect.left;
        const cy = newCenter.y - rect.top;
        const factor = newDist / (lastDist || newDist);
        setZoom(prev => {
          const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));
          if (next === prev) {
            // still pan with center movement
            const cdx = newCenter.x - lastCenter.x;
            const cdy = newCenter.y - lastCenter.y;
            setPanOffset(p => ({ x: p.x + cdx, y: p.y + cdy }));
            return prev;
          }
          const wx = (cx - panOffset.x) / prev;
          const wy = (cy - panOffset.y) / prev;
          const cdx = newCenter.x - lastCenter.x;
          const cdy = newCenter.y - lastCenter.y;
          setPanOffset({ x: cx - wx * next + cdx, y: cy - wy * next + cdy });
          return next;
        });
        lastDist = newDist;
        lastCenter = newCenter;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        mode = "none";
        activeTokenId = null;
        setDraggedToken(null);
      } else if (e.touches.length === 1 && mode === "pinch") {
        // transition pinch -> pan
        const t = e.touches[0];
        lastTouch = { x: t.clientX, y: t.clientY };
        mode = "pan";
      }
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [panOffset, zoom, tool, layers, collisionEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      // Space => temp pan
      if (e.code === "Space") { e.preventDefault(); setIsSpacePressed(true); return; }

      // Tools
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === "v" || e.key === "V") setTool("move");
        else if (e.key === "p" || e.key === "P") setTool("pencil");
        else if (e.key === "e" || e.key === "E") setTool("eraser");
        else if (e.key === "l" || e.key === "L") setTool("line");
        else if (e.key === "t" || e.key === "T") setTool("text");
        else if (e.key === "g" || e.key === "G") setSnapToGrid(s => !s);
      }

      if (selectedTokenId) {
        const step = e.shiftKey ? GRID_SIZE * 5 : GRID_SIZE;
        if (e.key === "ArrowUp") { e.preventDefault(); moveTokenBy(selectedTokenId, 0, -step); }
        else if (e.key === "ArrowDown") { e.preventDefault(); moveTokenBy(selectedTokenId, 0, step); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); moveTokenBy(selectedTokenId, -step, 0); }
        else if (e.key === "ArrowRight") { e.preventDefault(); moveTokenBy(selectedTokenId, step, 0); }
        else if (e.key === "r") rotateToken(selectedTokenId, 15);
        else if (e.key === "R") rotateToken(selectedTokenId, -15);
        else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeToken(selectedTokenId); }
        else if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); duplicateToken(selectedTokenId); }
        else if (e.key === "f" || e.key === "F") centerOnToken(selectedTokenId);
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpacePressed(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTokenId, tokens, collisionEnabled]);

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
    // Middle click or space => pan
    if (e.button === 1 || isSpacePressed) {
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      setIsDrawing(true);
      return;
    }

    const tokensLayer = layers.find(l => l.id === "tokens");
    if (tokensLayer?.visible && !tokensLayer.locked && (tool === "move" || tool === "token")) {
      const tokenHit = findTokenAt(coords.x, coords.y);
      if (tokenHit) {
        setDraggedToken(tokenHit.id);
        setSelectedTokenId(tokenHit.id);
        setDragStart({ x: tokenHit.x, y: tokenHit.y });
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
      const draggedT = tokens.find(t => t.id === draggedToken);
      if (!draggedT) return;
      const rawX = coords.x - tokenDragOffset.x;
      const rawY = coords.y - tokenDragOffset.y;
      const sx = snapValue(rawX);
      const sy = snapValue(rawY);
      // Live collision: don't allow overlap; show last valid pos
      let nextX = sx;
      let nextY = sy;
      if (collisionEnabled) {
        const overlaps = tokens.some(o =>
          o.id !== draggedToken && o.visible &&
          tokensOverlap({ x: sx, y: sy, size: draggedT.size }, { x: o.x, y: o.y, size: o.size })
        );
        if (overlaps) { nextX = draggedT.x; nextY = draggedT.y; }
      }
      setTokens(prev => prev.map(t => t.id === draggedToken ? { ...t, x: nextX, y: nextY } : t));
      return;
    }
    if ((tool === "move" || isSpacePressed) && lastPanPoint) {
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
    if (draggedToken) { setDraggedToken(null); setDragStart(null); setIsDrawing(false); return; }
    if (tool === "move" || isSpacePressed) { setIsDrawing(false); setLastPanPoint(null); return; }
    if (currentAction) { setActions(prev => [...prev, currentAction]); setUndoneActions([]); setCurrentAction(null); }
    setIsDrawing(false);
  };

  const undo = () => { setActions(prev => { if (!prev.length) return prev; setUndoneActions(u => [...u, prev[prev.length - 1]]); return prev.slice(0, -1); }); };
  const redo = () => { setUndoneActions(prev => { if (!prev.length) return prev; setActions(a => [...a, prev[prev.length - 1]]); return prev.slice(0, -1); }); };
  const clearAll = () => {
    if (!confirm("Effacer tout le plateau ?")) return;
    setActions([]); setUndoneActions([]); setTokens([]); setPanOffset({ x: 0, y: 0 }); setZoom(1);
    mapImageRef.current = null;
    setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: undefined } : l));
  };
  const exportCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const link = document.createElement("a"); link.download = "aetheria-tabletop.png"; link.href = canvas.toDataURL(); link.click();
  };
  const zoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.15));
  const zoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.15));
  const resetView = () => { setZoom(1); setPanOffset({ x: 0, y: 0 }); };

  const selectedToken = tokens.find(t => t.id === selectedTokenId);

  const tools_list: { id: Tool; icon: React.ReactNode; label: string; key: string }[] = [
    { id: "move", icon: <Move className="h-4 w-4" />, label: "Déplacer", key: "V" },
    { id: "token", icon: <Users className="h-4 w-4" />, label: "Sélection jeton", key: "" },
    { id: "pencil", icon: <Pencil className="h-4 w-4" />, label: "Crayon", key: "P" },
    { id: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Gomme", key: "E" },
    { id: "line", icon: <Ruler className="h-4 w-4" />, label: "Règle", key: "L" },
    { id: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle", key: "" },
    { id: "circle", icon: <Circle className="h-4 w-4" />, label: "Cercle", key: "" },
    { id: "text", icon: <Type className="h-4 w-4" />, label: "Texte", key: "T" },
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
    if (isSpacePressed) return "grab";
    if (tool === "move") return "grab";
    if (tool === "token") return "pointer";
    return "crosshair";
  };

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
        {tools_list.map(t => (
          <Button
            key={t.id}
            variant={tool === t.id ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setTool(t.id)}
            title={t.key ? `${t.label} (${t.key})` : t.label}
          >
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

        <Button
          variant={snapToGrid ? "default" : "ghost"}
          size="icon"
          className="h-9 w-9"
          onClick={() => setSnapToGrid(s => !s)}
          title={`Magnétisme grille (G) ${snapToGrid ? "ON" : "OFF"}`}
        >
          <Magnet className="h-4 w-4" />
        </Button>
        <Button
          variant={collisionEnabled ? "default" : "ghost"}
          size="icon"
          className="h-9 w-9"
          onClick={() => setCollisionEnabled(c => !c)}
          title={`Collision jetons ${collisionEnabled ? "ON" : "OFF"}`}
        >
          <Crosshair className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={zoomOut} title="Dézoomer"><ZoomOut className="h-4 w-4" /></Button>
        <button onClick={resetView} className="min-w-[48px] rounded px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted" title="Réinitialiser">{Math.round(zoom * 100)}%</button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={zoomIn} title="Zoomer"><ZoomIn className="h-4 w-4" /></Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={undo} title="Annuler (Ctrl+Z)" disabled={actions.length === 0}><Undo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={redo} title="Rétablir (Ctrl+Y)" disabled={undoneActions.length === 0}><Redo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={clearAll} title="Tout effacer"><Trash2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={exportCanvas} title="Exporter PNG"><Download className="h-4 w-4" /></Button>

        <div className="flex-1" />

        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDiceOpen(true)}>
          <Dices className="h-4 w-4" /> Dés
        </Button>

        {/* Personnages joueurs */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Users className="h-4 w-4" /> Personnages
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-96 p-0">
            <div className="flex h-full flex-col">
              <SheetHeader className="p-4 pb-2">
                <SheetTitle className="font-display text-gradient-gold">Mes personnages</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-140px)] px-4">
                  <div className="space-y-1.5 py-2">
                    {userCharacters.map(char => (
                      <div
                        key={char.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggingCharId(char.id);
                          e.dataTransfer.effectAllowed = "copy";
                          e.dataTransfer.setData("application/x-aetheria-char", char.id);
                        }}
                        onDragEnd={() => setDraggingCharId(null)}
                        className={`group flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2.5 hover:border-primary/30 hover:bg-muted/40 transition-colors cursor-grab active:cursor-grabbing ${draggingCharId === char.id ? "opacity-50" : ""}`}
                      >
                        {char.avatar_url ? (
                          <img src={char.avatar_url} alt={char.name} className="h-10 w-10 shrink-0 rounded-full border border-primary/40 object-cover pointer-events-none" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/40 text-sm font-bold pointer-events-none">
                            {char.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 pointer-events-none">
                          <p className="text-sm font-medium truncate">{char.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Niv. {char.level} • {char.race} {char.class}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70">
                            PV {char.hp}/{char.max_hp} • CA {char.armor_class}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => spawnCharacter(char)} title="Placer sur la carte">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {userCharacters.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Aucun personnage créé.<br />
                        Créez-en un depuis l'onglet Personnages.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Bestiaire */}
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
                  <Input placeholder="Rechercher une créature..." value={bestiarySearch} onChange={e => setBestiarySearch(e.target.value)} className="pl-9 h-9" />
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
                      <button className="flex-1 text-sm truncate text-left" onClick={() => { setSelectedTokenId(token.id); centerOnToken(token.id); }}>
                        {token.name}
                      </button>
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
          className={`relative flex-1 overflow-hidden rounded-lg border bg-background transition-colors ${isDragOverCanvas ? "border-primary border-2 ring-2 ring-primary/30" : "border-border"}`}
          style={{ cursor: getCursor() }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-aetheria-char")) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              if (!isDragOverCanvas) setIsDragOverCanvas(true);
            }
          }}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) setIsDragOverCanvas(false);
          }}
          onDrop={(e) => {
            const charId = e.dataTransfer.getData("application/x-aetheria-char");
            setIsDragOverCanvas(false);
            setDraggingCharId(null);
            if (!charId) return;
            const char = userCharacters.find(c => c.id === charId);
            if (!char) return;
            e.preventDefault();
            spawnCharacterAt(char, e.clientX, e.clientY);
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            className="block h-full w-full"
            style={{ touchAction: "none" }}
          />

          {isDragOverCanvas && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/5">
              <div className="rounded-lg border-2 border-dashed border-primary bg-card/90 px-6 py-3 font-display text-lg text-gradient-gold shadow-gold animate-fade-in">
                Lâchez pour placer le personnage
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-card/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <ZoomIn className="h-3 w-3" /> {Math.round(zoom * 100)}%
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-md bg-card/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <Layers className="h-3 w-3" /> {layers.filter(l => l.visible).length}/{layers.length}
            {snapToGrid && <span className="text-primary">• Magnet</span>}
            {collisionEnabled && <span className="text-primary">• Collision</span>}
          </div>

          {/* Help hint */}
          <div className="pointer-events-none absolute top-3 left-3 rounded-md bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
            Espace = pan • Molette = zoom • Maj+Molette = rotation • R/⇧R = tourner • ←↑→↓ = bouger • Suppr = supprimer • Ctrl+D = dupliquer • F = recentrer
          </div>

          <DiceRoller3D open={diceOpen} onClose={() => setDiceOpen(false)} />
        </div>

        {/* Selected token detail panel */}
        {selectedToken && (
          <div className="w-60 shrink-0 space-y-3 rounded-lg border border-border bg-card p-3 overflow-y-auto">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full shrink-0" style={{ backgroundColor: selectedToken.color }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{selectedToken.name}</p>
                {selectedToken.creatureType && (
                  <p className="text-xs text-muted-foreground">
                    {selectedToken.creatureType === "character" ? "Personnage joueur" : selectedToken.creatureType === "wa_creature" ? "Aetheria" : "Créature"}
                  </p>
                )}
              </div>
            </div>

            {/* Rotation */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotation</span>
                <span className="text-xs font-medium">{selectedToken.rotation}°</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => rotateToken(selectedToken.id, -15)}>-15°</Button>
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => rotateToken(selectedToken.id, -45)}>-45°</Button>
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => rotateToken(selectedToken.id, 45)}>+45°</Button>
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => rotateToken(selectedToken.id, 15)}>+15°</Button>
              </div>
              <Slider
                value={[selectedToken.rotation]}
                onValueChange={([v]) => setTokens(prev => prev.map(t => t.id === selectedToken.id ? { ...t, rotation: v } : t))}
                min={0} max={359} step={1}
              />
            </div>

            {/* Size */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Maximize2 className="h-3 w-3" /> Taille</span>
                <span className="text-xs font-medium">{selectedToken.sizeUnits}×{selectedToken.sizeUnits}</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(n => (
                  <Button
                    key={n}
                    size="sm"
                    variant={selectedToken.sizeUnits === n ? "default" : "outline"}
                    className="flex-1 h-7 text-xs"
                    onClick={() => resizeToken(selectedToken.id, n)}
                  >
                    {n}×{n}
                  </Button>
                ))}
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
            <div className="grid grid-cols-2 gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => duplicateToken(selectedToken.id)} title="Ctrl+D">
                <Copy className="mr-1 h-3 w-3" /> Dupliquer
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => centerOnToken(selectedToken.id)} title="F">
                <Crosshair className="mr-1 h-3 w-3" /> Centrer
              </Button>
            </div>
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

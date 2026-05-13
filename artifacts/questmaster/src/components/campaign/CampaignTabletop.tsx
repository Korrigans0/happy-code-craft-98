import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Pencil, Eraser, Ruler, Square, Circle, Type, Move,
  Undo2, Redo2, Trash2, Download, Minus, ZoomIn, ZoomOut,
  Layers, Image, Users, PaintBucket, Eye, EyeOff, Upload,
  X, Plus, Magnet, Crosshair, Maximize2, Minimize2,
  RotateCw, Copy, Triangle, Dices, PanelRight, PanelRightClose,
  MapPin, Wand2, Keyboard, Film, ChevronRight,
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import DiceRoller3D from "./DiceRoller3D";
import DiceBroadcastOverlay from "./DiceBroadcastOverlay";
import VTTContextMenu from "./vtt/VTTContextMenu";
import GMPanel from "./vtt/GMPanel";
import {
  Tool, DrawAction, TokenItem, MapLayer, InitiativeEntry, ContextMenuState,
  CONDITIONS, AURA_COLORS, VTTScene,
} from "./vtt/types";
import { supabase } from "@/integrations/supabase/client";

import { useQuery } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { useTabletopSync } from "@/hooks/useTabletopSync";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/hooks/use-toast";

// ── Constants ──────────────────────────────────────────────
const GRID_SIZE = 40;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const M_PER_SQUARE = 1.5;
const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const COLORS = [
  "#ffffff", "#000000", "#ef4444", "#22c55e",
  "#3b82f6", "#f59e0b", "#a855f7", "#f97316",
  "#ec4899", "#06b6d4", "#84cc16", "#6366f1",
];
const TOKEN_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e",
  "#f59e0b", "#a855f7", "#f97316",
  "#ec4899", "#06b6d4",
];

interface CampaignTabletopProps {
  campaignId: string;
  isGM: boolean;
}

// ── Helper: draw a cone ────────────────────────────────────
function renderCone(
  ctx: CanvasRenderingContext2D,
  action: DrawAction,
  zoom: number,
  GRID: number,
  MPQ: number,
) {
  if (action.points.length < 2) return;
  const start = action.points[0];
  const end = action.points[action.points.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 1) return;
  const angle = Math.atan2(dy, dx);
  const spread = 53.13 * (Math.PI / 180);
  ctx.save();
  ctx.fillStyle = action.color + "44";
  ctx.strokeStyle = action.color;
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.arc(start.x, start.y, length, angle - spread / 2, angle + spread / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Distance label
  const squares = Math.round(length / GRID);
  ctx.fillStyle = action.color;
  ctx.font = `bold ${11 / zoom}px sans-serif`;
  ctx.fillText(`${squares * MPQ}m`, end.x + 6 / zoom, end.y);
  ctx.restore();
}

function renderZone(
  ctx: CanvasRenderingContext2D,
  action: DrawAction,
  zoom: number,
  GRID: number,
  MPQ: number,
) {
  if (action.points.length < 2) return;
  const [center, edge] = action.points;
  const dx = edge.x - center.x;
  const dy = edge.y - center.y;
  const radius = Math.sqrt(dx * dx + dy * dy);
  ctx.save();
  ctx.fillStyle = action.color + "33";
  ctx.strokeStyle = action.color;
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([6 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  const squares = Math.round(radius / GRID);
  ctx.fillStyle = action.color;
  ctx.font = `bold ${11 / zoom}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(`r=${squares * MPQ}m`, center.x, center.y - 4 / zoom);
  ctx.textAlign = "start";
  ctx.restore();
}

// ══════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════
const CampaignTabletop = ({ campaignId, isGM }: CampaignTabletopProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const tokenImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const pingAnimRef = useRef<number | null>(null);

  // ── Core tool state ──
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

  // ── Token state ──
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [draggedToken, setDraggedToken] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [tokenDragOffset, setTokenDragOffset] = useState({ x: 0, y: 0 });
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedTokenIds, setSelectedTokenIds] = useState<Set<string>>(new Set());
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [draggingCharId, setDraggingCharId] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  // ── Layer state ──
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: "map", name: "Carte", type: "map", visible: true, locked: false, opacity: 100 },
    { id: "tokens", name: "Jetons", type: "tokens", visible: true, locked: false, opacity: 100 },
    { id: "drawings", name: "Dessins", type: "drawings", visible: true, locked: false, opacity: 100 },
    { id: "fog", name: "Brouillard", type: "fog", visible: false, locked: false, opacity: 80 },
  ]);
  const [activeDrawLayer, setActiveDrawLayer] = useState("drawings");

  // ── UI state ──
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [collisionEnabled, setCollisionEnabled] = useState(true);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [gmPanelOpen, setGmPanelOpen] = useState(isGM);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenColor, setNewTokenColor] = useState(TOKEN_COLORS[0]);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [gridColor, setGridColor] = useState("rgba(255,255,255,0.12)");
  const [gridMajorColor, setGridMajorColor] = useState("rgba(255,255,255,0.28)");
  const [plateauMode, setPlateauMode] = useState<"dark" | "sky">("dark");

  const plateauColors = plateauMode === "dark"
    ? { background: "#0f1520", gridMinor: "hsl(216,20%,25%)", gridMajor: "hsl(42,50%,45%)" }
    : { background: "#8c97a2", gridMinor: "rgba(55,78,100,0.45)", gridMajor: "rgba(35,55,80,0.75)" };

  // ── Scenes ──
  const [scenes, setScenes] = useState<VTTScene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [showScenesPanel, setShowScenesPanel] = useState(false);

  // ── Context menu ──
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // ── Token clipboard (copy / paste) ──
  const tokenClipboardRef = useRef<TokenItem | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);

  // ── Voir fiche dialog ──
  const [sheetToken, setSheetToken] = useState<TokenItem | null>(null);

  // ── Notes MJ dialog ──
  const [gmNotesToken, setGmNotesToken] = useState<TokenItem | null>(null);
  const [gmNotesContent, setGmNotesContent] = useState("");
  const [gmNotesLoading, setGmNotesLoading] = useState(false);
  const [gmNotesSaving, setGmNotesSaving] = useState(false);

  // ── Ping animations ──
  const [pings, setPings] = useState<{ id: string; wx: number; wy: number; t: number }[]>([]);
  const pingsRef = useRef<{ id: string; wx: number; wy: number; t: number }[]>([]);
  pingsRef.current = pings;
  const pingChannelRef = useRef<any>(null);
  const broadcastPing = useCallback((wx: number, wy: number) => {
    const ping = { id: newId(), wx, wy, t: Date.now() };
    setPings(prev => [...prev, ping]);
    pingChannelRef.current?.send?.({ type: "broadcast", event: "ping", payload: { wx, wy } });
  }, []);

  // always-fresh ref so the animation loop never captures a stale redrawCanvas
  const redrawCanvasRef = useRef<() => void>(() => {});

  // ── Token slide animations (smooth movement) ──
  const tokenLastPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const tokenAnimRef = useRef<Map<string, { fromX: number; fromY: number; toX: number; toY: number; start: number; duration: number }>>(new Map());
  const tokenAnimRafRef = useRef<number | null>(null);
  const tickTokenAnim = useCallback(() => {
    if (tokenAnimRef.current.size === 0) {
      tokenAnimRafRef.current = null;
      return;
    }
    redrawCanvasRef.current();
    tokenAnimRafRef.current = requestAnimationFrame(tickTokenAnim);
  }, []);

  // ── Initiative ──
  const [initiative, setInitiative] = useState<InitiativeEntry[]>([]);
  const [initiativeRound, setInitiativeRound] = useState(1);
  const [initiativeActiveIdx, setInitiativeActiveIdx] = useState(-1);

  // ── Auth & permissions ──
  const { user } = useAuth();
  const deletedTokenIdsRef = useRef<Set<string>>(new Set());

  const { data: ownCharacterId } = useQuery({
    queryKey: ["campaign-member-character", campaignId, user?.id],
    enabled: !!user?.id && !!campaignId,
    queryFn: async () => {
      try {
        const members = await campaignsApi.getMembers(campaignId);
        const mine = members.find((m: any) => m.user_id === user?.id);
        return mine?.character_id ?? null;
      } catch { return null; }
    },
  });

  const perms = usePermissions({ isGM, userId: user?.id, ownCharacterId });
  const denied = (msg = "Action réservée au MJ") =>
    toast({ title: "Permission refusée", description: msg, variant: "destructive" });

  // ── Sync ──
  const { saveState } = useTabletopSync({
    campaignId,
    userId: user?.id || "",
    onStateReceived: (state) => {
      const incomingTokens = (state.tokens as TokenItem[]).filter(
        t => !deletedTokenIdsRef.current.has(t.id)
      );
      setTokens(incomingTokens);
      const incomingDrawings = state.drawings as DrawAction[];
      const seen = new Set<string>();
      const dedup: DrawAction[] = [];
      for (const d of incomingDrawings) {
        const id = d.id || newId();
        if (seen.has(id)) continue;
        seen.add(id);
        dedup.push({ ...d, id });
      }
      setActions(dedup);
      const currentMapUrl = layers.find(l => l.id === "map")?.imageUrl;
      if (state.map_image_url && state.map_image_url !== currentMapUrl) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          mapImageRef.current = img;
          setLayers(prev => prev.map(l =>
            l.id === "map" ? { ...l, imageUrl: state.map_image_url! } : l
          ));
        };
        img.src = state.map_image_url;
      } else if (!state.map_image_url && currentMapUrl) {
        mapImageRef.current = null;
        setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: undefined } : l));
      }
      setLayers(prev => prev.map(l =>
        l.id === "fog" ? { ...l, visible: state.fog_visible } : l
      ));
    },
    debounceMs: 250,
  });

  useEffect(() => { if (user?.id) saveState({ tokens }); }, [tokens, saveState, user?.id]);
  useEffect(() => { if (user?.id) saveState({ drawings: actions }); }, [actions, saveState, user?.id]);

  // ── Detect token position changes and start a slide tween ──
  useEffect(() => {
    const now = performance.now();
    const DURATION = 220;
    const seen = new Set<string>();
    for (const t of tokens) {
      seen.add(t.id);
      const prev = tokenLastPosRef.current.get(t.id);
      const isMine = t.id === draggedToken;
      if (prev && !isMine && (prev.x !== t.x || prev.y !== t.y)) {
        // Continue from current displayed position if a tween is already in progress
        const cur = tokenAnimRef.current.get(t.id);
        let startX = prev.x, startY = prev.y;
        if (cur) {
          const p = Math.min(1, (now - cur.start) / cur.duration);
          const e = 1 - Math.pow(1 - p, 3);
          startX = cur.fromX + (cur.toX - cur.fromX) * e;
          startY = cur.fromY + (cur.toY - cur.fromY) * e;
        }
        tokenAnimRef.current.set(t.id, {
          fromX: startX, fromY: startY,
          toX: t.x, toY: t.y,
          start: now, duration: DURATION,
        });
      }
      tokenLastPosRef.current.set(t.id, { x: t.x, y: t.y });
    }
    // Clean up removed tokens
    for (const id of Array.from(tokenLastPosRef.current.keys())) {
      if (!seen.has(id)) {
        tokenLastPosRef.current.delete(id);
        tokenAnimRef.current.delete(id);
      }
    }
    if (tokenAnimRef.current.size > 0 && tokenAnimRafRef.current == null) {
      tokenAnimRafRef.current = requestAnimationFrame(tickTokenAnim);
    }
  }, [tokens, draggedToken, tickTokenAnim]);

  // ── Data fetching ──
  const { data: waCreatures = [] } = useQuery({
    queryKey: ["vtt-wa-creatures"],
    queryFn: async () => {
      try { return await (await import("@/lib/api")).compendiumApi.getWaCreatures(); }
      catch { return []; }
    },
  });

  const { data: userCharacters = [] } = useQuery({
    queryKey: ["vtt-user-characters", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try { return await (await import("@/lib/api")).charactersApi.list(); }
      catch { return []; }
    },
  });

  // ── Preload token images ──
  useEffect(() => {
    for (const token of tokens) {
      if (!token.imageUrl || tokenImagesRef.current.has(token.imageUrl)) continue;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        tokenImagesRef.current.set(token.imageUrl!, img);
        setTokens(prev => [...prev]);
      };
      img.src = token.imageUrl;
    }
  }, [tokens]);

  // ── Ping animation loop ──
  useEffect(() => {
    if (pings.length === 0) return;
    const animate = () => {
      const now = Date.now();
      setPings(prev => prev.filter(p => now - p.t < 3000));
      redrawCanvasRef.current();   // always calls the freshest redrawCanvas
      pingAnimRef.current = requestAnimationFrame(animate);
    };
    pingAnimRef.current = requestAnimationFrame(animate);
    return () => { if (pingAnimRef.current) cancelAnimationFrame(pingAnimRef.current); };
  }, [pings.length]);

  // ── Realtime ping broadcast (multi-vues) ──
  useEffect(() => {
    if (!campaignId) return;
    const channel: any = (supabase as any).channel(`vtt-ping-${campaignId}`, {
      config: { broadcast: { self: false } },
    });
    channel.on?.("broadcast", { event: "ping" }, ({ payload }: { payload: { wx: number; wy: number } }) => {
      if (typeof payload?.wx !== "number" || typeof payload?.wy !== "number") return;
      setPings(prev => [...prev, { id: newId(), wx: payload.wx, wy: payload.wy, t: Date.now() }]);
    });
    channel.subscribe?.();
    pingChannelRef.current = channel;
    return () => {
      pingChannelRef.current = null;
      (supabase as any).removeChannel?.(channel);
    };
  }, [campaignId]);

  // ── Helpers ──
  const snapValue = useCallback(
    (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v,
    [snapToGrid]
  );

  const tokensOverlap = (
    a: { x: number; y: number; size: number },
    b: { x: number; y: number; size: number }
  ) => !(a.x + a.size <= b.x || b.x + b.size <= a.x || a.y + a.size <= b.y || b.y + b.size <= a.y);

  const findFreePosition = useCallback(
    (x: number, y: number, size: number, ignoreId?: string): { x: number; y: number } => {
      if (!collisionEnabled) return { x, y };
      const others = tokens.filter(t => t.id !== ignoreId && t.visible);
      if (!others.some(o => tokensOverlap({ x, y, size }, { x: o.x, y: o.y, size: o.size }))) return { x, y };
      for (let r = 1; r < 12; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = x + dx * GRID_SIZE, ny = y + dy * GRID_SIZE;
            if (!others.some(o => tokensOverlap({ x: nx, y: ny, size }, { x: o.x, y: o.y, size: o.size }))) return { x: nx, y: ny };
          }
        }
      }
      return { x, y };
    },
    [collisionEnabled, tokens]
  );

  // ── Token builders ──
  const buildCharacterToken = (char: any, worldX: number, worldY: number): TokenItem => {
    const tx = snapValue(worldX - GRID_SIZE / 2);
    const ty = snapValue(worldY - GRID_SIZE / 2);
    const free = findFreePosition(tx, ty, GRID_SIZE);
    return {
      id: newId(), name: char.name, x: free.x, y: free.y, size: GRID_SIZE, sizeUnits: 1,
      rotation: 0, color: "#f59e0b", label: char.name.substring(0, 2).toUpperCase(),
      layer: "tokens", visible: true, creatureId: char.id, creatureType: "character",
      hp: char.hp ?? char.max_hp ?? 10, maxHp: char.max_hp ?? 10,
      ac: char.armor_class ?? 10, imageUrl: char.avatar_url || undefined,
      conditions: [],
    };
  };

  const spawnCharacter = (char: any) => {
    setTokens(prev => [...prev, buildCharacterToken(char, (-panOffset.x / zoom) + 200, (-panOffset.y / zoom) + 200)]);
  };

  const spawnCharacterAt = (char: any, clientX: number, clientY: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setTokens(prev => [...prev, buildCharacterToken(char,
      (clientX - rect.left - panOffset.x) / zoom,
      (clientY - rect.top - panOffset.y) / zoom
    )]);
  };

  const spawnWACreature = (creature: any) => {
    if (!perms.canAddToken) { denied("Seul le MJ peut placer une créature"); return; }
    const su = creature.size === "Très grand" ? 3 : creature.size === "Grand" ? 2 : 1;
    const size = GRID_SIZE * su;
    const wx = snapValue((-panOffset.x / zoom) + 200 - size / 2);
    const wy = snapValue((-panOffset.y / zoom) + 200 - size / 2);
    const free = findFreePosition(wx, wy, size);
    setTokens(prev => [...prev, {
      id: newId(), name: creature.name, x: free.x, y: free.y, size, sizeUnits: su,
      rotation: 0, color: "#ef4444", label: creature.name.substring(0, 2).toUpperCase(),
      layer: "tokens", visible: true, creatureId: creature.id, creatureType: "wa_creature",
      hp: (creature.constitution || 0) * 5 + 10, maxHp: (creature.constitution || 0) * 5 + 10,
      ac: 10 + (creature.dexterity || 0), conditions: [],
    }]);
  };

  const addToken = () => {
    if (!newTokenName.trim()) return;
    if (!perms.canAddToken) { denied(); return; }
    const wx = snapValue((-panOffset.x / zoom) + 200);
    const wy = snapValue((-panOffset.y / zoom) + 200);
    const free = findFreePosition(wx, wy, GRID_SIZE);
    setTokens(prev => [...prev, {
      id: newId(), name: newTokenName.trim(), x: free.x, y: free.y, size: GRID_SIZE, sizeUnits: 1,
      rotation: 0, color: newTokenColor, label: newTokenName.substring(0, 2).toUpperCase(),
      layer: "tokens", visible: true, conditions: [],
    }]);
    setNewTokenName("");
  };

  const addTokenAt = (wx: number, wy: number) => {
    if (!perms.canAddToken) { denied(); return; }
    const name = prompt("Nom du jeton :"); if (!name?.trim()) return;
    const sx = snapValue(wx - GRID_SIZE / 2);
    const sy = snapValue(wy - GRID_SIZE / 2);
    const free = findFreePosition(sx, sy, GRID_SIZE);
    setTokens(prev => [...prev, {
      id: newId(), name: name.trim(), x: free.x, y: free.y, size: GRID_SIZE, sizeUnits: 1,
      rotation: 0, color: "#3b82f6", label: name.substring(0, 2).toUpperCase(),
      layer: "tokens", visible: true, conditions: [],
    }]);
  };

  const removeToken = (tokenId: string) => {
    deletedTokenIdsRef.current.add(tokenId);
    setTokens(prev => prev.filter(t => t.id !== tokenId));
    if (selectedTokenId === tokenId) setSelectedTokenId(null);
  };

  const updateTokenHp = (tokenId: string, delta: number) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      return { ...t, hp: Math.max(0, Math.min(t.maxHp || 999, (t.hp || 0) + delta)) };
    }));
  };

  const setTokenHp = (tokenId: string, hp: number) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      return { ...t, hp: Math.max(0, Math.min(t.maxHp || 999, hp)) };
    }));
  };

  const rotateToken = (tokenId: string, deg: number) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, rotation: (t.rotation + deg + 360) % 360 } : t));
  };

  const resizeToken = (tokenId: string, sizeUnits: number) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      return { ...t, sizeUnits, size: GRID_SIZE * sizeUnits };
    }));
  };

  const duplicateToken = (tokenId: string) => {
    const src = tokens.find(t => t.id === tokenId); if (!src) return;
    if (!perms.canAddToken) { denied("Seul le MJ peut dupliquer un jeton"); return; }
    const free = findFreePosition(src.x + GRID_SIZE, src.y, src.size);
    const copy: TokenItem = { ...src, id: newId(), x: free.x, y: free.y };
    setTokens(prev => [...prev, copy]);
    setSelectedTokenId(copy.id);
  };

  // ── Copy / Paste token ──
  const copyToken = (tokenId: string) => {
    const src = tokens.find(t => t.id === tokenId); if (!src) return;
    tokenClipboardRef.current = src;
    setHasClipboard(true);
    toast({ title: "Jeton copié", description: src.name });
  };

  const pasteTokenAt = (wx?: number, wy?: number) => {
    const src = tokenClipboardRef.current;
    if (!src) { toast({ title: "Presse-papiers vide", variant: "destructive" }); return; }
    if (!perms.canAddToken) { denied("Seul le MJ peut coller un jeton"); return; }
    const baseX = wx !== undefined ? wx - src.size / 2 : src.x + GRID_SIZE;
    const baseY = wy !== undefined ? wy - src.size / 2 : src.y;
    const free = findFreePosition(snapValue(baseX), snapValue(baseY), src.size);
    const copy: TokenItem = { ...src, id: newId(), x: free.x, y: free.y };
    setTokens(prev => [...prev, copy]);
    setSelectedTokenId(copy.id);
  };

  // ── Voir fiche ──
  const openTokenSheet = (token: TokenItem) => { setSheetToken(token); };

  // ── Notes MJ (privées, RLS GM-only) ──
  const openGmNotes = async (token: TokenItem) => {
    if (!isGM) { denied("Notes MJ réservées au MJ"); return; }
    setGmNotesToken(token);
    setGmNotesContent("");
    setGmNotesLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("tabletop_token_notes")
        .select("content")
        .eq("campaign_id", campaignId)
        .eq("token_id", token.id)
        .maybeSingle();
      if (error) throw error;
      setGmNotesContent((data as any)?.content ?? "");
    } catch (e: any) {
      toast({ title: "Impossible de charger les notes", description: e.message, variant: "destructive" });
    } finally {
      setGmNotesLoading(false);
    }
  };

  const saveGmNotes = async () => {
    if (!gmNotesToken || !user?.id) return;
    setGmNotesSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("tabletop_token_notes")
        .upsert(
          { campaign_id: campaignId, token_id: gmNotesToken.id, content: gmNotesContent, created_by: user.id },
          { onConflict: "campaign_id,token_id" }
        );
      if (error) throw error;
      toast({ title: "Notes MJ enregistrées" });
      setGmNotesToken(null);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setGmNotesSaving(false);
    }
  };

  const moveTokenBy = (tokenId: string, dx: number, dy: number) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      const free = findFreePosition(t.x + dx, t.y + dy, t.size, t.id);
      return { ...t, x: free.x, y: free.y };
    }));
  };

  const toggleTokenCondition = (tokenId: string, condId: string) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      const conds = t.conditions || [];
      const next = conds.includes(condId) ? conds.filter(c => c !== condId) : [...conds, condId];
      return { ...t, conditions: next };
    }));
  };

  const toggleTokenHidden = (tokenId: string) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, isHidden: !t.isHidden } : t));
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

  // ── Layer helpers ──
  const toggleLayerVisibility = (layerId: string) => {
    if (layerId === "fog" && !perms.canToggleFog) { denied("Le brouillard est contrôlé par le MJ"); return; }
    if (layerId === "map" && !perms.canEditMap) { denied("Le calque carte est contrôlé par le MJ"); return; }
    setLayers(prev => {
      const next = prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l);
      if (layerId === "fog") {
        const fogVisible = next.find(l => l.id === "fog")?.visible ?? false;
        saveState({ fog_visible: fogVisible });
      }
      return next;
    });
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, opacity } : l));
  };

  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!perms.canEditMap) { denied("Seul le MJ peut changer la carte"); return; }
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        mapImageRef.current = img;
        setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: dataUrl } : l));
        saveState({ map_image_url: dataUrl });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Initiative helpers ──
  const addToInitiative = (entry: Omit<InitiativeEntry, "id">) => {
    setInitiative(prev => [...prev, { ...entry, id: newId() }]);
  };

  const removeFromInitiative = (id: string) => {
    setInitiative(prev => prev.filter(e => e.id !== id));
    setInitiativeActiveIdx(prev => Math.max(-1, prev - 1));
  };

  const updateInitiativeHp = (id: string, delta: number) => {
    setInitiative(prev => prev.map(e => {
      if (e.id !== id) return e;
      return { ...e, hp: Math.max(0, Math.min(e.maxHp, e.hp + delta)) };
    }));
  };

  const addConditionToInitiative = (id: string, cond: string) => {
    setInitiative(prev => prev.map(e =>
      e.id !== id ? e : { ...e, conditions: [...new Set([...e.conditions, cond])] }
    ));
  };

  const removeConditionFromInitiative = (id: string, cond: string) => {
    setInitiative(prev => prev.map(e =>
      e.id !== id ? e : { ...e, conditions: e.conditions.filter(c => c !== cond) }
    ));
  };

  const nextTurn = () => {
    const sorted = [...initiative].sort((a, b) => b.initiative - a.initiative);
    if (sorted.length === 0) return;
    const nextIdx = initiativeActiveIdx + 1;
    if (nextIdx >= sorted.length) {
      setInitiativeActiveIdx(0);
      setInitiativeRound(r => r + 1);
    } else {
      setInitiativeActiveIdx(nextIdx);
    }
  };

  const resetInitiative = () => {
    setInitiative([]);
    setInitiativeRound(1);
    setInitiativeActiveIdx(-1);
  };

  const addTokenToInitiative = (token: TokenItem) => {
    const rollResult = Math.floor(Math.random() * 20) + 1;
    addToInitiative({
      name: token.name,
      initiative: rollResult,
      modifier: 0,
      hp: token.hp ?? 10,
      maxHp: token.maxHp ?? 10,
      ac: token.ac,
      conditions: token.conditions || [],
      tokenId: token.id,
      type: token.creatureType === "character" ? "player" : "monster",
      color: token.color,
    });
  };

  // ── Canvas rendering ──────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = plateauColors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    const viewLeft = -panOffset.x / zoom;
    const viewTop = -panOffset.y / zoom;
    const viewRight = viewLeft + canvas.width / zoom;
    const viewBottom = viewTop + canvas.height / zoom;

    // ── Grid ─────────────────────────────────────────────────
    const gridLayer = layers.find(l => l.id === "drawings");
    if (gridLayer?.visible !== false) {
      const startX = Math.floor(viewLeft / GRID_SIZE) * GRID_SIZE;
      const startY = Math.floor(viewTop / GRID_SIZE) * GRID_SIZE;
      ctx.lineWidth = 0.5 / zoom;

      // Minor grid lines
      ctx.strokeStyle = plateauColors.gridMinor;
      ctx.beginPath();
      for (let x = startX; x <= viewRight; x += GRID_SIZE) {
        const isMajor = Math.round(x / GRID_SIZE) % 5 === 0;
        if (!isMajor) { ctx.moveTo(x, viewTop); ctx.lineTo(x, viewBottom); }
      }
      for (let y = startY; y <= viewBottom; y += GRID_SIZE) {
        const isMajor = Math.round(y / GRID_SIZE) % 5 === 0;
        if (!isMajor) { ctx.moveTo(viewLeft, y); ctx.lineTo(viewRight, y); }
      }
      ctx.stroke();

      // Major grid lines
      ctx.strokeStyle = plateauColors.gridMajor;
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      for (let x = startX; x <= viewRight; x += GRID_SIZE) {
        if (Math.round(x / GRID_SIZE) % 5 === 0) { ctx.moveTo(x, viewTop); ctx.lineTo(x, viewBottom); }
      }
      for (let y = startY; y <= viewBottom; y += GRID_SIZE) {
        if (Math.round(y / GRID_SIZE) % 5 === 0) { ctx.moveTo(viewLeft, y); ctx.lineTo(viewRight, y); }
      }
      ctx.stroke();
    }

    // ── Map layer ─────────────────────────────────────────────
    const mapLayer = layers.find(l => l.id === "map");
    if (mapLayer?.visible && mapImageRef.current) {
      ctx.save();
      ctx.globalAlpha = mapLayer.opacity / 100;
      ctx.drawImage(mapImageRef.current, 0, 0);
      ctx.restore();
    }

    // ── Drawings layer (excluding fogReveal) ──────────────────
    const drawingsLayer = layers.find(l => l.id === "drawings");
    if (drawingsLayer?.visible) {
      ctx.save();
      ctx.globalAlpha = drawingsLayer.opacity / 100;

      const visibleActions = actions.filter(a =>
        a.layer === "drawings" && (a.type as string) !== "fogReveal"
      );

      for (const action of visibleActions) {
        ctx.save();
        ctx.strokeStyle = action.color;
        ctx.fillStyle = action.color;
        ctx.lineWidth = action.size / zoom;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        switch (action.type) {
          case "pencil":
            if (action.points.length < 2) break;
            ctx.beginPath();
            ctx.moveTo(action.points[0].x, action.points[0].y);
            for (const p of action.points.slice(1)) ctx.lineTo(p.x, p.y);
            ctx.stroke();
            break;
          case "eraser": {
            const prev = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = action.size * 3 / zoom;
            ctx.beginPath();
            ctx.moveTo(action.points[0].x, action.points[0].y);
            for (const p of action.points.slice(1)) ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.globalCompositeOperation = prev;
            break;
          }
          case "line":
            if (action.points.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(action.points[0].x, action.points[0].y);
              ctx.lineTo(action.points[action.points.length - 1].x, action.points[action.points.length - 1].y);
              ctx.stroke();
              // Distance label
              const p1 = action.points[0], p2 = action.points[action.points.length - 1];
              const dx = p2.x - p1.x, dy = p2.y - p1.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const sq = Math.round(dist / GRID_SIZE);
              if (sq > 0) {
                ctx.font = `${10 / zoom}px sans-serif`;
                ctx.fillText(`${sq * M_PER_SQUARE}m`, (p1.x + p2.x) / 2 + 4, (p1.y + p2.y) / 2 - 4);
              }
            }
            break;
          case "rect":
            if (action.points.length >= 2) {
              const [a, b] = action.points;
              ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
            }
            break;
          case "circle":
            if (action.points.length >= 2) {
              const [a, b] = action.points;
              const r = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
              ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, Math.PI * 2); ctx.stroke();
            }
            break;
          case "text":
            if (action.text && action.points[0]) {
              ctx.font = `${action.size * 3 / zoom}px 'Lora', serif`;
              ctx.fillText(action.text, action.points[0].x, action.points[0].y);
            }
            break;
          case "cone":
            renderCone(ctx, action, zoom, GRID_SIZE, M_PER_SQUARE);
            break;
          case "zone":
            renderZone(ctx, action, zoom, GRID_SIZE, M_PER_SQUARE);
            break;
          default:
            break;
        }
        ctx.restore();
      }

      // Current action preview
      if (currentAction && (currentAction.type as string) !== "fogReveal") {
        ctx.save();
        ctx.strokeStyle = currentAction.color;
        ctx.fillStyle = currentAction.color;
        ctx.lineWidth = currentAction.size / zoom;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        switch (currentAction.type) {
          case "pencil":
            if (currentAction.points.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(currentAction.points[0].x, currentAction.points[0].y);
              for (const p of currentAction.points.slice(1)) ctx.lineTo(p.x, p.y);
              ctx.stroke();
            }
            break;
          case "eraser": {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = currentAction.size * 3 / zoom;
            if (currentAction.points.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(currentAction.points[0].x, currentAction.points[0].y);
              for (const p of currentAction.points.slice(1)) ctx.lineTo(p.x, p.y);
              ctx.stroke();
            }
            break;
          }
          case "line":
            if (currentAction.points.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(currentAction.points[0].x, currentAction.points[0].y);
              ctx.lineTo(currentAction.points[currentAction.points.length - 1].x, currentAction.points[currentAction.points.length - 1].y);
              ctx.stroke();
            }
            break;
          case "measure":
            if (currentAction.points.length >= 2) {
              const mp0 = currentAction.points[0];
              const mp1 = currentAction.points[currentAction.points.length - 1];
              const mDist = Math.sqrt((mp1.x - mp0.x) ** 2 + (mp1.y - mp0.y) ** 2);
              const mSquares = mDist / GRID_SIZE;
              const mMeters = (mSquares * M_PER_SQUARE).toFixed(1);
              ctx.save();
              ctx.strokeStyle = "#f59e0b";
              ctx.lineWidth = 2 / zoom;
              ctx.setLineDash([6 / zoom, 4 / zoom]);
              ctx.beginPath();
              ctx.moveTo(mp0.x, mp0.y);
              ctx.lineTo(mp1.x, mp1.y);
              ctx.stroke();
              ctx.setLineDash([]);
              // Start dot
              ctx.fillStyle = "#f59e0b";
              ctx.beginPath();
              ctx.arc(mp0.x, mp0.y, 4 / zoom, 0, Math.PI * 2);
              ctx.fill();
              // End dot
              ctx.beginPath();
              ctx.arc(mp1.x, mp1.y, 4 / zoom, 0, Math.PI * 2);
              ctx.fill();
              // Label
              const midX = (mp0.x + mp1.x) / 2;
              const midY = (mp0.y + mp1.y) / 2;
              const label = `${mMeters}m (${mSquares.toFixed(1)} cases)`;
              ctx.font = `bold ${13 / zoom}px 'Lora', serif`;
              const tw = ctx.measureText(label).width;
              ctx.fillStyle = "rgba(0,0,0,0.7)";
              ctx.fillRect(midX - tw / 2 - 4 / zoom, midY - 14 / zoom, tw + 8 / zoom, 18 / zoom);
              ctx.fillStyle = "#fbbf24";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(label, midX, midY - 5 / zoom);
              ctx.textAlign = "start";
              ctx.textBaseline = "alphabetic";
              ctx.restore();
            }
            break;
          case "rect":
            if (currentAction.points.length >= 2) {
              const [a, b] = currentAction.points;
              ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
            }
            break;
          case "circle":
            if (currentAction.points.length >= 2) {
              const [a, b] = currentAction.points;
              const r = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
              ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, Math.PI * 2); ctx.stroke();
            }
            break;
          case "cone":
            renderCone(ctx, currentAction, zoom, GRID_SIZE, M_PER_SQUARE);
            break;
          case "zone":
            renderZone(ctx, currentAction, zoom, GRID_SIZE, M_PER_SQUARE);
            break;
          default:
            break;
        }
        ctx.restore();
      }

      ctx.restore();
    }

    // ── Tokens layer ──────────────────────────────────────────
    const tokensLayer = layers.find(l => l.id === "tokens");
    if (tokensLayer?.visible) {
      ctx.save();
      ctx.globalAlpha = tokensLayer.opacity / 100;

      for (const __t of tokens) {
        // Apply slide animation to displayed position (does not mutate state)
        let __dx = __t.x, __dy = __t.y;
        const __anim = tokenAnimRef.current.get(__t.id);
        if (__anim) {
          const __p = (performance.now() - __anim.start) / __anim.duration;
          if (__p >= 1) {
            tokenAnimRef.current.delete(__t.id);
          } else {
            const __e = 1 - Math.pow(1 - __p, 3); // easeOutCubic
            __dx = __anim.fromX + (__anim.toX - __anim.fromX) * __e;
            __dy = __anim.fromY + (__anim.toY - __anim.fromY) * __e;
          }
        }
        const token = (__dx === __t.x && __dy === __t.y) ? __t : { ...__t, x: __dx, y: __dy };
        if (!token.visible) continue;
        if (token.isHidden && !isGM) continue;

        const isDragged = token.id === draggedToken;
        const isSelected = token.id === selectedTokenId || selectedTokenIds.has(token.id);
        const cx = token.x + token.size / 2;
        const cy = token.y + token.size / 2;
        const halfSize = token.size / 2;

        // Dim hidden tokens for GM
        if (token.isHidden && isGM) ctx.globalAlpha = 0.45;

        // Aura
        if (token.auraSize && token.auraSize > 0 && token.auraColor) {
          const auraRadius = (token.auraSize * GRID_SIZE + halfSize) * 0.9;
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = token.auraColor;
          ctx.beginPath();
          ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = token.auraColor;
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
          ctx.restore();
        }

        // Type ring (PJ / PNJ / Monstre / Boss)
        {
          const ringColor = token.isBoss
            ? "#fbbf24"
            : token.creatureType === "character"
              ? "#22c55e"
              : token.creatureType === "wa_creature" || token.creatureType === "monster"
                ? "#ef4444"
                : "#94a3b8";
          ctx.save();
          if (token.isBoss) {
            ctx.shadowColor = ringColor;
            ctx.shadowBlur = 12 / zoom;
          }
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = (token.isBoss ? 3.5 : 2.5) / zoom;
          ctx.beginPath();
          ctx.arc(cx, cy, halfSize + 1.5 / zoom, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Selection ring
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = "hsl(42, 65%, 58%)";
          ctx.lineWidth = 3 / zoom;
          ctx.setLineDash([6 / zoom, 4 / zoom]);
          ctx.beginPath();
          ctx.arc(cx, cy, halfSize + 4 / zoom, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((token.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);

        const tokenImg = token.imageUrl ? tokenImagesRef.current.get(token.imageUrl) : null;
        if (tokenImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, halfSize, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(tokenImg, token.x, token.y, token.size, token.size);
          ctx.restore();
        } else {
          const gradient = ctx.createRadialGradient(cx - halfSize * 0.3, cy - halfSize * 0.3, halfSize * 0.1, cx, cy, halfSize);
          gradient.addColorStop(0, token.color + "ff");
          gradient.addColorStop(1, token.color + "99");
          ctx.beginPath();
          ctx.arc(cx, cy, halfSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();

          // Token label
          const fontSize = Math.max(8, halfSize * 0.55);
          ctx.fillStyle = "#fff";
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(token.label || token.name.substring(0, 2).toUpperCase(), cx, cy);
          ctx.textAlign = "start";
          ctx.textBaseline = "alphabetic";
        }

        // Name label
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(token.x, token.y - 18 / zoom, token.size, 14 / zoom);
        ctx.fillStyle = "#fff";
        ctx.font = `${10 / zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(token.name, cx, token.y - 7 / zoom);
        ctx.textAlign = "start";

        ctx.restore();

        // HP bar
        if (token.hp !== undefined && token.maxHp !== undefined && token.maxHp > 0) {
          const barWidth = token.size - 4;
          const barHeight = 4;
          const barX = token.x + 2;
          const barY = token.y + token.size + 4;
          const hpRatio = Math.max(0, token.hp / token.maxHp);
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(barX, barY, barWidth, barHeight);
          ctx.fillStyle = hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#f59e0b" : "#ef4444";
          ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = `bold ${8 / zoom}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(`${token.hp}/${token.maxHp}`, cx, barY + barHeight + 10 / zoom);
          ctx.textAlign = "start";
        }

        // PE / Mana bar (blue, below HP bar)
        if (token.pe !== undefined && token.maxPe !== undefined && token.maxPe > 0) {
          const barWidth = token.size - 4;
          const barHeight = 3;
          const barX = token.x + 2;
          const hpOffset = (token.hp !== undefined && token.maxHp !== undefined && token.maxHp > 0) ? 9 : 0;
          const barY = token.y + token.size + 4 + hpOffset;
          const peRatio = Math.max(0, token.pe / token.maxPe);
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(barX, barY, barWidth, barHeight);
          ctx.fillStyle = peRatio > 0.5 ? "#3b82f6" : peRatio > 0.25 ? "#818cf8" : "#6366f1";
          ctx.fillRect(barX, barY, barWidth * peRatio, barHeight);
          ctx.fillStyle = "rgba(180,200,255,0.9)";
          ctx.font = `bold ${7 / zoom}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(`PE ${token.pe}/${token.maxPe}`, cx, barY + barHeight + 8 / zoom);
          ctx.textAlign = "start";
        }

        // Conditions badges
        if (token.conditions && token.conditions.length > 0) {
          const baseY = token.y + token.size + (token.hp !== undefined ? 22 : 8);
          const badgeCount = Math.min(token.conditions.length, 6);
          const totalW = badgeCount * 16 / zoom;
          let bx = cx - totalW / 2;
          ctx.font = `${12 / zoom}px serif`;
          ctx.textAlign = "left";
          for (let i = 0; i < badgeCount; i++) {
            const cond = CONDITIONS.find(c => c.id === token.conditions![i]);
            if (cond) {
              ctx.fillText(cond.emoji, bx, baseY / zoom);
              bx += 16 / zoom;
            }
          }
        }

        // Hidden indicator
        if (token.isHidden && isGM) {
          ctx.font = `${12 / zoom}px serif`;
          ctx.textAlign = "center";
          ctx.fillText("👁️‍🗨️", cx, token.y - 22 / zoom);
          ctx.textAlign = "start";
          ctx.globalAlpha = tokensLayer.opacity / 100;
        }

        // Movement trail
        if (isDragged && dragStart) {
          const sx = dragStart.x + halfSize, sy = dragStart.y + halfSize;
          const dist = Math.sqrt((cx - sx) ** 2 + (cy - sy) ** 2);
          const squares = Math.round(dist / GRID_SIZE);
          ctx.save();
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2 / zoom;
          ctx.setLineDash([5 / zoom, 4 / zoom]);
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx, cy); ctx.stroke();
          ctx.setLineDash([]);
          if (squares > 0) {
            ctx.fillStyle = "#f59e0b";
            ctx.font = `bold ${12 / zoom}px 'Lora', serif`;
            ctx.fillText(`${squares * M_PER_SQUARE}m (${squares})`, cx + 12 / zoom, cy - 8 / zoom);
          }
          ctx.restore();
        }
      }

      ctx.restore();
    }

    // ── Pings ─────────────────────────────────────────────────
    const now = Date.now();
    for (const ping of pingsRef.current) {
      const elapsed = now - ping.t;
      if (elapsed > 3000) continue;
      const progress = elapsed / 3000;
      const maxRadius = GRID_SIZE * 2.5;
      const r1 = maxRadius * progress;
      const r2 = maxRadius * Math.max(0, progress - 0.3);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 220, 50, ${1 - progress})`;
      ctx.lineWidth = 2.5 / zoom;
      if (r1 > 0) { ctx.beginPath(); ctx.arc(ping.wx, ping.wy, r1, 0, Math.PI * 2); ctx.stroke(); }
      if (r2 > 0) { ctx.beginPath(); ctx.arc(ping.wx, ping.wy, r2, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = `rgba(255, 220, 50, ${0.9 - progress})`;
      ctx.beginPath(); ctx.arc(ping.wx, ping.wy, 5 / zoom, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // ── Marquee selection rectangle ───────────────────────────
    if (marquee) {
      const x = Math.min(marquee.x0, marquee.x1);
      const y = Math.min(marquee.y0, marquee.y1);
      const w = Math.abs(marquee.x1 - marquee.x0);
      const h = Math.abs(marquee.y1 - marquee.y0);
      ctx.save();
      ctx.fillStyle = "hsla(42, 65%, 58%, 0.10)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "hsla(42, 65%, 58%, 0.85)";
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.restore(); // ← end world transform

    // ── Fog (screen space composite) ─────────────────────────
    const fogLayer = layers.find(l => l.id === "fog");
    if (fogLayer?.visible) {
      const tmp = document.createElement("canvas");
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const tCtx = tmp.getContext("2d")!;

      tCtx.fillStyle = `rgba(0, 0, 0, ${fogLayer.opacity / 100})`;
      tCtx.fillRect(0, 0, tmp.width, tmp.height);

      // Cut reveal holes
      tCtx.save();
      tCtx.globalCompositeOperation = "destination-out";
      tCtx.translate(panOffset.x, panOffset.y);
      tCtx.scale(zoom, zoom);
      tCtx.fillStyle = "black";

      const revealActions = actions.filter(a => (a.type as string) === "fogReveal");
      for (const ra of revealActions) {
        for (const pt of ra.points) {
          tCtx.beginPath();
          tCtx.arc(pt.x, pt.y, ra.size * 2.5, 0, Math.PI * 2);
          tCtx.fill();
        }
      }
      if (currentAction && (currentAction.type as string) === "fogReveal") {
        for (const pt of currentAction.points) {
          tCtx.beginPath();
          tCtx.arc(pt.x, pt.y, currentAction.size * 2.5, 0, Math.PI * 2);
          tCtx.fill();
        }
      }
      tCtx.restore();

      ctx.drawImage(tmp, 0, 0);
    }

  }, [actions, currentAction, panOffset, zoom, tokens, layers, selectedTokenId, selectedTokenIds, marquee, draggedToken, dragStart, isGM, gridColor, gridMajorColor, plateauMode]);

  // keep the ref always pointing at the latest redrawCanvas (no stale closure in animation loops)
  redrawCanvasRef.current = redrawCanvas;

  // ── Resize observer ──
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
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [redrawCanvas]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  // ── Wheel zoom ──
  useEffect(() => {
    const container = containerRef.current; if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.shiftKey && selectedTokenId) { rotateToken(selectedTokenId, e.deltaY > 0 ? 15 : -15); return; }
      const canvas = canvasRef.current; if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
        if (next === prev) return prev;
        const wx = (mx - panOffset.x) / prev, wy = (my - panOffset.y) / prev;
        setPanOffset({ x: mx - wx * next, y: my - wy * next });
        return next;
      });
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [selectedTokenId, panOffset]);

  // ── Touch support ──
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let mode: "none" | "pan" | "pinch" | "token" | "draw" = "none";
    let lastTouch = { x: 0, y: 0 }, lastDist = 0, lastCenter = { x: 0, y: 0 };
    let activeTokenId: string | null = null, tokenOffset = { x: 0, y: 0 };

    const dist = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const center = (a: Touch, b: Touch) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (clientX - rect.left - panOffset.x) / zoom, y: (clientY - rect.top - panOffset.y) / zoom };
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
            if (!perms.canMoveToken(hit)) { setSelectedTokenId(perms.canSelectToken(hit) ? hit.id : null); mode = "pan"; return; }
            activeTokenId = hit.id;
            tokenOffset = { x: w.x - hit.x, y: w.y - hit.y };
            setSelectedTokenId(hit.id); setDraggedToken(hit.id); setDragStart({ x: hit.x, y: hit.y });
            mode = "token"; return;
          }
          setSelectedTokenId(null);
        }
        if (["line", "rect", "circle", "pencil", "eraser", "cone", "zone"].includes(tool)) {
          const w = toWorld(t.clientX, t.clientY);
          const layer = (tool as string) === "fogReveal" ? "fog" : activeDrawLayer;
          setCurrentAction({ id: newId(), type: tool, points: [w], color, size: brushSize, layer });
          setIsDrawing(true); mode = "draw"; return;
        }
        mode = "pan";
      } else if (e.touches.length === 2) {
        if (mode === "draw") { setCurrentAction(null); setIsDrawing(false); }
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
        const rawX = w.x - tokenOffset.x, rawY = w.y - tokenOffset.y;
        const sx = snapValue(rawX), sy = snapValue(rawY);
        setTokens(prev => prev.map(tok => {
          if (tok.id !== activeTokenId) return tok;
          if (collisionEnabled && prev.some(o => o.id !== activeTokenId && o.visible && tokensOverlap({ x: sx, y: sy, size: tok.size }, { x: o.x, y: o.y, size: o.size }))) return tok;
          return { ...tok, x: sx, y: sy };
        }));
        return;
      }
      if (mode === "draw" && e.touches.length === 1) {
        const t = e.touches[0];
        const w = toWorld(t.clientX, t.clientY);
        setCurrentAction(prev => {
          if (!prev) return prev;
          if (["pencil", "eraser", "fogReveal"].includes(tool)) return { ...prev, points: [...prev.points, w] };
          return { ...prev, points: [prev.points[0], w] };
        });
        return;
      }
      if (mode === "pan" && e.touches.length === 1) {
        const t = e.touches[0];
        setPanOffset(p => ({ x: p.x + t.clientX - lastTouch.x, y: p.y + t.clientY - lastTouch.y }));
        lastTouch = { x: t.clientX, y: t.clientY };
        return;
      }
      if (mode === "pinch" && e.touches.length === 2) {
        const newDist = dist(e.touches[0], e.touches[1]);
        const newCenter = center(e.touches[0], e.touches[1]);
        const rect = canvas.getBoundingClientRect();
        const cx = newCenter.x - rect.left, cy = newCenter.y - rect.top;
        const factor = newDist / (lastDist || newDist);
        setZoom(prev => {
          const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));
          if (next === prev) { setPanOffset(p => ({ x: p.x + newCenter.x - lastCenter.x, y: p.y + newCenter.y - lastCenter.y })); return prev; }
          const wx = (cx - panOffset.x) / prev, wy = (cy - panOffset.y) / prev;
          setPanOffset({ x: cx - wx * next + newCenter.x - lastCenter.x, y: cy - wy * next + newCenter.y - lastCenter.y });
          return next;
        });
        lastDist = newDist; lastCenter = newCenter;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        if (mode === "draw") {
          setCurrentAction(prev => {
            if (prev) { setActions(a => a.some(x => x.id === prev.id) ? a : [...a, prev]); setUndoneActions([]); }
            return null;
          });
          setIsDrawing(false);
        }
        if (mode === "token") setDragStart(null);
        mode = "none"; activeTokenId = null; setDraggedToken(null);
      } else if (e.touches.length === 1 && mode === "pinch") {
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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
  }, [panOffset, zoom, tool, layers, collisionEnabled, color, brushSize, activeDrawLayer, snapToGrid]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const editable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      return ["INPUT", "TEXTAREA"].includes(el.tagName) || el.isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      if (editable(e.target)) return;
      if (e.code === "Space") { e.preventDefault(); setIsSpacePressed(true); return; }
      if (e.key === "F" && !e.ctrlKey) { setFullscreen(f => !f); return; }
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === "v" || e.key === "V") setTool("move");
        else if (e.key === "p" || e.key === "P") setTool("pencil");
        else if (e.key === "e" || e.key === "E") setTool("eraser");
        else if (e.key === "l" || e.key === "L") setTool("line");
        else if (e.key === "m" || e.key === "M") setTool("measure");
        else if (e.key === "t" || e.key === "T") setTool("text");
        else if (e.key === "c" || e.key === "C") setTool("cone");
        else if (e.key === "z" || e.key === "Z") setTool("zone");
        else if (e.key === "g" || e.key === "G") setSnapToGrid(s => !s);
        else if (e.key === "Escape") { setContextMenu(null); if (fullscreen) setFullscreen(false); }
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
        else if ((e.ctrlKey || e.metaKey) && e.key === "c") { e.preventDefault(); copyToken(selectedTokenId); }
        else if (e.key === "f") centerOnToken(selectedTokenId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && hasClipboard && perms.canAddToken) {
        e.preventDefault(); pasteTokenAt(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === "Space") setIsSpacePressed(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp); };
  }, [selectedTokenId, tokens, collisionEnabled, fullscreen, hasClipboard, perms.canAddToken]);

  // ── findTokenAt ──
  const findTokenAt = (x: number, y: number): TokenItem | null => {
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      if (!t.visible) continue;
      if (t.isHidden && !isGM) continue;
      const half = t.size / 2;
      const dx = x - (t.x + half), dy = y - (t.y + half);
      if (dx * dx + dy * dy <= half * half) return t;
    }
    return null;
  };

  // ── getCanvasCoords ──
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    };
  }, [panOffset, zoom]);

  // ── Context menu handler ──
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const tokenHit = findTokenAt(coords.x, coords.y);
    setContextMenu({
      screenX: e.clientX,
      screenY: e.clientY,
      worldX: coords.x,
      worldY: coords.y,
      type: tokenHit ? "token" : "canvas",
      tokenId: tokenHit?.id,
    });
  };

  // ── Mouse events ──
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return; // handled by onContextMenu
    const coords = getCanvasCoords(e);

    if (e.button === 1 || isSpacePressed) {
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      setIsDrawing(true);
      return;
    }

    // Ping tool
    if (tool === "ping") {
      broadcastPing(coords.x, coords.y);
      return;
    }

    const tokensLayer = layers.find(l => l.id === "tokens");
    if (tokensLayer?.visible && !tokensLayer.locked && (tool === "move" || tool === "token")) {
      const tokenHit = findTokenAt(coords.x, coords.y);
      if (tokenHit) {
        if (!perms.canMoveToken(tokenHit)) {
          const canSel = perms.canSelectToken(tokenHit);
          setSelectedTokenId(canSel ? tokenHit.id : null);
          setSelectedTokenIds(canSel ? new Set([tokenHit.id]) : new Set());
          setLastPanPoint({ x: e.clientX, y: e.clientY });
          setIsDrawing(true);
          return;
        }
        // Shift+click → toggle in multi-selection (no drag)
        if (e.shiftKey) {
          setSelectedTokenIds(prev => {
            const next = new Set(prev);
            if (next.has(tokenHit.id)) next.delete(tokenHit.id);
            else next.add(tokenHit.id);
            return next;
          });
          setSelectedTokenId(tokenHit.id);
          return;
        }
        setDraggedToken(tokenHit.id);
        setSelectedTokenId(tokenHit.id);
        setSelectedTokenIds(new Set([tokenHit.id]));
        setDragStart({ x: tokenHit.x, y: tokenHit.y });
        setTokenDragOffset({ x: coords.x - tokenHit.x, y: coords.y - tokenHit.y });
        setIsDrawing(true);
        return;
      } else if (e.shiftKey && tool === "move") {
        // Shift+drag on empty → marquee selection
        setMarquee({ x0: coords.x, y0: coords.y, x1: coords.x, y1: coords.y });
        setIsDrawing(true);
        return;
      } else {
        setSelectedTokenId(null);
        setSelectedTokenIds(new Set());
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
        const action: DrawAction = { id: newId(), type: "text", points: [coords], color, size: brushSize, text, layer: activeDrawLayer };
        setActions(prev => prev.some(a => a.id === action.id) ? prev : [...prev, action]);
        setUndoneActions([]);
      }
      return;
    }

    const layer = (tool as string) === "fogReveal" ? "fog" : activeDrawLayer;
    setIsDrawing(true);
    setCurrentAction({ id: newId(), type: tool, points: [coords], color, size: brushSize, layer });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (draggedToken) {
      const coords = getCanvasCoords(e);
      const draggedT = tokens.find(t => t.id === draggedToken);
      if (!draggedT) return;
      // Free follow during drag (no snap) — snapping happens on release with a slide animation
      const nextX = coords.x - tokenDragOffset.x;
      const nextY = coords.y - tokenDragOffset.y;
      setTokens(prev => prev.map(t => t.id === draggedToken ? { ...t, x: nextX, y: nextY } : t));
      return;
    }
    if (marquee) {
      const coords = getCanvasCoords(e);
      setMarquee(prev => prev ? { ...prev, x1: coords.x, y1: coords.y } : null);
      return;
    }
    if ((tool === "move" || isSpacePressed) && lastPanPoint) {
      setPanOffset(prev => ({ x: prev.x + e.clientX - lastPanPoint.x, y: prev.y + e.clientY - lastPanPoint.y }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    const coords = getCanvasCoords(e);
    if (currentAction) {
      if (["pencil", "eraser", "fogReveal"].includes(tool)) {
        setCurrentAction(prev => prev ? { ...prev, points: [...prev.points, coords] } : null);
      } else {
        setCurrentAction(prev => prev ? { ...prev, points: [prev.points[0], coords] } : null);
      }
    }
  };

  const handleMouseUp = () => {
    if (draggedToken) {
      const id = draggedToken;
      // Snap to grid (and resolve collision) on release; the position-change effect tweens to it.
      setDraggedToken(null);
      setDragStart(null);
      setIsDrawing(false);
      setTokens(prev => {
        const t = prev.find(x => x.id === id);
        if (!t) return prev;
        const sx = snapValue(t.x), sy = snapValue(t.y);
        let nx = sx, ny = sy;
        if (collisionEnabled) {
          const overlaps = prev.some(o =>
            o.id !== id && o.visible &&
            tokensOverlap({ x: sx, y: sy, size: t.size }, { x: o.x, y: o.y, size: o.size })
          );
          if (overlaps) {
            const last = tokenLastPosRef.current.get(id);
            nx = last?.x ?? t.x; ny = last?.y ?? t.y;
          }
        }
        return prev.map(x => x.id === id ? { ...x, x: nx, y: ny } : x);
      });
      return;
    }
    if (marquee) {
      const minX = Math.min(marquee.x0, marquee.x1);
      const maxX = Math.max(marquee.x0, marquee.x1);
      const minY = Math.min(marquee.y0, marquee.y1);
      const maxY = Math.max(marquee.y0, marquee.y1);
      const hits = tokens.filter(t => {
        if (!t.visible || (t.isHidden && !isGM)) return false;
        if (!perms.canSelectToken(t)) return false;
        const cx = t.x + t.size / 2, cy = t.y + t.size / 2;
        return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
      });
      if (hits.length > 0) {
        const ids = new Set(hits.map(h => h.id));
        setSelectedTokenIds(ids);
        setSelectedTokenId(hits[hits.length - 1].id);
      }
      setMarquee(null);
      setIsDrawing(false);
      return;
    }
    if (tool === "move" || isSpacePressed) { setIsDrawing(false); setLastPanPoint(null); return; }
    if (currentAction) {
      // "measure" is ephemeral — don't persist to actions list
      if (currentAction.type !== "measure") {
        setActions(prev => prev.some(a => a.id === currentAction.id) ? prev : [...prev, currentAction]);
        setUndoneActions([]);
      }
      setCurrentAction(null);
    }
    setIsDrawing(false);
  };

  // ── Undo / redo / clear ──
  const undo = () => {
    setActions(prev => {
      if (!prev.length) return prev;
      setUndoneActions(u => [...u, prev[prev.length - 1]]);
      return prev.slice(0, -1);
    });
  };
  const redo = () => {
    setUndoneActions(prev => {
      if (!prev.length) return prev;
      setActions(a => [...a, prev[prev.length - 1]]);
      return prev.slice(0, -1);
    });
  };
  const clearAll = () => {
    if (!perms.canClearBoard) { denied("Seul le MJ peut effacer le plateau"); return; }
    if (!confirm("Effacer tout le plateau ?")) return;
    tokens.forEach(t => deletedTokenIdsRef.current.add(t.id));
    setActions([]); setUndoneActions([]); setTokens([]); setPanOffset({ x: 0, y: 0 }); setZoom(1);
    mapImageRef.current = null;
    setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: undefined } : l));
    saveState({ tokens: [], drawings: [], map_image_url: null }, { immediate: true });
  };

  // ── Scene management ──────────────────────────────────────
  const saveCurrentScene = (): VTTScene => ({
    id: activeSceneId || newId(),
    name: scenes.find(s => s.id === activeSceneId)?.name || "Scène sans nom",
    mapImageUrl: layers.find(l => l.id === "map")?.imageUrl,
    tokens: [...tokens],
    drawings: [...actions],
    createdAt: Date.now(),
  });

  const loadScene = (scene: VTTScene) => {
    setActiveSceneId(scene.id);
    setTokens(scene.tokens);
    setActions(scene.drawings);
    setUndoneActions([]);
    mapImageRef.current = null;
    setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: scene.mapImageUrl } : l));
    if (scene.mapImageUrl) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { mapImageRef.current = img; };
      img.src = scene.mapImageUrl;
    }
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
    setSelectedTokenId(null);
    toast({ title: `Scène chargée : ${scene.name}` });
  };

  const createScene = () => {
    if (!isGM) { denied(); return; }
    const name = prompt("Nom de la nouvelle scène :", `Scène ${scenes.length + 1}`);
    if (!name?.trim()) return;
    // Save current state first if we have a scene
    const updatedScenes = activeSceneId
      ? scenes.map(s => s.id === activeSceneId ? { ...saveCurrentScene(), id: activeSceneId } : s)
      : [...scenes];
    const newScene: VTTScene = {
      id: newId(), name: name.trim(),
      tokens: [], drawings: [], createdAt: Date.now(),
    };
    setScenes([...updatedScenes, newScene]);
    loadScene(newScene);
  };

  const switchScene = (scene: VTTScene) => {
    if (!isGM) { denied(); return; }
    // Save current scene state
    if (activeSceneId) {
      setScenes(prev => prev.map(s =>
        s.id === activeSceneId ? { ...s, tokens, drawings: actions, mapImageUrl: layers.find(l => l.id === "map")?.imageUrl } : s
      ));
    }
    loadScene(scene);
    setShowScenesPanel(false);
  };

  const renameScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    const name = prompt("Nouveau nom :", scene.name);
    if (!name?.trim()) return;
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, name: name.trim() } : s));
  };

  const deleteScene = (sceneId: string) => {
    if (scenes.length <= 1) { toast({ title: "Impossible", description: "Il faut au moins une scène", variant: "destructive" }); return; }
    if (!confirm("Supprimer cette scène ?")) return;
    const remaining = scenes.filter(s => s.id !== sceneId);
    setScenes(remaining);
    if (activeSceneId === sceneId) loadScene(remaining[0]);
  };
  const exportCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const link = document.createElement("a");
    link.download = "aetheria-tabletop.png"; link.href = canvas.toDataURL(); link.click();
  };
  const zoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.15));
  const zoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.15));
  const resetView = () => { setZoom(1); setPanOffset({ x: 0, y: 0 }); };

  const getCursor = () => {
    if (draggedToken) return "grabbing";
    if (isSpacePressed) return "grab";
    if (tool === "move") return "grab";
    if (tool === "token") return "pointer";
    if (tool === "ping") return "cell";
    if (tool === "fogReveal") return "cell";
    return "crosshair";
  };

  const selectedToken = tokens.find(t => t.id === selectedTokenId);

  // ── Tool definitions ──
  const TOOLS: { id: Tool; icon: React.ReactNode; label: string; key?: string; gmOnly?: boolean }[] = [
    { id: "move",      icon: <Move className="h-4 w-4" />,          label: "Déplacer",     key: "V" },
    { id: "pencil",    icon: <Pencil className="h-4 w-4" />,        label: "Crayon",       key: "P" },
    { id: "eraser",    icon: <Eraser className="h-4 w-4" />,        label: "Gomme",        key: "E" },
    { id: "line",      icon: <Ruler className="h-4 w-4" />,         label: "Ligne",        key: "L" },
    { id: "measure",   icon: <span className="text-xs font-bold leading-none">m</span>, label: "Mesure distance", key: "M" },
    { id: "rect",      icon: <Square className="h-4 w-4" />,        label: "Rectangle" },
    { id: "circle",    icon: <Circle className="h-4 w-4" />,        label: "Cercle" },
    { id: "cone",      icon: <Triangle className="h-4 w-4" />,      label: "Cône AoE",    key: "C" },
    { id: "zone",      icon: <Wand2 className="h-4 w-4" />,         label: "Zone AoE",    key: "Z" },
    { id: "text",      icon: <Type className="h-4 w-4" />,          label: "Texte",        key: "T" },
    { id: "ping",      icon: <MapPin className="h-4 w-4" />,        label: "Ping" },
    { id: "fogReveal", icon: <Eye className="h-4 w-4" />,           label: "Révéler brouillard", gmOnly: true },
  ];

  const visibleTools = TOOLS.filter(t => !t.gmOnly || isGM);

  // ── Context menu actions ──
  const ctxToken = contextMenu?.type === "token"
    ? tokens.find(t => t.id === contextMenu.tokenId)
    : undefined;

  // ── Layout: fullscreen vs embedded ──
  const containerClass = fullscreen
    ? "fixed inset-0 z-[100] flex flex-col bg-background"
    : "flex h-[calc(100vh-200px)] min-h-[500px] flex-col";

  return (
    <div className={containerClass}>

      {/* ── TOP TOOLBAR ────────────────────────────────────── */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border bg-card/95 px-2 py-1 backdrop-blur-sm">

        {/* Zoom */}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} title="Dézoomer">
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <button onClick={resetView}
          className="min-w-[40px] rounded px-1 text-xs font-medium text-muted-foreground hover:bg-muted"
          title="Réinitialiser la vue">
          {Math.round(zoom * 100)}%
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} title="Zoomer">
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Snap + Collision */}
        <Button variant={snapToGrid ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => setSnapToGrid(s => !s)} title={`Magnétisme (G) ${snapToGrid ? "ON" : "OFF"}`}>
          <Magnet className="h-3.5 w-3.5" />
        </Button>
        <Button variant={collisionEnabled ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => setCollisionEnabled(c => !c)} title={`Collision ${collisionEnabled ? "ON" : "OFF"}`}>
          <Crosshair className="h-3.5 w-3.5" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Plateau mode toggle */}
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => setPlateauMode(m => m === "dark" ? "sky" : "dark")}
          title={plateauMode === "dark" ? "Passer en mode ciel" : "Passer en mode sombre"}>
          <span className="text-sm">{plateauMode === "dark" ? "☀️" : "🌙"}</span>
        </Button>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Undo/Redo/Clear/Export */}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={actions.length === 0} title="Annuler (Ctrl+Z)">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={undoneActions.length === 0} title="Rétablir">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        {isGM && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={clearAll} title="Tout effacer">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex" onClick={exportCanvas} title="Exporter PNG">
          <Download className="h-3.5 w-3.5" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Dés */}
        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => setDiceOpen(true)}>
          <Dices className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dés</span>
        </Button>

        {/* Scènes */}
        {isGM && (
          <Popover open={showScenesPanel} onOpenChange={setShowScenesPanel}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                <Film className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {scenes.length > 0 ? (scenes.find(s => s.id === activeSceneId)?.name || "Scènes") : "Scènes"}
                </span>
                {scenes.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-primary/30 px-1 text-[9px] font-bold">{scenes.length}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" side="bottom" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Scènes</h3>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={createScene}>
                    <Plus className="h-3.5 w-3.5" />
                    Nouvelle
                  </Button>
                </div>
                {scenes.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <Film className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Aucune scène sauvegardée.</p>
                    <p className="text-xs mt-1">Créez une scène pour sauvegarder l'état actuel du plateau.</p>
                    <Button size="sm" variant="gold" className="mt-3 gap-1" onClick={createScene}>
                      <Plus className="h-3.5 w-3.5" />
                      Créer ma première scène
                    </Button>
                  </div>
                )}
                {scenes.map(scene => (
                  <div
                    key={scene.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                      scene.id === activeSceneId
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{scene.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {scene.tokens.length} jeton{scene.tokens.length !== 1 ? "s" : ""} • {scene.drawings.length} dessin{scene.drawings.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {scene.id !== activeSceneId && (
                        <button
                          onClick={() => switchScene(scene)}
                          className="rounded p-1 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold"
                          title="Charger cette scène"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => renameScene(scene.id)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Renommer"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteScene(scene.id)}
                        className="rounded p-1 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {activeSceneId && (
                  <>
                    <Separator />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs gap-1"
                      onClick={() => {
                        const saved = saveCurrentScene();
                        setScenes(prev => prev.map(s => s.id === activeSceneId ? { ...saved, id: activeSceneId } : s));
                        toast({ title: "Scène sauvegardée ✓" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Sauvegarder la scène active
                    </Button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Calques */}
        <Popover open={showLayersPanel} onOpenChange={setShowLayersPanel}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Calques</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" side="bottom" align="start">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Calques</h3>
              {layers.map(layer => (
                <div key={layer.id} className="flex items-center gap-2">
                  <button onClick={() => toggleLayerVisibility(layer.id)}>
                    {layer.visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <span className="flex-1 text-sm">{layer.name}</span>
                  <Slider value={[layer.opacity]} onValueChange={([v]) => updateLayerOpacity(layer.id, v)} min={0} max={100} step={5} className="w-20" />
                  <span className="w-8 text-right text-xs text-muted-foreground">{layer.opacity}%</span>
                </div>
              ))}
              {isGM && (
                <>
                  <Separator />
                  <h3 className="text-sm font-semibold">Carte de fond</h3>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-2 hover:border-primary/50 hover:bg-muted/30 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {layers.find(l => l.id === "map")?.imageUrl ? "Changer la carte" : "Charger une carte"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMapUpload} />
                  </label>
                  {layers.find(l => l.id === "map")?.imageUrl && (
                    <Button variant="destructive" size="sm" className="w-full h-7 text-xs" onClick={() => {
                      mapImageRef.current = null;
                      setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: undefined } : l));
                      saveState({ map_image_url: null });
                    }}>
                      <X className="mr-1 h-3 w-3" /> Retirer la carte
                    </Button>
                  )}
                  <Separator />
                  <h3 className="text-sm font-semibold">Couleur de grille</h3>
                  <div className="flex gap-2 flex-wrap">
                    {["rgba(255,255,255,0.12)", "rgba(255,255,255,0.3)", "rgba(100,100,255,0.2)", "rgba(255,200,100,0.2)", "rgba(100,255,100,0.15)"].map(c => (
                      <button key={c} onClick={() => setGridColor(c)}
                        className={`h-6 w-6 rounded border-2 transition-transform hover:scale-110 ${gridColor === c ? "border-primary scale-110" : "border-border"}`}
                        style={{ backgroundColor: c.replace(/[\d.]+\)$/, "0.8)") }} />
                    ))}
                  </div>
                  <Separator />
                  <h3 className="text-sm font-semibold">Jetons manuels</h3>
                  <div className="flex gap-2">
                    <Input placeholder="Nom" value={newTokenName} onChange={e => setNewTokenName(e.target.value)}
                      className="flex-1 h-8" onKeyDown={e => e.key === "Enter" && addToken()} />
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="h-8 w-8 shrink-0 rounded-md border border-border" style={{ backgroundColor: newTokenColor }} />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-4 gap-1">
                          {TOKEN_COLORS.map(c => (
                            <button key={c} onClick={() => setNewTokenColor(c)}
                              className={`h-7 w-7 rounded-full border-2 ${newTokenColor === c ? "border-primary" : "border-transparent"}`}
                              style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button size="icon" className="h-8 w-8" onClick={addToken} disabled={!newTokenName.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Keyboard hint */}
        <div className="hidden lg:flex items-center gap-1 rounded bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          F=plein écran • V=déplacer • P=crayon • C=cône • Z=zone
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* GM Panel toggle */}
        <Button variant={gmPanelOpen ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => setGmPanelOpen(o => !o)}
          title={gmPanelOpen ? "Fermer le panneau" : "Ouvrir le panneau MJ"}>
          {gmPanelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRight className="h-3.5 w-3.5" />}
        </Button>

        {/* Fullscreen toggle */}
        <Button variant={fullscreen ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => setFullscreen(f => !f)} title={fullscreen ? "Quitter plein écran (F)" : "Plein écran (F)"}>
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* ── MAIN AREA ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT VERTICAL TOOLBAR ── */}
        <div className="flex w-11 shrink-0 flex-col items-center gap-0.5 border-r border-border bg-card/80 overflow-y-auto py-1.5">

          {visibleTools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.key ? `${t.label} (${t.key})` : t.label}
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                tool === t.id
                  ? "bg-primary text-primary-foreground shadow-inner"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.icon}
            </button>
          ))}

          <div className="my-1 w-7 border-t border-border/50" />

          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
                title="Couleur"
              >
                <div className="h-5 w-5 rounded-full border-2 border-white/20 shadow-md" style={{ backgroundColor: color }} />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-auto p-2">
              <div className="grid grid-cols-4 gap-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 hover:scale-110 transition-transform ${color === c ? "border-primary scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Brush size */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex h-9 w-9 flex-col items-center justify-center gap-0 rounded-md hover:bg-muted text-muted-foreground transition-colors" title="Taille du pinceau">
                <Minus className="h-2.5 w-2.5" />
                <span className="text-[9px] font-bold leading-tight">{brushSize}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-40 p-3">
              <div className="space-y-2">
                <p className="text-xs font-medium">Taille : {brushSize}px</p>
                <Slider value={[brushSize]} onValueChange={([v]) => setBrushSize(v)} min={1} max={30} step={1} />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ── CANVAS AREA ── */}
        <div
          ref={containerRef}
          className={`relative flex-1 overflow-hidden bg-[#0d0d14] transition-colors ${
            isDragOverCanvas ? "ring-2 ring-inset ring-primary/60" : ""
          }`}
          style={{ cursor: getCursor() }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-aetheria-char")) {
              e.preventDefault(); e.dataTransfer.dropEffect = "copy";
              if (!isDragOverCanvas) setIsDragOverCanvas(true);
            }
          }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setIsDragOverCanvas(false); }}
          onDrop={(e) => {
            const charId = e.dataTransfer.getData("application/x-aetheria-char");
            setIsDragOverCanvas(false); setDraggingCharId(null);
            if (!charId) return;
            const char = userCharacters.find((c: any) => c.id === charId);
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
            onContextMenu={handleContextMenu}
            className="block h-full w-full"
            style={{ touchAction: "none" }}
          />

          {/* Drop hint */}
          {isDragOverCanvas && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/5">
              <div className="rounded-lg border-2 border-dashed border-primary bg-card/90 px-6 py-3 font-display text-lg text-gradient-gold shadow-gold animate-fade-in">
                Lâchez pour placer le personnage
              </div>
            </div>
          )}

          {/* Bottom-left HUD */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-black/60 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <ZoomIn className="h-3 w-3" />
            {Math.round(zoom * 100)}%
            {snapToGrid && <span className="text-primary" title="Magnétisme">⊕</span>}
            {collisionEnabled && <span className="text-primary" title="Collision">⊗</span>}
            {layers.find(l => l.id === "fog")?.visible && <span className="text-purple-400" title="Brouillard actif">🌫️</span>}
          </div>

          {/* Bottom-right sync */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 hidden sm:inline">Sync</span>
          </div>

          {/* Active tool label */}
          <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-2">
            <div className="rounded-md bg-black/60 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              {TOOLS.find(t => t.id === tool)?.label}
            </div>
          </div>

          {/* Context menu */}
          {contextMenu && (
            <VTTContextMenu
              screenX={contextMenu.screenX}
              screenY={contextMenu.screenY}
              type={contextMenu.type}
              token={ctxToken}
              isGM={isGM}
              onClose={() => setContextMenu(null)}
              onHealToken={ctxToken ? (n) => updateTokenHp(ctxToken.id, n) : undefined}
              onDamageToken={ctxToken ? (n) => updateTokenHp(ctxToken.id, -n) : undefined}
              onSetHp={ctxToken ? (hp) => setTokenHp(ctxToken.id, hp) : undefined}
              onToggleCondition={ctxToken ? (c) => toggleTokenCondition(ctxToken.id, c) : undefined}
              onAddToInitiative={ctxToken ? () => addTokenToInitiative(ctxToken) : undefined}
              onDuplicate={ctxToken ? () => duplicateToken(ctxToken.id) : undefined}
              onToggleHide={ctxToken ? () => toggleTokenHidden(ctxToken.id) : undefined}
              onDelete={ctxToken ? () => removeToken(ctxToken.id) : undefined}
              onCenter={ctxToken ? () => centerOnToken(ctxToken.id) : undefined}
              onResize={ctxToken ? (n) => resizeToken(ctxToken.id, n) : undefined}
              onAddToken={() => addTokenAt(contextMenu.worldX, contextMenu.worldY)}
              onPing={() => broadcastPing(contextMenu.worldX, contextMenu.worldY)}
              onToggleFog={() => toggleLayerVisibility("fog")}
              onClearFogHere={() => {
                const revealAction: DrawAction = {
                  id: newId(), type: "fogReveal",
                  points: [{ x: contextMenu.worldX, y: contextMenu.worldY }],
                  color: "black", size: GRID_SIZE * 1.5, layer: "fog",
                };
                setActions(prev => [...prev, revealAction]);
              }}
              onViewSheet={ctxToken ? () => openTokenSheet(ctxToken) : undefined}
              onEditGmNotes={ctxToken ? () => openGmNotes(ctxToken) : undefined}
              onCopyToken={ctxToken ? () => copyToken(ctxToken.id) : undefined}
              onPasteToken={() => pasteTokenAt(contextMenu.worldX, contextMenu.worldY)}
              hasClipboard={hasClipboard}
            />
          )}

          {/* Selected token panel (floating bottom) */}
          {selectedToken && !gmPanelOpen && (
            <div className="absolute bottom-12 right-2 w-52 rounded-lg border border-border bg-card/95 p-2.5 shadow-lg backdrop-blur-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full border border-primary/40" style={{ backgroundColor: selectedToken.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedToken.name}</p>
                </div>
                <button onClick={() => setSelectedTokenId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {selectedToken.hp !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">PV</span>
                    <span className="font-bold text-red-400">{selectedToken.hp}/{selectedToken.maxHp}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.max(0, (selectedToken.hp / (selectedToken.maxHp || 1)) * 100)}%`,
                      backgroundColor: (selectedToken.hp / (selectedToken.maxHp || 1)) > 0.5 ? "#22c55e" : (selectedToken.hp / (selectedToken.maxHp || 1)) > 0.25 ? "#f59e0b" : "#ef4444",
                    }} />
                  </div>
                  <div className="grid grid-cols-4 gap-0.5">
                    <button className="rounded bg-destructive/20 text-destructive text-xs py-0.5 hover:bg-destructive/40 transition-colors" onClick={() => updateTokenHp(selectedToken.id, -5)}>-5</button>
                    <button className="rounded bg-destructive/20 text-destructive text-xs py-0.5 hover:bg-destructive/40 transition-colors" onClick={() => updateTokenHp(selectedToken.id, -1)}>-1</button>
                    <button className="rounded bg-green-500/20 text-green-400 text-xs py-0.5 hover:bg-green-500/40 transition-colors" onClick={() => updateTokenHp(selectedToken.id, 1)}>+1</button>
                    <button className="rounded bg-green-500/20 text-green-400 text-xs py-0.5 hover:bg-green-500/40 transition-colors" onClick={() => updateTokenHp(selectedToken.id, 5)}>+5</button>
                  </div>
                </div>
              )}
              {/* PE / Mana bar */}
              {selectedToken.maxPe !== undefined && selectedToken.maxPe > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">PE / Mana</span>
                    <span className="font-bold text-blue-400">{selectedToken.pe ?? 0}/{selectedToken.maxPe}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{
                      width: `${Math.max(0, ((selectedToken.pe ?? 0) / selectedToken.maxPe) * 100)}%`,
                    }} />
                  </div>
                  <div className="grid grid-cols-4 gap-0.5">
                    <button className="rounded bg-blue-900/30 text-blue-400 text-xs py-0.5 hover:bg-blue-900/60 transition-colors"
                      onClick={() => setTokens(prev => prev.map(t => t.id === selectedToken.id ? { ...t, pe: Math.max(0, (t.pe ?? 0) - 5) } : t))}>-5</button>
                    <button className="rounded bg-blue-900/30 text-blue-400 text-xs py-0.5 hover:bg-blue-900/60 transition-colors"
                      onClick={() => setTokens(prev => prev.map(t => t.id === selectedToken.id ? { ...t, pe: Math.max(0, (t.pe ?? 0) - 1) } : t))}>-1</button>
                    <button className="rounded bg-blue-500/20 text-blue-300 text-xs py-0.5 hover:bg-blue-500/40 transition-colors"
                      onClick={() => setTokens(prev => prev.map(t => t.id === selectedToken.id ? { ...t, pe: Math.min(t.maxPe ?? 0, (t.pe ?? 0) + 1) } : t))}>+1</button>
                    <button className="rounded bg-blue-500/20 text-blue-300 text-xs py-0.5 hover:bg-blue-500/40 transition-colors"
                      onClick={() => setTokens(prev => prev.map(t => t.id === selectedToken.id ? { ...t, pe: Math.min(t.maxPe ?? 0, (t.pe ?? 0) + 5) } : t))}>+5</button>
                  </div>
                </div>
              )}
              {/* Set PE max via a small inline input if no maxPe defined */}
              {selectedToken.maxPe === undefined && (isGM || true) && (
                <button
                  className="text-[10px] text-muted-foreground hover:text-blue-400 transition-colors"
                  onClick={() => {
                    const v = prompt("Points d'Énergie maximum (laisser vide pour désactiver) :");
                    if (v === null) return;
                    const n = parseInt(v);
                    if (!v.trim()) {
                      setTokens(prev => prev.map(t => t.id === selectedToken.id ? { ...t, pe: undefined, maxPe: undefined } : t));
                    } else if (!isNaN(n) && n >= 0) {
                      setTokens(prev => prev.map(t => t.id === selectedToken.id ? { ...t, pe: n, maxPe: n } : t));
                    }
                  }}
                >
                  + Ajouter PE / Mana
                </button>
              )}
              <div className="grid grid-cols-4 gap-0.5">
                <button className="rounded border border-border text-xs py-0.5 hover:bg-muted transition-colors" onClick={() => rotateToken(selectedToken.id, -15)}>-15°</button>
                <button className="rounded border border-border text-xs py-0.5 hover:bg-muted transition-colors" onClick={() => rotateToken(selectedToken.id, 15)}>+15°</button>
                {[1, 2, 3, 4].map(n => (
                  <button key={n} className={`rounded text-xs py-0.5 transition-colors ${selectedToken.sizeUnits === n ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
                    onClick={() => resizeToken(selectedToken.id, n)}>{n}×</button>
                ))}
              </div>
            </div>
          )}

          <DiceRoller3D
            open={diceOpen}
            onClose={() => setDiceOpen(false)}
            campaignId={campaignId}
            userName={user?.display_name || user?.email?.split("@")[0] || "Joueur"}
          />
          <DiceBroadcastOverlay campaignId={campaignId} />
        </div>

        {/* ── GM PANEL ── */}
        {gmPanelOpen && (
          <GMPanel
            campaignId={campaignId}
            isGM={isGM}
            currentUserId={user?.id || ""}
            userName={user?.display_name || user?.email?.split("@")[0] || "Joueur"}
            tokens={tokens}
            waCreatures={waCreatures}
            userCharacters={userCharacters}
            initiative={initiative}
            initiativeRound={initiativeRound}
            initiativeActiveIdx={initiativeActiveIdx}
            onUpdateTokenHp={updateTokenHp}
            onSelectToken={(id) => { setSelectedTokenId(id); centerOnToken(id); }}
            onSpawnCreature={spawnWACreature}
            onSpawnCharacter={spawnCharacter}
            onAddToInitiative={addToInitiative}
            onRemoveFromInitiative={removeFromInitiative}
            onUpdateInitiativeHp={updateInitiativeHp}
            onAddConditionToInitiative={addConditionToInitiative}
            onRemoveConditionFromInitiative={removeConditionFromInitiative}
            onNextTurn={nextTurn}
            onResetInitiative={resetInitiative}
            onClose={() => setGmPanelOpen(false)}
          />
        )}
      </div>

      {/* Voir la fiche du jeton */}
      <Dialog open={!!sheetToken} onOpenChange={(o) => !o && setSheetToken(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: sheetToken?.color }} />
              {sheetToken?.name}
            </DialogTitle>
            <DialogDescription>
              {sheetToken?.creatureType === "character" ? "Personnage joueur" :
               sheetToken?.creatureType === "wa_creature" ? "Créature (Worlds Awakening)" :
               sheetToken?.creatureType === "monster" ? "Monstre" : "Jeton"}
            </DialogDescription>
          </DialogHeader>
          {sheetToken && (
            <div className="space-y-3 text-sm">
              {sheetToken.imageUrl && (
                <img src={sheetToken.imageUrl} alt={sheetToken.name} className="w-full h-40 object-cover rounded-md border border-border" />
              )}
              <div className="grid grid-cols-2 gap-2">
                {sheetToken.hp !== undefined && (
                  <div className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">PV</div>
                    <div className="font-semibold">{sheetToken.hp} / {sheetToken.maxHp}</div>
                  </div>
                )}
                {sheetToken.pe !== undefined && (
                  <div className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">PE</div>
                    <div className="font-semibold">{sheetToken.pe} / {sheetToken.maxPe}</div>
                  </div>
                )}
                {sheetToken.ac !== undefined && (
                  <div className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">CA</div>
                    <div className="font-semibold">{sheetToken.ac}</div>
                  </div>
                )}
                <div className="rounded border border-border p-2">
                  <div className="text-xs text-muted-foreground">Taille</div>
                  <div className="font-semibold">{sheetToken.sizeUnits}× case{sheetToken.sizeUnits > 1 ? "s" : ""}</div>
                </div>
              </div>
              {sheetToken.conditions && sheetToken.conditions.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Conditions actives</div>
                  <div className="flex flex-wrap gap-1">
                    {sheetToken.conditions.map(c => {
                      const def = CONDITIONS.find(x => x.id === c);
                      return (
                        <span key={c} className="inline-flex items-center gap-1 rounded bg-primary/15 text-primary px-2 py-0.5 text-xs">
                          <span>{def?.emoji}</span>{def?.label ?? c}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {isGM && (
                <div className="flex items-center justify-between rounded border border-border p-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Statut Boss</div>
                    <div className="text-xs">Anneau doré + halo lumineux</div>
                  </div>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded text-xs font-semibold border ${sheetToken.isBoss ? "bg-amber-500/20 border-amber-500 text-amber-300" : "border-border text-muted-foreground hover:bg-muted/40"}`}
                    onClick={() => {
                      setTokens(prev => prev.map(t => t.id === sheetToken.id ? { ...t, isBoss: !t.isBoss } : t));
                      setSheetToken(s => s ? { ...s, isBoss: !s.isBoss } : s);
                    }}
                  >
                    {sheetToken.isBoss ? "★ Boss" : "Marquer Boss"}
                  </button>
                </div>
              )}
              {sheetToken.creatureId && (
                <p className="text-xs text-muted-foreground">
                  Pour la fiche complète, ouvrir le compendium ou le bestiaire.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes MJ privées */}
      <Dialog open={!!gmNotesToken} onOpenChange={(o) => !o && setGmNotesToken(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notes MJ — {gmNotesToken?.name}</DialogTitle>
            <DialogDescription>
              Visible uniquement par le MJ. Stockées de manière privée côté serveur.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={gmNotesContent}
            onChange={(e) => setGmNotesContent(e.target.value)}
            placeholder={gmNotesLoading ? "Chargement…" : "Ex. : Trahit le groupe au tour 4, possède la clé du donjon…"}
            disabled={gmNotesLoading || gmNotesSaving}
            rows={8}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGmNotesToken(null)} disabled={gmNotesSaving}>Annuler</Button>
            <Button onClick={saveGmNotes} disabled={gmNotesSaving || gmNotesLoading}>
              {gmNotesSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignTabletop;

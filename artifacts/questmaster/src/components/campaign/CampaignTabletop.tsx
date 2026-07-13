import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
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
  MapPin, Wand2, Keyboard, Film, ChevronRight, DoorClosed, Shield,
  Lightbulb, Moon, Smartphone, RectangleHorizontal, Trees, Map as MapIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWalls } from "@/hooks/useWalls";
import { useLights } from "@/hooks/useLights";
import { computeVisibilityPolygon, type Segment } from "@/lib/visibility-polygon";
import WallsToolbar from "@/components/campaign/vtt/WallsToolbar";
import { WALL_COLORS, LIGHT_PRESETS, LIGHT_PRESET_LABELS } from "@/components/campaign/vtt/types";
import {
  FIMove, FIPing, FIQuill, FIEraser, FIRect, FICircle, FIText,
  FIMeasure, FICone, FIZone, FIHelm, FIEye, FIWall, FIDoor,
  FIWindow, FIBriars, FIWallBreak, FITorch, FITorchOff,
} from "@/components/campaign/vtt/FantasyToolIcons";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
const DiceRoller3D = lazy(() => import("./DiceRoller3D"));
import DiceBroadcastOverlay from "./DiceBroadcastOverlay";
import VTTContextMenu from "./vtt/VTTContextMenu";
import GMPanel from "./vtt/GMPanel";
import PlayerPanel from "./vtt/PlayerPanel";
import {
  Tool, DrawAction, TokenItem, MapLayer, InitiativeEntry, ContextMenuState,
  CONDITIONS, AURA_COLORS, VTTScene, LightSource, LightPreset,
} from "./vtt/types";
import { supabase } from "@/integrations/supabase/client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { campaignsApi, charactersApi, compendiumApi } from "@/lib/api";
import { useTabletopSync } from "@/hooks/useTabletopSync";
import { ConnectionStatus } from "@/components/campaign/ConnectionStatus";
import { SharedPdfPopups, type SharedDocument } from "@/components/campaign/vtt/SharedPdfPopups";
import { MediaPickerDialog } from "@/components/media/MediaPickerDialog";
import { FileText } from "lucide-react";

import SheetRouter from "@/components/characters/sheets/SheetRouter";
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
  onToggleLayers?: () => void;
  layersOpen?: boolean;
}

// Helper : hex (#rrggbb) → rgba(r,g,b,a)
function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
const CampaignTabletop = ({ campaignId, isGM, onToggleLayers, layersOpen }: CampaignTabletopProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const tokenImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const pingAnimRef = useRef<number | null>(null);

  // ── Core tool state ──
  const isMobile = useIsMobile();
  const isMobilePlayer = isMobile && !isGM;
  const isMobileGM = isMobile && isGM;
  const [tool, setTool] = useState<Tool>("move");
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(3);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [undoneActions, setUndoneActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  // ── Measurement unit (GM-configurable, persisted per campaign) ──
  type MeasureUnit = "m" | "ft" | "cases" | "km";
  const [measureUnit, setMeasureUnitState] = useState<MeasureUnit>(() => {
    try {
      const v = localStorage.getItem(`vtt-measure-unit-${campaignId}`);
      if (v === "m" || v === "ft" || v === "cases" || v === "km") return v;
    } catch {}
    return "m";
  });
  const setMeasureUnit = (u: MeasureUnit) => {
    setMeasureUnitState(u);
    try { localStorage.setItem(`vtt-measure-unit-${campaignId}`, u); } catch {}
  };
  const formatMeasure = useCallback((squares: number): string => {
    const cases = `${squares.toFixed(1)} case${squares >= 2 ? "s" : ""}`;
    switch (measureUnit) {
      case "ft":    return `${(squares * 5).toFixed(0)} ft (${cases})`;
      case "cases": return cases;
      case "km":    return `${((squares * M_PER_SQUARE) / 1000).toFixed(3)} km (${cases})`;
      case "m":
      default:      return `${(squares * M_PER_SQUARE).toFixed(1)} m (${cases})`;
    }
  }, [measureUnit]);

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
    { id: "map", name: "Carte", type: "map", visible: true, locked: false, opacity: 100, scale: 1 },
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
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [gmPanelOpen, setGmPanelOpen] = useState(true);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenColor, setNewTokenColor] = useState(TOKEN_COLORS[0]);
  // (showLayersPanel retiré — la gestion des calques se fait via le panneau flottant LayersPanel monté par CampaignPlay)
  const [gridColor, setGridColor] = useState("rgba(255,255,255,0.12)");
  const [gridMajorColor, setGridMajorColor] = useState("rgba(255,255,255,0.28)");
  const [plateauMode, setPlateauMode] = useState<"dark" | "sky">("dark");
  const [wallRafThrottle, setWallRafThrottle] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("vtt_wall_raf_throttle") : null;
    return saved ? Math.max(0, Math.min(5, parseInt(saved, 10))) : 0;
  });

  useEffect(() => {
    localStorage.setItem("vtt_wall_raf_throttle", String(wallRafThrottle));
  }, [wallRafThrottle]);

  const plateauColors = useMemo(() => (
    plateauMode === "dark"
      ? { background: "#0f1520", gridMinor: "hsl(216,20%,25%)", gridMajor: "hsl(42,50%,45%)" }
      : { background: "#8c97a2", gridMinor: "rgba(55,78,100,0.45)", gridMajor: "rgba(35,55,80,0.75)" }
  ), [plateauMode]);

  // ── Scenes ──
  const [scenes, setScenes] = useState<VTTScene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [showScenesPanel, setShowScenesPanel] = useState(false);

  // ── Shared documents (PDF popups) ──
  const [sharedDocs, setSharedDocs] = useState<SharedDocument[]>([]);


  // ── Context menu ──
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // ── Token clipboard (copy / paste) ──
  const tokenClipboardRef = useRef<TokenItem | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);

  // ── Click vs drag tracking (simple click on token = open sheet) ──
  const clickStartRef = useRef<{ x: number; y: number; t: number; tokenId: string; denied: boolean } | null>(null);
  const didDragRef = useRef(false);

  // ── Voir fiche dialog ──
  const [sheetToken, setSheetToken] = useState<TokenItem | null>(null);
  // Keep the open sheet in sync with the live token state (realtime updates, condition toggles, etc.)
  useEffect(() => {
    if (!sheetToken) return;
    const live = tokens.find(t => t.id === sheetToken.id);
    if (!live) { setSheetToken(null); return; }
    if (live !== sheetToken) setSheetToken(live);
  }, [tokens, sheetToken]);

  // ── Fiche complète liée au token (sync token ↔ fiche personnage) ──
  const queryClient = useQueryClient();
  const [fullSheetCharId, setFullSheetCharId] = useState<string | null>(null);

  const { data: fullSheetCharacter } = useQuery({
    queryKey: ["vtt-linked-character", fullSheetCharId],
    enabled: !!fullSheetCharId,
    queryFn: async () => {
      if (!fullSheetCharId) return null;
      try { return await charactersApi.get(fullSheetCharId); }
      catch { return null; }
    },
  });

  // Realtime: refresh sheet when its character row changes
  useEffect(() => {
    if (!fullSheetCharId) return;
    const ch = supabase
      .channel(`character-sheet-${fullSheetCharId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${fullSheetCharId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["vtt-linked-character", fullSheetCharId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fullSheetCharId, queryClient]);

  const updateCharacterMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      return await charactersApi.update(id, patch);
    },
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ["vtt-linked-character", updated?.id] });
      queryClient.invalidateQueries({ queryKey: ["vtt-user-characters"] });
      // Mirror key fields to all tokens linked to this character
      if (updated?.id) {
        setTokens(prev => prev.map(t => (
          t.creatureType === "character" && t.creatureId === updated.id
            ? {
                ...t,
                name: updated.name ?? t.name,
                hp: typeof updated.hp === "number" ? updated.hp : t.hp,
                maxHp: typeof updated.max_hp === "number" ? updated.max_hp : t.maxHp,
                ac: typeof updated.armor_class === "number" ? updated.armor_class : t.ac,
                imageUrl: updated.avatar_url ?? t.imageUrl,
              }
            : t
        )));
      }
      toast({ title: "Fiche enregistrée" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message ?? "Sauvegarde impossible", variant: "destructive" });
    },
  });

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

  // Throttle le redraw de la preview de mur sur un seul frame (dessin fluide)
  const wallPreviewRafRef = useRef<number | null>(null);
  const wallPreviewFrameRef = useRef(0);
  const wallRafThrottleRef = useRef(wallRafThrottle);
  wallRafThrottleRef.current = wallRafThrottle;

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
  const panOffsetRef = useRef(panOffset);
  const zoomRef = useRef(zoom);
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressActiveRef = useRef(false);
  const longPressStartPosRef = useRef({ x: 0, y: 0 });

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
  const wallsHookRef = useRef<ReturnType<typeof useWalls> | null>(null);
  const { saveState, isDirty, isSaving, lastSavedAt, connectionStatus } = useTabletopSync({
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
      const incomingWalls = (state as any).walls;
      if (incomingWalls) wallsHookRef.current?.receiveWalls(incomingWalls);
      const incomingLights = (state as any).lights;
      if (incomingLights) lightsHookRef.current?.receiveLights(incomingLights);
      if (typeof (state as any).night_mode === "boolean") {
        lightsHookRef.current?.receiveNightMode((state as any).night_mode);
      }
      // ── Initiative (persistée) ──
      const incomingInit = (state as any).initiative;
      if (Array.isArray(incomingInit)) setInitiative(incomingInit as InitiativeEntry[]);
      const incomingRound = (state as any).initiative_round;
      if (typeof incomingRound === "number") setInitiativeRound(incomingRound);
      const incomingActive = (state as any).initiative_active_idx;
      if (typeof incomingActive === "number") setInitiativeActiveIdx(incomingActive);
      // ── Scènes (persistées) ──
      const incomingScenes = (state as any).scenes;
      if (Array.isArray(incomingScenes)) setScenes(incomingScenes as VTTScene[]);
      const incomingActiveScene = (state as any).active_scene_id;
      if (typeof incomingActiveScene === "string" || incomingActiveScene === null) {
        setActiveSceneId(incomingActiveScene ?? null);
      }
      // ── Documents partagés (PDF pop-up) ──
      const incomingDocs = (state as any).shared_documents;
      if (Array.isArray(incomingDocs)) setSharedDocs(incomingDocs as SharedDocument[]);

    },
    debounceMs: 250,
  });

  const wallsHook = useWalls({
    campaignId,
    isGM,
    saveStateDebounced: saveState,
    gridSize: GRID_SIZE,
    metersPerSquare: M_PER_SQUARE,
  });
  wallsHookRef.current = wallsHook;

  const lightsHookRef = useRef<ReturnType<typeof useLights> | null>(null);
  const lightsHook = useLights({
    campaignId,
    isGM,
    saveStateDebounced: saveState,
  });
  lightsHookRef.current = lightsHook;

  // ── Collision murs / portes fermées : segments traversants bloqués ──
  const segmentsIntersect = (
    ax: number, ay: number, bx: number, by: number,
    cx: number, cy: number, dx: number, dy: number,
  ): boolean => {
    const d1x = bx - ax, d1y = by - ay;
    const d2x = dx - cx, d2y = dy - cy;
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 1e-9) return false;
    const t = ((cx - ax) * d2y - (cy - ay) * d2x) / denom;
    const u = ((cx - ax) * d1y - (cy - ay) * d1x) / denom;
    return t > 0 && t < 1 && u > 0 && u < 1;
  };
  const crossesBlocker = useCallback((x1: number, y1: number, x2: number, y2: number): boolean => {
    if (x1 === x2 && y1 === y2) return false;
    const blockers = wallsHook.walls.filter(w => w.type === "solid" || (w.type === "door" && !w.isOpen));
    for (const w of blockers) {
      if (segmentsIntersect(x1, y1, x2, y2, w.x1, w.y1, w.x2, w.y2)) return true;
    }
    return false;
  }, [wallsHook.walls]);

  useEffect(() => { if (user?.id) saveState({ tokens }); }, [tokens, saveState, user?.id]);
  useEffect(() => { if (user?.id) saveState({ drawings: actions }); }, [actions, saveState, user?.id]);
  // Persistance de l'initiative (ordre, round, tour actif)
  useEffect(() => {
    if (user?.id) saveState({
      initiative: initiative as unknown as unknown[],
      initiative_round: initiativeRound,
      initiative_active_idx: initiativeActiveIdx,
    });
  }, [initiative, initiativeRound, initiativeActiveIdx, saveState, user?.id]);
  // Persistance des scènes (MJ uniquement — RLS/trigger côté serveur)
  useEffect(() => {
    if (user?.id && isGM) saveState({
      scenes: scenes as unknown as unknown[],
      active_scene_id: activeSceneId,
    } as any);
  }, [scenes, activeSceneId, saveState, user?.id, isGM]);
  // Persistance des documents partagés (MJ uniquement)
  useEffect(() => {
    if (user?.id && isGM) saveState({ shared_documents: sharedDocs as unknown as unknown[] } as any);
  }, [sharedDocs, saveState, user?.id, isGM]);

  const shareDocument = useCallback((asset: { id: string; name: string; storage_path: string }) => {
    if (!isGM || !user?.id) return;
    setSharedDocs(prev => {
      if (prev.some(d => d.id === asset.id)) return prev;
      return [...prev, { id: asset.id, name: asset.name, storage_path: asset.storage_path, added_at: Date.now(), added_by: user.id }];
    });
    toast({ title: "Document partagé", description: `« ${asset.name} » est visible par tous les joueurs.` });
  }, [isGM, user?.id, toast]);

  const unshareDocument = useCallback((id: string) => {
    if (!isGM) return;
    setSharedDocs(prev => prev.filter(d => d.id !== id));
  }, [isGM]);



  // ── Detect token position changes and start a slide tween ──
  useEffect(() => {
    const now = performance.now();
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
          const e = 1 - Math.pow(1 - p, 5);
          startX = cur.fromX + (cur.toX - cur.fromX) * e;
          startY = cur.fromY + (cur.toY - cur.fromY) * e;
        }
        const dist = Math.hypot(t.x - startX, t.y - startY);
        if (dist < 0.5) {
          // Negligible move — snap without animating to avoid micro-jumps
          tokenAnimRef.current.delete(t.id);
        } else {
          // Distance-adaptive duration: snappier for short hops, smoother for long throws
          const duration = Math.max(140, Math.min(360, 120 + dist * 0.55));
          tokenAnimRef.current.set(t.id, {
            fromX: startX, fromY: startY,
            toX: t.x, toY: t.y,
            start: now, duration,
          });
        }
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
  // (la query waCreatures est plus bas, gatée par campaignSystem)

  // Système verrouillé de la campagne (sépare les codex)
  const { data: campaignInfo } = useQuery({
    queryKey: ["campaign-info-tabletop", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("system, allow_homebrew_characters")
        .eq("id", campaignId)
        .maybeSingle();
      return data;
    },
  });
  const campaignSystem = campaignInfo?.system ?? "Aetheria";
  const allowHomebrew = !!campaignInfo?.allow_homebrew_characters;

  const { data: waCreatures = [] } = useQuery({
    queryKey: ["vtt-wa-creatures", campaignSystem],
    enabled: campaignSystem === "Worlds Awakening",
    queryFn: async () => {
      try { return await compendiumApi.getWaCreatures(); }
      catch { return []; }
    },
  });

  const { data: aetheriaCreatures = [] } = useQuery({
    queryKey: ["aetheria-creatures-tabletop", campaignId, campaignSystem],
    enabled: campaignSystem === "Aetheria",
    queryFn: async () => {
      const { data } = await supabase
        .from("aetheria_creatures")
        .select("*")
        .or(`campaign_id.eq.${campaignId},is_public.eq.true`)
        .order("name");
      return data || [];
    },
  });

  // Bestiaire générique (D&D, PF2e, Cthulhu, Personnalisé) — filtré strict par système
  const { data: systemMonsters = [] } = useQuery({
    queryKey: ["system-monsters-tabletop", campaignId, campaignSystem, allowHomebrew],
    enabled: ["D&D 5e", "Pathfinder 2e", "Call of Cthulhu", "Personnalisé"].includes(campaignSystem),
    queryFn: async () => {
      let q = supabase.from("monsters").select("*").eq("system", campaignSystem);
      if (!allowHomebrew) {
        // Officiels + perso du MJ + de la campagne
        q = q.or(`scope.eq.official,campaign_id.eq.${campaignId},created_by.eq.${user?.id ?? "00000000-0000-0000-0000-000000000000"}`);
      }
      const { data } = await q.order("name");
      return data || [];
    },
  });

  const { data: userCharacters = [] } = useQuery({
    queryKey: ["vtt-user-characters", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try { return await charactersApi.list(); }
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
      ownerUserId: char.user_id ?? user?.id,
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

  const clientToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panOffset.x) / zoom,
      y: (clientY - rect.top - panOffset.y) / zoom,
    };
  };

  const spawnWACreature = (creature: any, atX?: number, atY?: number) => {
    if (!perms.canAddToken) { denied("Seul le MJ peut placer une créature"); return; }
    const su = creature.size === "Très grand" ? 3 : creature.size === "Grand" ? 2 : 1;
    const size = GRID_SIZE * su;
    const cx = atX ?? ((-panOffset.x / zoom) + 200);
    const cy = atY ?? ((-panOffset.y / zoom) + 200);
    const wx = snapValue(cx - size / 2);
    const wy = snapValue(cy - size / 2);
    const free = findFreePosition(wx, wy, size);
    setTokens(prev => [...prev, {
      id: newId(), name: creature.name, x: free.x, y: free.y, size, sizeUnits: su,
      rotation: 0, color: "#ef4444", label: creature.name.substring(0, 2).toUpperCase(),
      layer: "tokens", visible: true, creatureId: creature.id, creatureType: "wa_creature",
      hp: (creature.constitution || 0) * 5 + 10, maxHp: (creature.constitution || 0) * 5 + 10,
      ac: 10 + (creature.dexterity || 0), conditions: [],
    }]);
  };

  const spawnAetheriaCreature = (creature: any, atX?: number, atY?: number) => {
    if (!perms.canAddToken) { denied("Seul le MJ peut placer une créature"); return; }
    const cx = atX ?? ((-panOffset.x / zoom) + 200);
    const cy = atY ?? ((-panOffset.y / zoom) + 200);
    const wx = snapValue(cx - GRID_SIZE / 2);
    const wy = snapValue(cy - GRID_SIZE / 2);
    const free = findFreePosition(wx, wy, GRID_SIZE);
    setTokens(prev => [...prev, {
      id: newId(),
      name: creature.name,
      x: free.x,
      y: free.y,
      size: GRID_SIZE,
      sizeUnits: 1,
      rotation: 0,
      color: "#ef4444",
      label: creature.name.substring(0, 2).toUpperCase(),
      layer: "tokens",
      visible: true,
      creatureType: "aetheria_creature",
      creatureId: creature.id,
      hp: creature.pv_max,
      maxHp: creature.pv_max,
      ac: creature.def_physique,
      conditions: [],
    } as TokenItem]);
  };

  const spawnSystemMonster = (monster: any, atX?: number, atY?: number) => {
    if (!perms.canAddToken) { denied("Seul le MJ peut placer une créature"); return; }
    const su = monster.size === "Huge" || monster.size === "Très grand" ? 3
            : monster.size === "Large" || monster.size === "Grand" ? 2 : 1;
    const size = GRID_SIZE * su;
    const cx = atX ?? ((-panOffset.x / zoom) + 200);
    const cy = atY ?? ((-panOffset.y / zoom) + 200);
    const wx = snapValue(cx - size / 2);
    const wy = snapValue(cy - size / 2);
    const free = findFreePosition(wx, wy, size);
    const hpVal = (() => {
      const m = String(monster.hit_points ?? "10").match(/^(\d+)/);
      return m ? Number(m[1]) : 10;
    })();
    setTokens(prev => [...prev, {
      id: newId(),
      name: monster.name,
      x: free.x, y: free.y,
      size, sizeUnits: su,
      rotation: 0,
      color: "#ef4444",
      label: monster.name.substring(0, 2).toUpperCase(),
      layer: "tokens",
      visible: true,
      creatureId: monster.id,
      creatureType: "monster",
      hp: hpVal,
      maxHp: hpVal,
      ac: Number(monster.armor_class) || 10,
      conditions: [],
    } as TokenItem]);
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

  const updateToken = (tokenId: string, updates: Partial<TokenItem>) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, ...updates } : t));
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
      if (crossesBlocker(t.x, t.y, t.x + dx, t.y + dy)) return t;
      const free = findFreePosition(t.x + dx, t.y + dy, t.size, t.id);
      if (crossesBlocker(t.x, t.y, free.x, free.y)) return t;
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

  // Glyphes : "épreuve d'initiative" = jet du pool de dés de Souplesse (SOU).
  // Règle : N dés (N = niveau d'aptitude, 2 par défaut). Taille = niveau du dé lié à SOU.
  // On mappe le "modifier" existant sur le niveau SOU (0..5). Sortie = somme des 2 dés,
  // qui sert d'ordre de passage (l'esprit de la règle est conservé : plus SOU est élevé,
  // plus la valeur monte). Pour les autres systèmes, on garde le classique 1d20 + mod.
  const rollInitiativeForSystem = (modifier = 0): number => {
    if (campaignSystem === "Glyphes") {
      const sizes = [4, 6, 8, 10, 12];
      const sou = Math.max(0, Math.min(4, modifier || 0));
      const size = sizes[sou];
      const d1 = Math.floor(Math.random() * size) + 1;
      const d2 = Math.floor(Math.random() * size) + 1;
      return d1 + d2;
    }
    return Math.floor(Math.random() * 20) + 1 + (modifier || 0);
  };

  const addTokenToInitiative = (token: TokenItem) => {
    const rollResult = rollInitiativeForSystem(0);
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

  // Ajoute le jeton actuellement sélectionné à l'initiative
  const addSelectedTokenToInitiative = () => {
    if (!selectedTokenId) return;
    const token = tokens.find(t => t.id === selectedTokenId);
    if (!token) return;
    // Anti-doublon : si un token est déjà dans l'initiative, on ignore
    if (initiative.some(e => e.tokenId === token.id)) return;
    addTokenToInitiative(token);
  };

  // Ajoute tous les jetons visibles du plateau qui ne sont pas déjà présents
  const addAllTokensToInitiative = () => {
    const existing = new Set(initiative.map(e => e.tokenId).filter(Boolean));
    const toAdd = tokens.filter(t => t.visible !== false && !existing.has(t.id));
    if (toAdd.length === 0) return;
    setInitiative(prev => [
      ...prev,
      ...toAdd.map(token => ({
        id: newId(),
        name: token.name,
        initiative: rollInitiativeForSystem(0),
        modifier: 0,
        hp: token.hp ?? 10,
        maxHp: token.maxHp ?? 10,
        ac: token.ac,
        conditions: token.conditions || [],
        tokenId: token.id,
        type: (token.creatureType === "character" ? "player" : "monster") as InitiativeEntry["type"],
        color: token.color,
      })),
    ]);
  };

  // Relance l'initiative / épreuve pour tous les combattants
  const autoRollAllInitiative = () => {
    setInitiative(prev =>
      prev.map(e => ({
        ...e,
        initiative: rollInitiativeForSystem(e.modifier || 0),
      }))
    );
    setInitiativeActiveIdx(-1);
  };

  // Modifie manuellement la valeur d'initiative d'une entrée
  const updateInitiativeValue = (id: string, value: number) => {
    setInitiative(prev => prev.map(e => (e.id === id ? { ...e, initiative: value } : e)));
  };

  // Réordonne en ajustant la valeur d'initiative (la liste est triée desc)
  const reorderInitiative = (id: string, dir: "up" | "down") => {
    setInitiative(prev => {
      const sorted = [...prev].sort((a, b) => b.initiative - a.initiative);
      const idx = sorted.findIndex(e => e.id === id);
      if (idx < 0) return prev;
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const a = sorted[idx];
      const b = sorted[swapIdx];
      // échange des valeurs d'initiative (sans collision)
      const aInit = a.initiative;
      const bInit = b.initiative;
      const newAInit = aInit === bInit ? (dir === "up" ? bInit + 1 : bInit - 1) : bInit;
      const newBInit = aInit === bInit ? aInit : aInit;
      return prev.map(e => {
        if (e.id === a.id) return { ...e, initiative: newAInit };
        if (e.id === b.id) return { ...e, initiative: newBInit };
        return e;
      });
    });
  };

  // ── Sync : si un token est renommé sur le plateau, met à jour le nom dans l'initiative
  useEffect(() => {
    setInitiative(prev => {
      let changed = false;
      const next = prev.map(e => {
        if (!e.tokenId) return e;
        const tk = tokens.find(t => t.id === e.tokenId);
        if (tk && tk.name && tk.name !== e.name) {
          changed = true;
          return { ...e, name: tk.name, color: tk.color || e.color };
        }
        return e;
      });
      return changed ? next : prev;
    });
  }, [tokens]);


  // ── Canvas rendering ──────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Évite "drawImage on canvas with width/height 0" lors du tout 1er rendu
    if (!canvas.width || !canvas.height) return;
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
    if (mapLayer?.visible && mapImageRef.current && mapImageRef.current.naturalWidth > 0 && mapImageRef.current.naturalHeight > 0) {
      ctx.save();
      ctx.globalAlpha = mapLayer.opacity / 100;
      const mScale = mapLayer.scale ?? 1;
      try {
        ctx.drawImage(
          mapImageRef.current,
          0, 0,
          mapImageRef.current.naturalWidth * mScale,
          mapImageRef.current.naturalHeight * mScale,
        );
      } catch { /* image pas prête */ }
      ctx.restore();
    }


    // ── Drawings layer (excluding fogReveal) ──────────────────
    // Rendu sur canvas offscreen pour isoler la gomme du fond/grille/carte.
    const drawingsLayer = layers.find(l => l.id === "drawings");
    if (drawingsLayer?.visible) {
      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const octx = off.getContext("2d");
      if (octx) {
        octx.translate(panOffset.x, panOffset.y);
        octx.scale(zoom, zoom);

        const visibleActions = actions.filter(a =>
          a.layer === "drawings" && (a.type as string) !== "fogReveal"
        );

        for (const action of visibleActions) {
          octx.save();
          octx.strokeStyle = action.color;
          octx.fillStyle = action.color;
          octx.lineWidth = action.size / zoom;
          octx.lineCap = "round";
          octx.lineJoin = "round";

          switch (action.type) {
            case "pencil":
              if (action.points.length < 2) break;
              octx.beginPath();
              octx.moveTo(action.points[0].x, action.points[0].y);
              for (const p of action.points.slice(1)) octx.lineTo(p.x, p.y);
              octx.stroke();
              break;
            case "eraser": {
              const prev = octx.globalCompositeOperation;
              octx.globalCompositeOperation = "destination-out";
              octx.lineWidth = action.size * 3 / zoom;
              octx.beginPath();
              octx.moveTo(action.points[0].x, action.points[0].y);
              for (const p of action.points.slice(1)) octx.lineTo(p.x, p.y);
              octx.stroke();
              octx.globalCompositeOperation = prev;
              break;
            }
            case "line":
              if (action.points.length >= 2) {
                octx.beginPath();
                octx.moveTo(action.points[0].x, action.points[0].y);
                octx.lineTo(action.points[action.points.length - 1].x, action.points[action.points.length - 1].y);
                octx.stroke();
                const p1 = action.points[0], p2 = action.points[action.points.length - 1];
                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const sq = Math.round(dist / GRID_SIZE);
                if (sq > 0) {
                  octx.font = `${10 / zoom}px sans-serif`;
                  octx.fillText(`${sq * M_PER_SQUARE}m`, (p1.x + p2.x) / 2 + 4, (p1.y + p2.y) / 2 - 4);
                }
              }
              break;
            case "rect":
              if (action.points.length >= 2) {
                const [a, b] = action.points;
                octx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
              }
              break;
            case "circle":
              if (action.points.length >= 2) {
                const [a, b] = action.points;
                const r = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
                octx.beginPath(); octx.arc(a.x, a.y, r, 0, Math.PI * 2); octx.stroke();
              }
              break;
            case "text":
              if (action.text && action.points[0]) {
                octx.font = `${action.size * 3 / zoom}px 'Lora', serif`;
                octx.fillText(action.text, action.points[0].x, action.points[0].y);
              }
              break;
            case "cone":
              renderCone(octx, action, zoom, GRID_SIZE, M_PER_SQUARE);
              break;
            case "zone":
              renderZone(octx, action, zoom, GRID_SIZE, M_PER_SQUARE);
              break;
            default:
              break;
          }
          octx.restore();
        }

        // Current action preview
        if (currentAction && (currentAction.type as string) !== "fogReveal") {
          octx.save();
          octx.strokeStyle = currentAction.color;
          octx.fillStyle = currentAction.color;
          octx.lineWidth = currentAction.size / zoom;
          octx.lineCap = "round";
          octx.lineJoin = "round";

          switch (currentAction.type) {
            case "pencil":
              if (currentAction.points.length >= 2) {
                octx.beginPath();
                octx.moveTo(currentAction.points[0].x, currentAction.points[0].y);
                for (const p of currentAction.points.slice(1)) octx.lineTo(p.x, p.y);
                octx.stroke();
              }
              break;
            case "eraser": {
              octx.globalCompositeOperation = "destination-out";
              octx.lineWidth = currentAction.size * 3 / zoom;
              if (currentAction.points.length >= 2) {
                octx.beginPath();
                octx.moveTo(currentAction.points[0].x, currentAction.points[0].y);
                for (const p of currentAction.points.slice(1)) octx.lineTo(p.x, p.y);
                octx.stroke();
              }
              break;
            }
            case "line":
              if (currentAction.points.length >= 2) {
                octx.beginPath();
                octx.moveTo(currentAction.points[0].x, currentAction.points[0].y);
                octx.lineTo(currentAction.points[currentAction.points.length - 1].x, currentAction.points[currentAction.points.length - 1].y);
                octx.stroke();
              }
              break;
            case "measure":
              if (currentAction.points.length >= 2) {
                const mp0 = currentAction.points[0];
                const mp1 = currentAction.points[currentAction.points.length - 1];
                const mDist = Math.sqrt((mp1.x - mp0.x) ** 2 + (mp1.y - mp0.y) ** 2);
                const mSquares = mDist / GRID_SIZE;
                octx.save();
                octx.strokeStyle = "#f59e0b";
                octx.lineWidth = 2 / zoom;
                octx.setLineDash([6 / zoom, 4 / zoom]);
                octx.beginPath();
                octx.moveTo(mp0.x, mp0.y);
                octx.lineTo(mp1.x, mp1.y);
                octx.stroke();
                octx.setLineDash([]);
                octx.fillStyle = "#f59e0b";
                octx.beginPath();
                octx.arc(mp0.x, mp0.y, 4 / zoom, 0, Math.PI * 2);
                octx.fill();
                octx.beginPath();
                octx.arc(mp1.x, mp1.y, 4 / zoom, 0, Math.PI * 2);
                octx.fill();
                const midX = (mp0.x + mp1.x) / 2;
                const midY = (mp0.y + mp1.y) / 2;
                const label = formatMeasure(mSquares);
                octx.font = `bold ${13 / zoom}px 'Lora', serif`;
                const tw = octx.measureText(label).width;
                octx.fillStyle = "rgba(0,0,0,0.7)";
                octx.fillRect(midX - tw / 2 - 4 / zoom, midY - 14 / zoom, tw + 8 / zoom, 18 / zoom);
                octx.fillStyle = "#fbbf24";
                octx.textAlign = "center";
                octx.textBaseline = "middle";
                octx.fillText(label, midX, midY - 5 / zoom);
                octx.textAlign = "start";
                octx.textBaseline = "alphabetic";
                octx.restore();
              }
              break;
            case "rect":
              if (currentAction.points.length >= 2) {
                const [a, b] = currentAction.points;
                octx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
              }
              break;
            case "circle":
              if (currentAction.points.length >= 2) {
                const [a, b] = currentAction.points;
                const r = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
                octx.beginPath(); octx.arc(a.x, a.y, r, 0, Math.PI * 2); octx.stroke();
              }
              break;
            case "cone":
              renderCone(octx, currentAction, zoom, GRID_SIZE, M_PER_SQUARE);
              break;
            case "zone":
              renderZone(octx, currentAction, zoom, GRID_SIZE, M_PER_SQUARE);
              break;
            default:
              break;
          }
          octx.restore();
        }

        // Composite the offscreen drawings layer onto main canvas (avec son opacité)
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = drawingsLayer.opacity / 100;
        ctx.drawImage(off, 0, 0);
        ctx.restore();
      }
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
            // __dx/__dy already at target (__t.x/__t.y) — exact landing, no micro-jump
          } else {
            const __e = 1 - Math.pow(1 - __p, 5); // easeOutQuint — smoother arrival
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

        if (token.imageUrl) {
          const img = new window.Image();
          img.src = token.imageUrl;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, halfSize, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, cx - halfSize, cy - halfSize, token.size, token.size);
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

        // ── Conditions badges ──
        if (token.conditions && token.conditions.length > 0) {
          const badgeCount = Math.min(token.conditions.length, 6);
          const badgeSize = 14 / zoom;
          const gap = 2 / zoom;
          const totalW = badgeCount * (badgeSize + gap) - gap;
          let bx = cx - totalW / 2;
          const baseY = token.y + token.size + (token.hp !== undefined ? 20 / zoom : 6 / zoom);

          for (let i = 0; i < badgeCount; i++) {
            const condId = token.conditions![i];
            const cond = CONDITIONS.find(c => c.id === condId);
            if (!cond) { bx += badgeSize + gap; continue; }

            const COND_COLORS: Record<string, string> = {
              desequilibre: "#f97316",
              saignement: "#dc2626",
              brulure: "#ef4444",
              immobilise: "#6366f1",
              peur: "#a855f7",
              corruption: "#7c3aed",
            };
            const badgeColor = COND_COLORS[condId] || "#64748b";

            ctx.save();
            ctx.beginPath();
            ctx.arc(bx + badgeSize / 2, baseY + badgeSize / 2, badgeSize / 2 + 1 / zoom, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(bx + badgeSize / 2, baseY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = badgeColor + "cc";
            ctx.fill();
            ctx.strokeStyle = badgeColor;
            ctx.lineWidth = 1 / zoom;
            ctx.stroke();

            ctx.font = `${badgeSize * 0.7}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(cond.emoji, bx + badgeSize / 2, baseY + badgeSize / 2);
            ctx.textBaseline = "alphabetic";
            ctx.textAlign = "start";
            ctx.restore();

            bx += badgeSize + gap;
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
    wallsHook.drawWalls(ctx, zoom, panOffset, isGM);
    if (fogLayer?.visible) {
      const tmp = document.createElement("canvas");
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const tCtx = tmp.getContext("2d")!;

      // Fond du brouillard
      tCtx.fillStyle = `rgba(0, 0, 0, ${fogLayer.opacity / 100})`;
      tCtx.fillRect(0, 0, tmp.width, tmp.height);

      // Découper les zones révélées (destination-out = effet gomme)
      tCtx.save();
      tCtx.globalCompositeOperation = "destination-out";
      tCtx.fillStyle = "black";

      // ✅ Screen-space pour cohérence taille/position avec brushSize visible
      const revealActions = actions.filter(a => (a.type as string) === "fogReveal");
      for (const ra of revealActions) {
        // Cas spécial : révélation totale
        if (
          ra.points.length === 2 &&
          ra.points[0].x === -9999 &&
          ra.points[1].x === 9999
        ) {
          tCtx.fillRect(0, 0, tmp.width, tmp.height);
          break;
        }
        for (const pt of ra.points) {
          const sx = pt.x * zoom + panOffset.x;
          const sy = pt.y * zoom + panOffset.y;
          const radius = (ra.size * zoom) * 2;
          tCtx.beginPath();
          tCtx.arc(sx, sy, Math.max(radius, 4), 0, Math.PI * 2);
          tCtx.fill();
        }
      }

      // Dessin en cours
      if (currentAction && (currentAction.type as string) === "fogReveal") {
        for (const pt of currentAction.points) {
          const sx = pt.x * zoom + panOffset.x;
          const sy = pt.y * zoom + panOffset.y;
          const radius = (currentAction.size * zoom) * 2;
          tCtx.beginPath();
          tCtx.arc(sx, sy, Math.max(radius, 4), 0, Math.PI * 2);
          tCtx.fill();
        }
      }
      tCtx.restore();

      ctx.drawImage(tmp, 0, 0);
    }

    // ── Lumières dynamiques (composite screen-space) ──────────
    const activeLights = lightsHook.lights.filter(l => l.enabled !== false);
    const showLighting = lightsHook.nightMode || activeLights.length > 0;
    if (showLighting) {
      // Résoudre les positions monde pour chaque lumière (token → x/y du token)
      const resolved = activeLights.map(l => {
        if (l.tokenId) {
          const tk = tokens.find(t => t.id === l.tokenId);
          if (!tk) return null;
          return { light: l, wx: tk.x, wy: tk.y };
        }
        if (typeof l.x === "number" && typeof l.y === "number") {
          return { light: l, wx: l.x, wy: l.y };
        }
        return null;
      }).filter((x): x is { light: LightSource; wx: number; wy: number } => x !== null);

      // Segments bloquants (mur solide + portes fermées) — fenêtres + terrain n'occluent pas
      const blockers: Segment[] = wallsHook.walls
        .filter(w => w.type === "solid" || (w.type === "door" && !w.isOpen))
        .map(w => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 }));

      const tmp2 = document.createElement("canvas");
      tmp2.width = canvas.width;
      tmp2.height = canvas.height;
      const lCtx = tmp2.getContext("2d")!;

      // Fond noir si nuit, sinon transparent
      if (lightsHook.nightMode) {
        lCtx.fillStyle = "rgba(0, 0, 0, 0.82)";
        lCtx.fillRect(0, 0, tmp2.width, tmp2.height);
      }

      // Pour chaque lumière, "punch" un dégradé radial clippé par visibilité
      lCtx.save();
      lCtx.globalCompositeOperation = lightsHook.nightMode ? "destination-out" : "lighter";

      for (const { light, wx, wy } of resolved) {
        const totalR = Math.max(light.brightRadius, light.dimRadius) * GRID_SIZE / M_PER_SQUARE;
        if (totalR <= 0) continue;

        // Polygone de visibilité en coords monde
        const poly = blockers.length > 0
          ? computeVisibilityPolygon(wx, wy, totalR, blockers)
          : [];

        // Transforme en screen-space
        const sx = wx * zoom + panOffset.x;
        const sy = wy * zoom + panOffset.y;
        const sR = totalR * zoom;
        const sBright = light.brightRadius * GRID_SIZE / M_PER_SQUARE * zoom;

        lCtx.save();
        // Clip sur le polygone si on a des murs, sinon cercle plein
        lCtx.beginPath();
        if (poly.length >= 3) {
          for (let i = 0; i < poly.length; i++) {
            const px = poly[i].x * zoom + panOffset.x;
            const py = poly[i].y * zoom + panOffset.y;
            if (i === 0) lCtx.moveTo(px, py);
            else lCtx.lineTo(px, py);
          }
          lCtx.closePath();
        } else {
          lCtx.arc(sx, sy, sR, 0, Math.PI * 2);
        }
        lCtx.clip();

        // Dégradé radial : clair (centre) → faible → 0
        const grad = lCtx.createRadialGradient(sx, sy, 0, sx, sy, sR);
        if (lightsHook.nightMode) {
          // destination-out : alpha = ce qui est gommé
          grad.addColorStop(0, `rgba(0,0,0,${1 * light.intensity})`);
          grad.addColorStop(Math.min(0.99, sBright / sR || 0.4), `rgba(0,0,0,${0.85 * light.intensity})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
        } else {
          // lighter : on additionne la couleur de la lumière
          const c = light.color || "#ffb86b";
          grad.addColorStop(0, hexToRgba(c, 0.45 * light.intensity));
          grad.addColorStop(Math.min(0.99, sBright / sR || 0.4), hexToRgba(c, 0.22 * light.intensity));
          grad.addColorStop(1, hexToRgba(c, 0));
        }
        lCtx.fillStyle = grad;
        lCtx.fillRect(sx - sR, sy - sR, sR * 2, sR * 2);
        lCtx.restore();
      }
      lCtx.restore();

      // ── Vision dynamique des tokens (clarifie en mode nuit) ──
      // Pour chaque token avec visionRadius > 0, on "perce" un disque
      // clippé par les murs : le joueur voit autour de son token.
      if (lightsHook.nightMode) {
        lCtx.save();
        lCtx.globalCompositeOperation = "destination-out";
        for (const tk of tokens) {
          const vr = tk.visionRadius ?? 0;
          if (!tk.visible || vr <= 0) continue;
          const totalR = vr * GRID_SIZE / M_PER_SQUARE;
          const poly = blockers.length > 0
            ? computeVisibilityPolygon(tk.x, tk.y, totalR, blockers)
            : [];
          const sx = tk.x * zoom + panOffset.x;
          const sy = tk.y * zoom + panOffset.y;
          const sR = totalR * zoom;
          lCtx.save();
          lCtx.beginPath();
          if (poly.length >= 3) {
            for (let i = 0; i < poly.length; i++) {
              const px = poly[i].x * zoom + panOffset.x;
              const py = poly[i].y * zoom + panOffset.y;
              if (i === 0) lCtx.moveTo(px, py);
              else lCtx.lineTo(px, py);
            }
            lCtx.closePath();
          } else {
            lCtx.arc(sx, sy, sR, 0, Math.PI * 2);
          }
          lCtx.clip();
          const grad = lCtx.createRadialGradient(sx, sy, 0, sx, sy, sR);
          grad.addColorStop(0, "rgba(0,0,0,1)");
          grad.addColorStop(0.7, "rgba(0,0,0,0.9)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          lCtx.fillStyle = grad;
          lCtx.fillRect(sx - sR, sy - sR, sR * 2, sR * 2);
          lCtx.restore();
        }
        lCtx.restore();
      }

      ctx.drawImage(tmp2, 0, 0);

      // Marqueurs visuels des lumières (MJ uniquement)
      if (isGM) {
        ctx.save();
        for (const { light, wx, wy } of resolved) {
          if (light.tokenId) continue; // ne pas dessiner d'icône sur les tokens
          const sx = wx * zoom + panOffset.x;
          const sy = wy * zoom + panOffset.y;
          ctx.beginPath();
          ctx.arc(sx, sy, 7, 0, Math.PI * 2);
          ctx.fillStyle = light.color;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.stroke();
        }
        ctx.restore();
      }
    }

  }, [actions, currentAction, panOffset, zoom, tokens, layers, selectedTokenId, selectedTokenIds, marquee, draggedToken, dragStart, isGM, gridColor, gridMajorColor, plateauMode, wallsHook.walls, wallsHook.drawWalls, wallsHook.selectedWallId, lightsHook.lights, lightsHook.nightMode, formatMeasure]);

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
      // Ne pas intercepter la molette si elle se produit sur un overlay scrollable
      // (tapis de dés, panneaux, etc.)
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-vtt-allow-scroll]')) return;
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
    let mode: "none" | "pan" | "pinch" | "token" | "draw" | "wall" = "none";
    let lastTouch = { x: 0, y: 0 }, lastDist = 0, lastCenter = { x: 0, y: 0 };
    let activeTokenId: string | null = null, tokenOffset = { x: 0, y: 0 };

    const dist = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const center = (a: Touch, b: Touch) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const po = panOffsetRef.current;
      const z = zoomRef.current;
      return { x: (clientX - rect.left - po.x) / z, y: (clientY - rect.top - po.y) / z };
    };

    const startLongPress = (clientX: number, clientY: number) => {
      longPressActiveRef.current = false;
      longPressStartPosRef.current = { x: clientX, y: clientY };
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        longPressActiveRef.current = true;
        const coords = toWorld(clientX, clientY);
        const hit = findTokenAt(coords.x, coords.y);
        setContextMenu({
          screenX: clientX,
          screenY: clientY,
          worldX: coords.x,
          worldY: coords.y,
          type: hit ? "token" : "canvas",
          tokenId: hit?.id,
        });
      }, 500);
    };
    const cancelLongPress = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
    const hasMoved = (clientX: number, clientY: number) => {
      const dx = clientX - longPressStartPosRef.current.x;
      const dy = clientY - longPressStartPosRef.current.y;
      return Math.hypot(dx, dy) > 8;
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const t = e.touches[0];
        lastTouch = { x: t.clientX, y: t.clientY };
        startLongPress(t.clientX, t.clientY);

        // Wall tools (GM)
        if (tool === "wall" || tool === "wallDoor" || tool === "wallWindow" || tool === "wallTerrain") {
          const w = toWorld(t.clientX, t.clientY);
          const wType = tool === "wallDoor" ? "door" : tool === "wallWindow" ? "window" : tool === "wallTerrain" ? "terrain" : "solid";
          wallsHook.startWall(w.x, w.y, wType);
          mode = "wall"; return;
        }
        if (tool === "wallDelete") {
          const w = toWorld(t.clientX, t.clientY);
          wallsHook.deleteWallAt(w.x, w.y, Math.max(16, 24 / zoom));
          mode = "none"; return;
        }
        // Light tools (GM)
        if (tool === "light") {
          const w = toWorld(t.clientX, t.clientY);
          const hit = findTokenAt(w.x, w.y);
          if (hit) lightsHook.addLightToToken(hit.id, lightsHook.selectedPreset);
          else lightsHook.addLightAt(w.x, w.y, lightsHook.selectedPreset);
          mode = "none"; return;
        }
        if (tool === "lightDelete") {
          const w = toWorld(t.clientX, t.clientY);
          const removed = lightsHook.deleteLightAt(w.x, w.y, Math.max(20, 32 / zoom));
          if (!removed) {
            const hit = findTokenAt(w.x, w.y);
            if (hit) {
              const attached = lightsHook.lights.find(l => l.tokenId === hit.id);
              if (attached) lightsHook.deleteLightById(attached.id);
            }
          }
          mode = "none"; return;
        }
        // Ping
        if (tool === "ping") {
          const w = toWorld(t.clientX, t.clientY);
          broadcastPing(w.x, w.y);
          mode = "none"; return;
        }
        // Text
        if (tool === "text") {
          const w = toWorld(t.clientX, t.clientY);
          const text = prompt("Texte à ajouter :");
          if (text) {
            const action: DrawAction = { id: newId(), type: "text", points: [w], color, size: brushSize, text, layer: activeDrawLayer };
            setActions(prev => prev.some(a => a.id === action.id) ? prev : [...prev, action]);
            setUndoneActions([]);
          }
          mode = "none"; return;
        }

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
        if (["line", "rect", "circle", "pencil", "eraser", "cone", "zone", "fogReveal"].includes(tool)) {
          const w = toWorld(t.clientX, t.clientY);
          const layer = (tool as string) === "fogReveal" ? "fog" : activeDrawLayer;
          setCurrentAction({ id: newId(), type: tool, points: [w], color, size: brushSize, layer });
          setIsDrawing(true); mode = "draw"; return;
        }
        mode = "pan";
      } else if (e.touches.length === 2) {
        cancelLongPress();
        if (mode === "draw") { setCurrentAction(null); setIsDrawing(false); }
        if (mode === "wall") { wallsHook.cancelWall?.(); }
        mode = "pinch";
        lastDist = dist(e.touches[0], e.touches[1]);
        lastCenter = center(e.touches[0], e.touches[1]);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const t = e.touches[0];
        if (hasMoved(t.clientX, t.clientY)) cancelLongPress();
      } else {
        cancelLongPress();
      }
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
      if (mode === "wall" && e.touches.length === 1) {
        const t = e.touches[0];
        const w = toWorld(t.clientX, t.clientY);
        wallsHook.updateWallPreview(w.x, w.y);
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
          const po = panOffsetRef.current;
          const wx = (cx - po.x) / prev, wy = (cy - po.y) / prev;
          setPanOffset({ x: cx - wx * next + newCenter.x - lastCenter.x, y: cy - wy * next + newCenter.y - lastCenter.y });
          return next;
        });
        lastDist = newDist; lastCenter = newCenter;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      cancelLongPress();
      if (longPressActiveRef.current) {
        longPressActiveRef.current = false;
        if (e.touches.length === 0) { mode = "none"; activeTokenId = null; setDraggedToken(null); }
        return;
      }
      if (e.touches.length === 0) {
        if (mode === "draw") {
          setCurrentAction(prev => {
            if (prev) { setActions(a => a.some(x => x.id === prev.id) ? a : [...a, prev]); setUndoneActions([]); }
            return null;
          });
          setIsDrawing(false);
        }
        if (mode === "wall") {
          const last = lastTouch;
          const w = toWorld(last.x, last.y);
          wallsHook.finishWall(w.x, w.y);
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
      cancelLongPress();
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [tool, layers, collisionEnabled, color, brushSize, activeDrawLayer, snapToGrid, zoom, wallsHook, broadcastPing]);

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
      // Wall undo/redo (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y) — only when a wall tool is active
      if ((e.ctrlKey || e.metaKey) && isGM && (tool === "wall" || tool === "wallDoor" || tool === "wallWindow" || tool === "wallTerrain" || tool === "wallDelete")) {
        const k = e.key.toLowerCase();
        if (k === "z" && !e.shiftKey) { e.preventDefault(); wallsHook.undo(); return; }
        if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); wallsHook.redo(); return; }
      }
      // Delete / Backspace : supprimer le mur sélectionné (MJ uniquement, hors saisie)
      if (isGM && (e.key === "Delete" || e.key === "Backspace") && wallsHook.selectedWallId && !selectedTokenId) {
        e.preventDefault();
        wallsHook.deleteWallById(wallsHook.selectedWallId);
        return;
      }
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === "v" || e.key === "V") setTool("move");
        else if (e.key === "p" || e.key === "P") setTool("pencil");
        else if (e.key === "e" || e.key === "E") setTool("eraser");
        else if (e.key === "m" || e.key === "M") setTool("measure");
        else if (e.key === "t" || e.key === "T") setTool("text");
        else if (e.key === "c" || e.key === "C") setTool("cone");
        else if (e.key === "z" || e.key === "Z") setTool("zone");
        else if (e.key === "g" || e.key === "G") setSnapToGrid(s => !s);
        else if (isGM && (e.key === "w" || e.key === "W")) setTool("wall");
        else if (isGM && (e.key === "d" || e.key === "D")) setTool("wallDoor");
        // Zoom raccourcis clavier : +, -, 0 (reset)
        else if (e.key === "+" || e.key === "=") { e.preventDefault(); setZoom(prev => Math.min(MAX_ZOOM, prev + 0.15)); }
        else if (e.key === "-" || e.key === "_") { e.preventDefault(); setZoom(prev => Math.max(MIN_ZOOM, prev - 0.15)); }
        else if (e.key === "0") { e.preventDefault(); setZoom(1); setPanOffset({ x: 0, y: 0 }); }
        else if (e.key === "?" || (e.shiftKey && e.key === "/")) { e.preventDefault(); setShortcutsHelpOpen(v => !v); }
        else if (e.key === "Escape") {
          setContextMenu(null);
          setShortcutsHelpOpen(false);
          if (fullscreen) setFullscreen(false);
          if (tool === "wall" || tool === "wallDoor" || tool === "wallWindow" || tool === "wallTerrain") wallsHook.cancelWall();
        }
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

    // Clic droit sur un mur (sans token sous le curseur, MJ uniquement)
    if (!tokenHit && isGM) {
      const hitWallId = wallsHook.selectWallAt(coords.x, coords.y, 15 / zoom);
      if (hitWallId) {
        const hitWall = wallsHook.walls.find(w => w.id === hitWallId);
        // Porte → bascule ouvert/fermé (au lieu de supprimer)
        if (hitWall?.type === "door") {
          wallsHook.toggleDoor(hitWall.id);
          toast({ title: hitWall.isOpen ? "Porte fermée" : "Porte ouverte" });
          return;
        }
        // Autres types → suppression rapide
        wallsHook.deleteWallAt(coords.x, coords.y, 15 / zoom);
        toast({ title: "Mur supprimé", description: "Clic droit sur un mur = suppression rapide." });
        return;
      }
    }

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

    if (tool === "wall" || tool === "wallDoor" || tool === "wallWindow" || tool === "wallTerrain") {
      // Si on clique sur une porte existante avec l'outil porte → bascule ouvert/fermé
      if (tool === "wallDoor") {
        const hitId = wallsHook.selectWallAt(coords.x, coords.y, 15 / zoom);
        const hitWall = hitId ? wallsHook.walls.find(w => w.id === hitId) : null;
        if (hitWall && hitWall.type === "door") {
          wallsHook.toggleDoor(hitWall.id);
          toast({ title: hitWall.isOpen ? "Porte fermée" : "Porte ouverte" });
          return;
        }
      }
      const wType = tool === "wallDoor" ? "door" : tool === "wallWindow" ? "window" : tool === "wallTerrain" ? "terrain" : "solid";
      wallsHook.startWall(coords.x, coords.y, wType);
      return;
    }
    if (tool === "wallDelete") {
      wallsHook.deleteWallAt(coords.x, coords.y, Math.max(12, 20 / zoom));
      return;
    }

    // Light tools (GM)
    if (tool === "light") {
      const hit = findTokenAt(coords.x, coords.y);
      if (hit) {
        lightsHook.addLightToToken(hit.id, lightsHook.selectedPreset);
        toast({ title: "Lumière attachée", description: `${LIGHT_PRESET_LABELS[lightsHook.selectedPreset === "custom" ? "torch" : lightsHook.selectedPreset]} sur ${hit.name}` });
      } else {
        lightsHook.addLightAt(coords.x, coords.y, lightsHook.selectedPreset);
      }
      return;
    }
    if (tool === "lightDelete") {
      const removed = lightsHook.deleteLightAt(coords.x, coords.y, Math.max(18, 28 / zoom));
      if (!removed) {
        // Aussi essayer sur un token : retirer toute lumière qui lui est attachée
        const hit = findTokenAt(coords.x, coords.y);
        if (hit) {
          const attached = lightsHook.lights.find(l => l.tokenId === hit.id);
          if (attached) lightsHook.deleteLightById(attached.id);
        }
      }
      return;
    }


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
          // Track click for sheet/access-denied detection
          clickStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), tokenId: tokenHit.id, denied: !canSel };
          didDragRef.current = false;
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
        // Click-vs-drag detection: simple click on own token = open sheet
        clickStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), tokenId: tokenHit.id, denied: false };
        didDragRef.current = false;
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
      // Bascule une porte si on clique dessus (MJ)
      if (isGM) {
        const hitId = wallsHook.selectWallAt(coords.x, coords.y, 15 / zoom);
        const hitWall = hitId ? wallsHook.walls.find(w => w.id === hitId) : null;
        if (hitWall && hitWall.type === "door") {
          wallsHook.toggleDoor(hitWall.id);
          toast({ title: hitWall.isOpen ? "Porte fermée" : "Porte ouverte" });
          return;
        }
      }
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
    if ((tool === "wall" || tool === "wallDoor" || tool === "wallWindow" || tool === "wallTerrain") && wallsHook.drawingStart.current) {
      const w = getCanvasCoords(e);
      wallsHook.updateWallPreview(w.x, w.y);
      // Throttle rAF ajustable : skip frames selon le réglage utilisateur
      if (wallPreviewRafRef.current == null) {
        wallPreviewRafRef.current = requestAnimationFrame(() => {
          wallPreviewRafRef.current = null;
          wallPreviewFrameRef.current++;
          const skip = wallRafThrottleRef.current;
          if (skip <= 0 || wallPreviewFrameRef.current % (skip + 1) === 0) {
            redrawCanvasRef.current();
          }
        });
      }
      return;
    }
    // Track movement for click-vs-drag detection on tokens
    if (clickStartRef.current && !didDragRef.current) {
      const dx = e.clientX - clickStartRef.current.x;
      const dy = e.clientY - clickStartRef.current.y;
      if (dx * dx + dy * dy > 25) didDragRef.current = true;
    }
    if (!isDrawing) return;
    if (draggedToken) {
      const coords = getCanvasCoords(e);
      const draggedT = tokens.find(t => t.id === draggedToken);
      if (!draggedT) return;
      // Free follow during drag (no snap) — snapping happens on release with a slide animation
      const nextX = coords.x - tokenDragOffset.x;
      const nextY = coords.y - tokenDragOffset.y;
      // Bloque la traversée des murs/portes fermées
      if (crossesBlocker(draggedT.x, draggedT.y, nextX, nextY)) return;
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

  const handleMouseUp = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    if ((tool === "wall" || tool === "wallDoor" || tool === "wallWindow" || tool === "wallTerrain") && wallsHook.drawingStart.current && e) {
      const w = getCanvasCoords(e);
      wallsHook.finishWall(w.x, w.y);
      return;
    }
    // ── Click vs drag: simple click on a token opens the character sheet ──
    const pendingClick = clickStartRef.current;
    const wasClick =
      !!pendingClick && !didDragRef.current && Date.now() - pendingClick.t < 500;
    clickStartRef.current = null;
    didDragRef.current = false;
    if (wasClick && pendingClick) {
      const tok = tokens.find(t => t.id === pendingClick.tokenId);
      // Reset any pending drag/pan state cleanly
      setDraggedToken(null);
      setDragStart(null);
      setIsDrawing(false);
      setLastPanPoint(null);
      if (tok) {
        if (pendingClick.denied) {
          toast({
            title: "Accès refusé",
            description: "Cette fiche ne vous appartient pas",
            variant: "destructive",
          });
        } else if (perms.canSelectToken(tok)) {
          openTokenSheet(tok);
        }
      }
      return;
    }
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
        // Si le snap fait traverser un mur/porte fermée, on garde la position libre actuelle
        if (crossesBlocker(t.x, t.y, sx, sy)) { nx = t.x; ny = t.y; }
        if (collisionEnabled) {
          const overlaps = prev.some(o =>
            o.id !== id && o.visible &&
            tokensOverlap({ x: nx, y: ny, size: t.size }, { x: o.x, y: o.y, size: o.size })
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
    if (!confirm("Effacer tout le plateau ? (dessins, tokens, murs, lumières)")) return;
    tokens.forEach(t => deletedTokenIdsRef.current.add(t.id));
    setActions([]); setUndoneActions([]); setTokens([]); setPanOffset({ x: 0, y: 0 }); setZoom(1);
    mapImageRef.current = null;
    setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: undefined } : l));
    try { wallsHook.clearAllWalls?.(); } catch {}
    try { lightsHook.clearAllLights?.(); } catch {}
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
    // Synchronise immédiatement la carte côté serveur pour que les autres
    // utilisateurs (et le rechargement) voient la même scène.
    saveState({ map_image_url: scene.mapImageUrl ?? null }, { immediate: true });
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
    if (tool === "light" || tool === "lightDelete") return "cell";
    return "crosshair";
  };

  const selectedToken = useMemo(
    () => tokens.find(t => t.id === selectedTokenId),
    [tokens, selectedTokenId]
  );

  // ── Tool definitions (rangés par catégorie) ──
  const TOOLS = useMemo<{ id: Tool; icon: React.ReactNode; label: string; key?: string; gmOnly?: boolean; group: string }[]>(() => [
    { id: "move",      icon: <FIMove className="h-4 w-4" />,        label: "Déplacer",     key: "V", group: "nav" },
    { id: "ping",      icon: <FIPing className="h-4 w-4" />,        label: "Ping",                   group: "nav" },
    { id: "pencil",    icon: <FIQuill className="h-4 w-4" />,       label: "Crayon",       key: "P", group: "draw" },
    { id: "eraser",    icon: <FIEraser className="h-4 w-4" />,      label: "Gomme",        key: "E", group: "draw" },
    { id: "rect",      icon: <FIRect className="h-4 w-4" />,        label: "Rectangle",              group: "draw" },
    { id: "circle",    icon: <FICircle className="h-4 w-4" />,      label: "Cercle",                 group: "draw" },
    { id: "text",      icon: <FIText className="h-4 w-4" />,        label: "Texte",        key: "T", group: "draw" },
    { id: "measure",   icon: <FIMeasure className="h-4 w-4" />,     label: "Mesure distance", key: "M", group: "measure" },
    { id: "cone",      icon: <FICone className="h-4 w-4" />,        label: "Cône AoE",    key: "C", group: "aoe" },
    { id: "zone",      icon: <FIZone className="h-4 w-4" />,        label: "Zone AoE",    key: "Z", group: "aoe" },
    { id: "fogReveal", icon: <FIEye className="h-4 w-4" />,         label: "Révéler brouillard", gmOnly: true, group: "gm" },
    { id: "wall",        icon: <FIWall className="h-4 w-4" />,             label: "Mur solide",     key: "W", gmOnly: true, group: "gm" },
    { id: "wallDoor",    icon: <FIDoor className="h-4 w-4" />,             label: "Porte",          key: "D", gmOnly: true, group: "gm" },
    { id: "wallWindow",  icon: <FIWindow className="h-4 w-4" />,           label: "Fenêtre",        gmOnly: true, group: "gm" },
    { id: "wallTerrain", icon: <FIBriars className="h-4 w-4" />,           label: "Terrain difficile", gmOnly: true, group: "gm" },
    { id: "wallDelete",  icon: <FIWallBreak className="h-4 w-4" />,        label: "Effacer mur",    gmOnly: true, group: "gm" },
    { id: "light",       icon: <FITorch className="h-4 w-4" />,      label: "Lumière",      gmOnly: true, group: "light" },
    { id: "lightDelete", icon: <FITorchOff className="h-4 w-4" />,   label: "Retirer lumière", gmOnly: true, group: "light" },
  ], []);

  // Catégories d'outils (dossiers dépliables)
  const TOOL_GROUPS = useMemo<{ id: string; label: string; icon: React.ReactNode; gmOnly?: boolean }[]>(() => [
    { id: "nav",     label: "Navigation",    icon: <FIMove className="h-4 w-4" /> },
    { id: "draw",    label: "Dessin",        icon: <FIQuill className="h-4 w-4" /> },
    { id: "measure", label: "Mesure",        icon: <FIMeasure className="h-4 w-4" /> },
    { id: "aoe",     label: "Zones d'effet", icon: <FIZone className="h-4 w-4" /> },
    { id: "gm",      label: "Outils MJ",     icon: <FIHelm className="h-4 w-4" />, gmOnly: true },
    { id: "light",   label: "Lumières",      icon: <FITorch className="h-4 w-4" />, gmOnly: true },
  ], []);

  const visibleTools = useMemo(() => {
    let list = TOOLS.filter(t => !t.gmOnly || isGM);
    if (isMobilePlayer) {
      const allowed = new Set(["move", "pencil", "eraser"]);
      list = list.filter(t => allowed.has(t.id));
    } else if (isMobileGM) {
      // Hide walls + dynamic lights on mobile GM
      const hidden = new Set(["wall", "wallDoor", "wallWindow", "wallTerrain", "wallDelete", "light", "lightDelete"]);
      list = list.filter(t => !hidden.has(t.id));
    }
    return list;
  }, [TOOLS, isGM, isMobilePlayer, isMobileGM]);

  // ── Context menu actions ──
  const ctxToken = useMemo(
    () => contextMenu?.type === "token" ? tokens.find(t => t.id === contextMenu.tokenId) : undefined,
    [contextMenu, tokens]
  );

  // ── Layout: fullscreen vs embedded ──
  // z-[60] : au-dessus du Header sticky (z-50) et de la bottom nav mobile (z-40).
  // Les Popover/Dropdown sont remontés à z-[70] dans popover.tsx pour rester visibles.
  const containerClass = fullscreen
    ? "fixed inset-0 z-[60] flex flex-col bg-background"
    : "flex h-[calc(100svh-120px)] sm:h-[calc(100vh-200px)] min-h-[420px] sm:min-h-[500px] flex-col";

  const currentTurnEntry = initiativeActiveIdx >= 0 ? initiative[initiativeActiveIdx] : null;

  return (
    <div className={containerClass}>

      {isMobileGM && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 mx-2 mt-2 px-3 py-2 text-xs text-amber-400">
          <Smartphone className="h-3.5 w-3.5 shrink-0" />
          <span>Mode mobile MJ — fonctions avancées (murs, lumières, tableaux) disponibles uniquement sur desktop.</span>
        </div>
      )}

      {isMobilePlayer && currentTurnEntry && (
        <div className="flex items-center justify-center gap-2 border-b border-border/60 bg-card/80 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">Tour de :</span>
          <span className="font-semibold text-primary">{currentTurnEntry.name}</span>
          <span className="text-[10px] text-muted-foreground">(round {initiativeRound})</span>
        </div>
      )}


      {/* ── TOP TOOLBAR ────────────────────────────────────── */}
      <div className="flex shrink-0 flex-nowrap sm:flex-wrap items-center gap-1 border-b border-border bg-card/95 px-2 py-1 backdrop-blur-sm overflow-x-auto sm:overflow-x-visible scrollbar-thin">

        {/* Zoom */}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} title="Dézoomer">
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <button onClick={resetView}
          className="min-w-[40px] rounded px-1 text-xs font-medium text-muted-foreground hover:bg-muted"
          title="Réinitialiser la vue">
          {Math.round(zoom * 100)}%
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} title="Zoomer (+)">
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShortcutsHelpOpen(true)} title="Raccourcis clavier (?)">
          <Keyboard className="h-3.5 w-3.5" />
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

        {/* Measure unit (GM only) */}
        {isGM && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-1.5 text-[10px] font-semibold"
                title="Unité de la règle">
                <Ruler className="h-3.5 w-3.5" />
                <span className="uppercase">{measureUnit === "cases" ? "□" : measureUnit}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-2" side="bottom" align="start" style={{ zIndex: 9999 }}>
              <div className="space-y-1">
                <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Unité de mesure
                </div>
                {([
                  { id: "m",     label: "Mètres (1,5 m / case)" },
                  { id: "ft",    label: "Pieds (5 ft / case)" },
                  { id: "cases", label: "Cases (brut)" },
                  { id: "km",    label: "Kilomètres" },
                ] as { id: MeasureUnit; label: string }[]).map(o => (
                  <button
                    key={o.id}
                    onClick={() => setMeasureUnit(o.id)}
                    className={`w-full rounded px-2 py-1 text-left text-xs hover:bg-muted ${
                      measureUnit === o.id ? "bg-primary/20 font-semibold text-primary" : ""
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}


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

        {/* Documents PDF — partage en pop-up */}
        {isGM && (
          <MediaPickerDialog
            fileType="document"
            campaignId={campaignId}
            title="Partager un document PDF"
            onSelect={(asset) => {
              if (asset.mime !== "application/pdf") {
                toast({ title: "Format non supporté", description: "Seuls les PDF peuvent être ouverts en fenêtre pop-up.", variant: "destructive" });
                return;
              }
              shareDocument({ id: asset.id, name: asset.name, storage_path: asset.storage_path });
            }}
            trigger={
              <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" title="Partager un PDF en fenêtre pop-up">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">PDF</span>
                {sharedDocs.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-amber-500/40 px-1 text-[9px] font-bold">{sharedDocs.length}</span>
                )}
              </Button>
            }
          />
        )}



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
            <PopoverContent className="w-72 p-3" side="bottom" align="start" style={{ zIndex: 9999 }}>
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

        {/* Calques — ouvre le panneau flottant LayersPanel (nouveau système) */}
        {!isMobilePlayer && onToggleLayers && (
          <Button
            variant={layersOpen ? "default" : "outline"}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={onToggleLayers}
            title="Calques"
            aria-pressed={!!layersOpen}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Calques</span>
          </Button>
        )}

        {/* Carte & jetons */}
        {!isMobilePlayer && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Carte</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" side="bottom" align="start" style={{ zIndex: 9999 }}>
            <div className="space-y-3">

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
                    <>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Taille de la carte</span>
                          <span className="font-mono text-primary">
                            {Math.round(((layers.find(l => l.id === "map")?.scale ?? 1) * 100))}%
                          </span>
                        </div>
                        <Slider
                          value={[Math.round(((layers.find(l => l.id === "map")?.scale ?? 1) * 100))]}
                          min={10}
                          max={400}
                          step={5}
                          onValueChange={(v) => {
                            const next = (v[0] ?? 100) / 100;
                            setLayers(prev => prev.map(l => l.id === "map" ? { ...l, scale: next } : l));
                          }}
                        />
                        <div className="flex justify-between gap-1">
                          <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px]"
                            onClick={() => setLayers(prev => prev.map(l => l.id === "map" ? { ...l, scale: 1 } : l))}>
                            Réinitialiser
                          </Button>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" className="w-full h-7 text-xs" onClick={() => {
                        mapImageRef.current = null;
                        setLayers(prev => prev.map(l => l.id === "map" ? { ...l, imageUrl: undefined, scale: 1 } : l));
                        saveState({ map_image_url: null });
                      }}>
                        <X className="mr-1 h-3 w-3" /> Retirer la carte
                      </Button>
                    </>
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
                      <PopoverContent className="w-auto p-2" style={{ zIndex: 9999 }}>
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
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Keyboard hint */}
        <div className="hidden lg:flex items-center gap-1 rounded bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          F=plein écran • V=déplacer • P=crayon • C=cône • Z=zone
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* GM Panel toggle */}
        {!isMobilePlayer && (
        <Button variant={gmPanelOpen ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => setGmPanelOpen(o => !o)}
          title={gmPanelOpen ? "Fermer le panneau" : "Ouvrir le panneau MJ"}>
          {gmPanelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRight className="h-3.5 w-3.5" />}
        </Button>
        )}

        {/* Fullscreen toggle */}
        <Button variant={fullscreen ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => setFullscreen(f => !f)} title={fullscreen ? "Quitter plein écran (F)" : "Plein écran (F)"}>
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>

        {/* Connection / sync status — discret en bout de toolbar */}
        <div className="ml-auto flex items-center pr-1">
          <ConnectionStatus
            status={connectionStatus}
            isSaving={isSaving}
            isDirty={isDirty}
            lastSavedAt={lastSavedAt}
          />
        </div>
      </div>

      {/* ── MAIN AREA ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT VERTICAL TOOLBAR ── */}
        <div
          className="flex w-11 sm:w-12 shrink-0 flex-col items-center gap-1 border-r border-amber-500/25 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(217,164,65,0.10),transparent_60%),linear-gradient(to_bottom,rgba(20,16,12,0.92),rgba(14,11,8,0.92))] shadow-[inset_-1px_0_0_rgba(217,164,65,0.12),inset_1px_0_0_rgba(0,0,0,0.35)] overflow-y-auto overflow-x-hidden py-2 max-h-full"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin" }}
        >

          {TOOL_GROUPS.filter(g => !g.gmOnly || isGM).map((group, idx, arr) => {
            const groupTools = visibleTools.filter(t => t.group === group.id);
            if (groupTools.length === 0) return null;
            const activeTool = groupTools.find(t => t.id === tool);
            const activeCls =
              "bg-gradient-to-b from-amber-400/35 via-amber-500/25 to-amber-700/20 text-amber-200 ring-1 ring-amber-300/60 shadow-[0_0_12px_rgba(217,164,65,0.45),inset_0_1px_0_rgba(255,220,150,0.35)]";
            const idleCls =
              "text-amber-100/55 hover:bg-amber-400/10 hover:text-amber-100 hover:ring-1 hover:ring-amber-400/25";
            const btnBase =
              "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[7px] transition-all duration-150";

            const node = groupTools.length === 1 ? (
              <button
                key={group.id}
                onClick={() => setTool(groupTools[0].id)}
                title={groupTools[0].key ? `${groupTools[0].label} (${groupTools[0].key})` : groupTools[0].label}
                className={`${btnBase} ${tool === groupTools[0].id ? activeCls : idleCls}`}
              >
                {groupTools[0].icon}
              </button>
            ) : (
              <Popover
                key={group.id}
                open={openGroup === group.id}
                onOpenChange={(o) => setOpenGroup(o ? group.id : null)}
              >
                <PopoverTrigger asChild>
                  <button
                    title={group.label}
                    className={`relative ${btnBase} ${activeTool ? activeCls : idleCls}`}
                  >
                    {activeTool ? activeTool.icon : group.icon}
                    <span className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-amber-300/70 shadow-[0_0_3px_rgba(255,200,120,0.7)]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="w-auto border border-amber-500/30 bg-[linear-gradient(to_bottom,rgba(24,19,14,0.98),rgba(16,12,9,0.98))] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_0_1px_rgba(217,164,65,0.15)]" style={{ zIndex: 9999 }}>
                  <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-300/80" style={{ fontFamily: "'Cinzel', serif" }}>
                    {group.label}
                  </div>
                  <div className="flex gap-1">
                    {groupTools.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setTool(t.id); setOpenGroup(null); }}
                        title={t.key ? `${t.label} (${t.key})` : t.label}
                        className={`${btnBase} ${tool === t.id ? activeCls : idleCls}`}
                      >
                        {t.icon}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            );

            // Séparateur runique entre groupes
            const sep = idx < arr.length - 1 ? (
              <div key={`${group.id}-sep`} className="my-0.5 h-px w-6 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            ) : null;

            return <>{node}{sep}</>;
          })}

          {/* Panneau Lumières — visible si outil light/lightDelete actif */}
          {isGM && (tool === "light" || tool === "lightDelete") && (
            <>
              <div className="my-1 w-7 border-t border-border/50" />
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    title={`Preset: ${LIGHT_PRESET_LABELS[lightsHook.selectedPreset === "custom" ? "torch" : lightsHook.selectedPreset]}`}
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md hover:bg-muted text-amber-400 transition-colors"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" className="w-52 p-2" style={{ zIndex: 9999 }}>
                  <p className="text-xs font-semibold mb-2 text-amber-400">Type de lumière</p>
                  <div className="space-y-1">
                    {(Object.keys(LIGHT_PRESETS) as Array<keyof typeof LIGHT_PRESETS>).map(k => {
                      const preset = LIGHT_PRESETS[k];
                      const active = lightsHook.selectedPreset === k;
                      return (
                        <button
                          key={k}
                          onClick={() => lightsHook.setSelectedPreset(k as LightPreset)}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                            active ? "bg-primary/15 text-primary" : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: preset.color }} />
                          <span className="flex-1 text-left">{LIGHT_PRESET_LABELS[k]}</span>
                          <span className="text-[10px] opacity-60">{preset.brightRadius}/{preset.dimRadius}m</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <button
                title={lightsHook.nightMode ? "Désactiver le mode nuit" : "Activer le mode nuit"}
                onClick={() => lightsHook.setNightMode(!lightsHook.nightMode)}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md transition-colors ${
                  lightsHook.nightMode
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Moon className="h-4 w-4" />
              </button>

              <button
                title={`Supprimer toutes les lumières (${lightsHook.lights.length})`}
                onClick={() => {
                  if (lightsHook.lights.length === 0) return;
                  if (confirm(`Supprimer ${lightsHook.lights.length} lumière(s) ?`)) lightsHook.clearAllLights();
                }}
                disabled={lightsHook.lights.length === 0}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Boutons fog supplémentaires — visibles uniquement si fogReveal actif */}
          {isGM && tool === "fogReveal" && (
            <>
              <div className="my-1 w-7 border-t border-border/50" />
              <div className="flex flex-col items-center gap-1 px-1">
                <span className="text-[9px] text-muted-foreground">Pinceau</span>
                <Slider
                  value={[brushSize]}
                  onValueChange={([v]) => setBrushSize(v)}
                  min={1}
                  max={15}
                  step={1}
                  className="w-8 h-16"
                  orientation="vertical"
                />
                <span className="text-[9px] text-muted-foreground">{brushSize}</span>
              </div>
              <button
                title="Révéler toute la carte"
                onClick={() => {
                  const fullReveal: DrawAction = {
                    id: newId(),
                    type: "fogReveal" as Tool,
                    points: [
                      { x: -9999, y: -9999 },
                      { x: 9999, y: 9999 },
                    ],
                    color: "black",
                    size: 99999,
                    layer: "fog",
                  };
                  setActions(prev => {
                    const updated = [...prev, fullReveal];
                    saveState({ drawings: updated });
                    return updated;
                  });
                }}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                title="Remettre tout le brouillard"
                onClick={() => {
                  setActions(prev => {
                    const updated = prev.filter(a => (a.type as string) !== "fogReveal");
                    saveState({ drawings: updated });
                    return updated;
                  });
                }}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </>
          )}

          {isGM && !isMobile && (
            <WallsToolbar
              selectedWallType={wallsHook.selectedWallType}
              onSelectType={wallsHook.setSelectedWallType}
              onClearAll={wallsHook.clearAllWalls}
              wallCount={wallsHook.walls.length}
              activeTool={tool}
              onUndo={wallsHook.undo}
              onRedo={wallsHook.redo}
              canUndo={wallsHook.canUndo}
              canRedo={wallsHook.canRedo}
              rafThrottle={wallRafThrottle}
              onRafThrottleChange={setWallRafThrottle}
              doorsOpen={wallsHook.walls.filter(w => w.type === "door" && w.isOpen).length}
              doorsClosed={wallsHook.walls.filter(w => w.type === "door" && !w.isOpen).length}
              onOpenAllDoors={() => wallsHook.setAllDoorsOpen(true)}
              onCloseAllDoors={() => wallsHook.setAllDoorsOpen(false)}
            />
          )}


          <div className="my-1 w-7 border-t border-border/50" />

          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
                title="Couleur"
              >
                <div className="h-5 w-5 rounded-full border-2 border-white/20 shadow-md" style={{ backgroundColor: color }} />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-auto p-2" style={{ zIndex: 9999 }}>
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
              <button className="flex h-8 w-8 sm:h-9 sm:w-9 flex-col items-center justify-center gap-0 rounded-md hover:bg-muted text-muted-foreground transition-colors" title="Taille du pinceau">
                <Minus className="h-2.5 w-2.5" />
                <span className="text-[9px] font-bold leading-tight">{brushSize}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-40 p-3" style={{ zIndex: 9999 }}>
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
            const types = e.dataTransfer.types;
            if (
              types.includes("application/x-aetheria-char") ||
              types.includes("application/x-aetheria-creature") ||
              types.includes("application/x-aetheria-wa") ||
              types.includes("application/x-aetheria-monster")
            ) {
              e.preventDefault(); e.dataTransfer.dropEffect = "copy";
              if (!isDragOverCanvas) setIsDragOverCanvas(true);
            }
          }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setIsDragOverCanvas(false); }}
          onDrop={(e) => {
            setIsDragOverCanvas(false); setDraggingCharId(null);
            const charId = e.dataTransfer.getData("application/x-aetheria-char");
            if (charId) {
              const char = userCharacters.find((c: any) => c.id === charId);
              if (char) { e.preventDefault(); spawnCharacterAt(char, e.clientX, e.clientY); }
              return;
            }
            const world = clientToWorld(e.clientX, e.clientY);
            if (!world) return;
            const aetId = e.dataTransfer.getData("application/x-aetheria-creature");
            if (aetId) {
              const c = (aetheriaCreatures as any[]).find((x: any) => x.id === aetId);
              if (c) { e.preventDefault(); spawnAetheriaCreature(c, world.x, world.y); }
              return;
            }
            const waId = e.dataTransfer.getData("application/x-aetheria-wa");
            if (waId) {
              const c = (waCreatures as any[]).find((x: any) => x.id === waId);
              if (c) { e.preventDefault(); spawnWACreature(c, world.x, world.y); }
              return;
            }
            const monId = e.dataTransfer.getData("application/x-aetheria-monster");
            if (monId) {
              const m = (systemMonsters as any[]).find((x: any) => x.id === monId);
              if (m) { e.preventDefault(); spawnSystemMonster(m, world.x, world.y); }
              return;
            }
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
            {lightsHook.nightMode && <span className="text-indigo-300" title="Mode nuit">🌙</span>}
            {lightsHook.lights.length > 0 && <span className="text-amber-300" title={`${lightsHook.lights.length} lumière(s)`}>💡</span>}
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
              onUpdateToken={ctxToken ? updateToken : undefined}
              hasClipboard={hasClipboard}
            />
          )}

          {/* Raccourcis clavier — modal */}
          {shortcutsHelpOpen && (
            <div
              className="absolute inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShortcutsHelpOpen(false)}
            >
              <div
                className="max-h-[85vh] w-[min(560px,92vw)] overflow-y-auto rounded-lg border border-primary/30 bg-card p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-lg font-semibold">Raccourcis clavier</h3>
                  </div>
                  <button onClick={() => setShortcutsHelpOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <section>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outils</h4>
                    <ul className="space-y-1">
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">V</kbd> Déplacer</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">P</kbd> Crayon</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">E</kbd> Gomme</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">M</kbd> Mesure</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">T</kbd> Texte</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">C</kbd> Cône · <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Z</kbd> Zone</li>
                      {isGM && <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">W</kbd> Mur · <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">D</kbd> Porte</li>}
                    </ul>
                  </section>
                  <section>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vue</h4>
                    <ul className="space-y-1">
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">+</kbd> / <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">-</kbd> Zoom</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">0</kbd> Réinitialiser la vue</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Espace</kbd> Maintenir pour panner</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">F</kbd> Plein écran</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">G</kbd> Magnétisme grille</li>
                    </ul>
                  </section>
                  <section>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jeton sélectionné</h4>
                    <ul className="space-y-1">
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">← ↑ → ↓</kbd> Déplacer d'une case</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Shift</kbd> + flèche = 5 cases</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">r</kbd>/<kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">R</kbd> Rotation ±15°</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">F</kbd> Centrer la vue</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Suppr</kbd> Supprimer</li>
                    </ul>
                  </section>
                  <section>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Édition</h4>
                    <ul className="space-y-1">
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Ctrl</kbd>+<kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Z</kbd> Annuler</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Ctrl</kbd>+<kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Y</kbd> Rétablir</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Ctrl</kbd>+<kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">C</kbd> Copier · <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">V</kbd> Coller</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Ctrl</kbd>+<kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">D</kbd> Dupliquer</li>
                      <li><kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Échap</kbd> Fermer / annuler</li>
                    </ul>
                  </section>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">Appuyez sur <kbd className="rounded bg-muted px-1.5 py-0.5">?</kbd> à tout moment pour rouvrir</p>
              </div>
            </div>
          )}


          {/* Selected token panel (floating bottom) */}
          {selectedToken && !gmPanelOpen && (
            <div className="absolute bottom-12 left-2 w-52 rounded-lg border border-border bg-card/95 p-2.5 shadow-lg backdrop-blur-sm space-y-2">
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
              {/* Vision dynamique (mode nuit) */}
              <div className="mt-1 rounded border border-border/60 bg-background/40 p-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">👁 Vision</span>
                  <span className="text-[10px] font-mono text-amber-300">{selectedToken.visionRadius ?? 0} m</span>
                </div>
                <div className="grid grid-cols-5 gap-0.5">
                  {[0, 3, 6, 9, 18].map(v => (
                    <button
                      key={v}
                      className={`rounded text-[10px] py-0.5 transition-colors ${
                        (selectedToken.visionRadius ?? 0) === v
                          ? "bg-primary text-primary-foreground"
                          : "border border-border hover:bg-muted"
                      }`}
                      onClick={() => setTokens(prev => prev.map(t => t.id === selectedToken.id ? { ...t, visionRadius: v } : t))}
                    >
                      {v === 0 ? "—" : `${v}m`}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  Effet visible en 🌙 Mode nuit. La vision est bloquée par les murs.
                </p>
              </div>
            </div>
          )}

          {diceOpen && (
            <Suspense fallback={null}>
              <DiceRoller3D
                open={diceOpen}
                onClose={() => setDiceOpen(false)}
                campaignId={campaignId}
                userName={user?.display_name || user?.email?.split("@")[0] || "Joueur"}
              />
            </Suspense>
          )}
          <DiceBroadcastOverlay campaignId={campaignId} />
        </div>

        {/* ── GM PANEL ── */}
        {gmPanelOpen && isGM && (
          <GMPanel
            campaignId={campaignId}
            isGM={isGM}
            currentUserId={user?.id || ""}
            userName={user?.display_name || user?.email?.split("@")[0] || "Joueur"}
            tokens={tokens}
            selectedTokenId={selectedTokenId}
            waCreatures={waCreatures}
            aetheriaCreatures={aetheriaCreatures as any}
            systemMonsters={systemMonsters as any}
            campaignSystem={campaignSystem}
            userCharacters={userCharacters}
            initiative={initiative}
            initiativeRound={initiativeRound}
            initiativeActiveIdx={initiativeActiveIdx}
            onUpdateTokenHp={updateTokenHp}
            onSelectToken={(id) => { setSelectedTokenId(id); centerOnToken(id); }}
            onSpawnCreature={spawnWACreature}
            onSpawnAetheriaCreature={spawnAetheriaCreature}
            onSpawnSystemMonster={spawnSystemMonster}
            onSpawnCharacter={spawnCharacter}
            onAddToInitiative={addToInitiative}
            onAddSelectedTokenToInitiative={addSelectedTokenToInitiative}
            onAddAllTokensToInitiative={addAllTokensToInitiative}
            onAutoRollAllInitiative={autoRollAllInitiative}
            onUpdateInitiativeValue={updateInitiativeValue}
            onReorderInitiative={reorderInitiative}
            onRemoveFromInitiative={removeFromInitiative}
            onUpdateInitiativeHp={updateInitiativeHp}
            onAddConditionToInitiative={addConditionToInitiative}
            onRemoveConditionFromInitiative={removeConditionFromInitiative}
            onNextTurn={nextTurn}
            onResetInitiative={resetInitiative}
            onClose={() => setGmPanelOpen(false)}
          />
        )}
        {gmPanelOpen && !isGM && !isMobile && (
          <PlayerPanel
            tokens={tokens}
            initiative={initiative}
            initiativeRound={initiativeRound}
            initiativeActiveIdx={initiativeActiveIdx}
            campaignSystem={campaignSystem}
            onClose={() => setGmPanelOpen(false)}
          />
        )}
      </div>

      {/* Fiche personnage interactive du jeton */}
      <Dialog open={!!sheetToken} onOpenChange={(o) => !o && setSheetToken(null)}>
        <DialogContent className="max-w-md max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:max-w-none max-sm:rounded-none max-sm:p-4 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: sheetToken?.color }} />
              {sheetToken?.name}
            </DialogTitle>
            <DialogDescription>
              {sheetToken?.creatureType === "character" ? "Personnage joueur" :
               sheetToken?.creatureType === "wa_creature" ? "Créature (Worlds Awakening)" :
               sheetToken?.creatureType === "aetheria_creature" ? "Créature Aetheria" :
               sheetToken?.creatureType === "monster" ? "Monstre" : "Jeton"}
              {sheetToken && !perms.canEditTokenStats(sheetToken) && (
                <span className="ml-2 text-xs text-muted-foreground italic">(lecture seule)</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {sheetToken && (() => {
            const canEdit = perms.canEditTokenStats(sheetToken);
            const tok = sheetToken;
            const patch = (updates: Partial<TokenItem>) => {
              if (!canEdit) return;
              updateToken(tok.id, updates);
              setSheetToken(s => s ? { ...s, ...updates } : s);
              // Mirror to linked character row (token → fiche sync)
              if (tok.creatureType === "character" && tok.creatureId) {
                const charPatch: any = {};
                if (updates.hp !== undefined) charPatch.hp = updates.hp;
                if (updates.maxHp !== undefined) charPatch.max_hp = updates.maxHp;
                if (updates.ac !== undefined) charPatch.armor_class = updates.ac;
                if (updates.name !== undefined) charPatch.name = updates.name;
                if (Object.keys(charPatch).length > 0) {
                  charactersApi.update(tok.creatureId, charPatch).catch(() => {});
                }
              }
            };
            const adjustHp = (delta: number) => {
              if (!canEdit) return;
              const max = tok.maxHp ?? 999;
              const next = Math.max(0, Math.min(max, (tok.hp ?? 0) + delta));
              patch({ hp: next });
            };
            const adjustPe = (delta: number) => {
              if (!canEdit) return;
              const max = tok.maxPe ?? 999;
              const next = Math.max(0, Math.min(max, (tok.pe ?? 0) + delta));
              patch({ pe: next });
            };
            return (
            <div className="space-y-4 text-sm">
              {tok.imageUrl && (
                <img src={tok.imageUrl} alt={tok.name} className="w-full h-40 object-cover rounded-md border border-border" />
              )}

              {/* PV */}
              <div className="rounded-lg border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Points de vie</span>
                  <span className="text-xs text-muted-foreground">{tok.hp ?? 0} / {tok.maxHp ?? 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => adjustHp(-5)}>-5</Button>
                  <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => adjustHp(-1)}>-1</Button>
                  <Input
                    type="number"
                    value={tok.hp ?? 0}
                    disabled={!canEdit}
                    onChange={(e) => patch({ hp: Math.max(0, Math.min(tok.maxHp ?? 999, Number(e.target.value) || 0)) })}
                    className="h-8 text-center"
                  />
                  <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => adjustHp(1)}>+1</Button>
                  <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => adjustHp(5)}>+5</Button>
                </div>
                {isGM && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">PV max</span>
                    <Input
                      type="number"
                      value={tok.maxHp ?? 0}
                      onChange={(e) => patch({ maxHp: Math.max(1, Number(e.target.value) || 1) })}
                      className="h-7 w-20 text-center"
                    />
                  </div>
                )}
                {/* Dégâts / Soin rapide */}
                {canEdit && (
                  <div className="mt-2 flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Montant"
                      className="h-8 flex-1 text-center"
                      data-quick-hp-input
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = Number((e.target as HTMLInputElement).value) || 0;
                          if (v > 0) adjustHp(-v);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                    <Button
                      type="button" size="sm" variant="destructive"
                      onClick={(e) => {
                        const input = (e.currentTarget.parentElement?.querySelector("[data-quick-hp-input]") as HTMLInputElement | null);
                        const v = Number(input?.value) || 0;
                        if (v > 0) { adjustHp(-v); if (input) input.value = ""; }
                      }}
                    >Dégâts</Button>
                    <Button
                      type="button" size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      onClick={(e) => {
                        const input = (e.currentTarget.parentElement?.querySelector("[data-quick-hp-input]") as HTMLInputElement | null);
                        const v = Number(input?.value) || 0;
                        if (v > 0) { adjustHp(v); if (input) input.value = ""; }
                      }}
                    >Soin</Button>
                  </div>
                )}
              </div>


              {/* PE / Mana */}
              {(tok.pe !== undefined || isGM) && (
                <div className="rounded-lg border border-border bg-card/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Énergie / Mana</span>
                    <span className="text-xs text-muted-foreground">{tok.pe ?? 0} / {tok.maxPe ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => adjustPe(-1)}>-1</Button>
                    <Input
                      type="number"
                      value={tok.pe ?? 0}
                      disabled={!canEdit}
                      onChange={(e) => patch({ pe: Math.max(0, Math.min(tok.maxPe ?? 999, Number(e.target.value) || 0)) })}
                      className="h-8 text-center"
                    />
                    <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => adjustPe(1)}>+1</Button>
                    {isGM && (
                      <Input
                        type="number"
                        value={tok.maxPe ?? 0}
                        onChange={(e) => patch({ maxPe: Math.max(0, Number(e.target.value) || 0) })}
                        className="h-8 w-20 text-center"
                        placeholder="Max"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* CA / Défense + Taille */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-border p-2">
                  <div className="text-xs text-muted-foreground">Défense / CA</div>
                  {canEdit ? (
                    <Input
                      type="number"
                      value={tok.ac ?? 10}
                      onChange={(e) => patch({ ac: Math.max(0, Number(e.target.value) || 0) })}
                      className="h-8 mt-1 text-center"
                    />
                  ) : (
                    <div className="font-semibold">{tok.ac ?? "—"}</div>
                  )}
                </div>
                <div className="rounded border border-border p-2">
                  <div className="text-xs text-muted-foreground">Taille</div>
                  <div className="font-semibold">{tok.sizeUnits}× case{tok.sizeUnits > 1 ? "s" : ""}</div>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">États & conditions</div>
                <div className="flex flex-wrap gap-1.5">
                  {CONDITIONS.map(c => {
                    const active = tok.conditions?.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => toggleTokenCondition(tok.id, c.id)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs border transition ${
                          active
                            ? "bg-primary/20 border-primary text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/40"
                        } ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <span>{c.emoji}</span>{c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes rapides */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Notes rapides</div>
                <Textarea
                  rows={3}
                  value={tok.notes ?? ""}
                  disabled={!canEdit}
                  placeholder={canEdit ? "Ajouter une note rapide…" : "Aucune note"}
                  onChange={(e) => patch({ notes: e.target.value })}
                />
              </div>

              {/* Statut Boss (MJ) */}
              {isGM && (
                <div className="flex items-center justify-between rounded border border-border p-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Statut Boss</div>
                    <div className="text-xs">Anneau doré + halo lumineux</div>
                  </div>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded text-xs font-semibold border ${tok.isBoss ? "bg-amber-500/20 border-amber-500 text-amber-300" : "border-border text-muted-foreground hover:bg-muted/40"}`}
                    onClick={() => patch({ isBoss: !tok.isBoss })}
                  >
                    {tok.isBoss ? "★ Boss" : "Marquer Boss"}
                  </button>
                </div>
              )}

              {/* Lier une fiche personnage (MJ uniquement, jeton sans fiche) */}
              {isGM && !tok.creatureId && userCharacters.length > 0 && (
                <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
                  <div className="text-xs text-muted-foreground">Lier une fiche personnage</div>
                  <div className="flex flex-wrap gap-1.5">
                    {userCharacters.map((char: any) => (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => patch({
                          creatureId: char.id,
                          creatureType: "character",
                          hp: char.hp ?? char.max_hp ?? tok.hp,
                          maxHp: char.max_hp ?? tok.maxHp,
                          ac: char.armor_class ?? tok.ac,
                          imageUrl: char.avatar_url || tok.imageUrl,
                          name: char.name,
                          ownerUserId: char.user_id ?? tok.ownerUserId,
                        })}
                        className="px-2 py-1 rounded border border-border text-xs hover:bg-primary/10 hover:border-primary"
                      >
                        {char.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tok.creatureId && tok.creatureType === "character" && (
                <Button
                  type="button"
                  variant="default"
                  className="w-full"
                  onClick={() => setFullSheetCharId(tok.creatureId!)}
                >
                  Ouvrir la fiche complète
                </Button>
              )}
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Fiche complète liée au token (multi-systèmes) */}
      <Dialog open={!!fullSheetCharId} onOpenChange={(o) => !o && setFullSheetCharId(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:max-w-none max-sm:rounded-none max-sm:p-3">
          <DialogHeader className="sr-only">
            <DialogTitle>Fiche personnage</DialogTitle>
            <DialogDescription>Fiche complète liée au jeton sélectionné</DialogDescription>
          </DialogHeader>
          {fullSheetCharacter && (() => {
            const linkedTok = tokens.find(t => t.creatureType === "character" && t.creatureId === fullSheetCharacter.id) ?? null;
            const canEditSheet = isGM || (user?.id && fullSheetCharacter.user_id === user.id);
            return (
              <SheetRouter
                character={fullSheetCharacter}
                editable={!!canEditSheet}
                onSave={(charPatch: any) => {
                  if (!canEditSheet) return;
                  updateCharacterMutation.mutate({ id: fullSheetCharacter.id, patch: charPatch });
                  // Immediate optimistic mirror to the token (fiche → token sync)
                  if (linkedTok) {
                    const tokPatch: Partial<TokenItem> = {};
                    if (typeof charPatch.hp === "number") tokPatch.hp = charPatch.hp;
                    if (typeof charPatch.max_hp === "number") tokPatch.maxHp = charPatch.max_hp;
                    if (typeof charPatch.armor_class === "number") tokPatch.ac = charPatch.armor_class;
                    if (charPatch.name) tokPatch.name = charPatch.name;
                    if (charPatch.avatar_url) tokPatch.imageUrl = charPatch.avatar_url;
                    if (Object.keys(tokPatch).length > 0) updateToken(linkedTok.id, tokPatch);
                  }
                }}
                onClose={() => setFullSheetCharId(null)}
              />
            );
          })()}
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

      {/* Pop-ups PDF partagés (rendus via portail) */}
      <SharedPdfPopups documents={sharedDocs} isGM={isGM} onUnshare={unshareDocument} />
    </div>

  );
};

export default CampaignTabletop;

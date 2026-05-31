// ============================================================
// HOOK MURS DYNAMIQUES — Aetheria VTT
// Fichier : artifacts/questmaster/src/hooks/useWalls.ts
// ============================================================

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Wall, WallType } from "@/components/campaign/vtt/types";
import { WALL_COLORS, DOOR_OPEN_COLOR } from "@/components/campaign/vtt/types";

const newId = () => crypto.randomUUID();

// Distance point → segment (pour la sélection)
function distPointToSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

interface UseWallsOptions {
  campaignId: string;
  isGM: boolean;
  saveStateDebounced: (partial: { walls: Wall[] }) => void;
}

export function useWalls({ campaignId, isGM, saveStateDebounced }: UseWallsOptions) {
  const [walls, setWalls] = useState<Wall[]>([]);
  const wallsRef = useRef<Wall[]>([]);
  useEffect(() => { wallsRef.current = walls; }, [walls]);

  const [selectedWallType, setSelectedWallType] = useState<WallType>("solid");
  const selectedWallTypeRef = useRef<WallType>("solid");
  useEffect(() => { selectedWallTypeRef.current = selectedWallType; }, [selectedWallType]);

  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const selectedWallIdRef = useRef<string | null>(null);
  useEffect(() => { selectedWallIdRef.current = selectedWallId; }, [selectedWallId]);

  // Point de départ du mur en cours de dessin
  const drawingStartRef = useRef<{ x: number; y: number } | null>(null);
  const previewEndRef = useRef<{ x: number; y: number } | null>(null);

  // ── Historique undo/redo ───────────────────────────────
  const undoStackRef = useRef<Wall[][]>([]);
  const redoStackRef = useRef<Wall[][]>([]);
  const MAX_HISTORY = 50;
  const [historyVersion, setHistoryVersion] = useState(0);
  const bumpHistory = useCallback(() => setHistoryVersion(v => v + 1), []);

  // ── Chargement initial ──────────────────────────────────
  const loadWalls = useCallback(async () => {
    const { data } = await supabase
      .from("tabletop_state")
      .select("walls" as never)
      .eq("campaign_id", campaignId)
      .maybeSingle();
    const w = (data as { walls?: Wall[] } | null)?.walls;
    if (w) setWalls(w || []);
  }, [campaignId]);

  // ── Sauvegarder ────────────────────────────────────────
  const saveWalls = useCallback((updated: Wall[]) => {
    saveStateDebounced({ walls: updated });
  }, [saveStateDebounced]);

  // ── Pousser snapshot dans l'historique avant mutation ──
  const pushHistory = useCallback((current: Wall[]) => {
    undoStackRef.current.push(current);
    if (undoStackRef.current.length > MAX_HISTORY) undoStackRef.current.shift();
    redoStackRef.current = [];
    bumpHistory();
  }, []);

  // ── Commencer à dessiner un mur ────────────────────────
  const startWall = useCallback((x: number, y: number) => {
    if (!isGM) return;
    drawingStartRef.current = { x, y };
    previewEndRef.current = { x, y };
  }, [isGM]);

  // ── Mise à jour preview ────────────────────────────────
  const updateWallPreview = useCallback((x: number, y: number) => {
    if (!drawingStartRef.current) return;
    previewEndRef.current = { x, y };
  }, []);

  // ── Finir de dessiner un mur ───────────────────────────
  const finishWall = useCallback((x: number, y: number) => {
    if (!isGM || !drawingStartRef.current) return;
    const start = drawingStartRef.current;

    // Ignorer les murs trop courts (< 5px monde)
    const len = Math.hypot(x - start.x, y - start.y);
    if (len < 5) {
      drawingStartRef.current = null;
      previewEndRef.current = null;
      return;
    }

    const newWall: Wall = {
      id: newId(),
      type: selectedWallType,
      x1: start.x,
      y1: start.y,
      x2: x,
      y2: y,
    };

    setWalls(prev => {
      pushHistory(prev);
      const updated = [...prev, newWall];
      saveWalls(updated);
      return updated;
    });

    drawingStartRef.current = null;
    previewEndRef.current = null;
  }, [isGM, selectedWallType, saveWalls, pushHistory]);

  // ── Annuler le dessin en cours (Echap) ─────────────────
  const cancelWall = useCallback(() => {
    drawingStartRef.current = null;
    previewEndRef.current = null;
  }, []);

  // ── Supprimer le mur le plus proche du clic ────────────
  const deleteWallAt = useCallback((x: number, y: number, threshold = 10) => {
    if (!isGM) return;
    let closestId: string | null = null;
    let closestDist = Infinity;

    for (const wall of walls) {
      const d = distPointToSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
      if (d < threshold && d < closestDist) {
        closestDist = d;
        closestId = wall.id;
      }
    }

    if (closestId) {
      setWalls(prev => {
        pushHistory(prev);
        const updated = prev.filter(w => w.id !== closestId);
        saveWalls(updated);
        return updated;
      });
      if (selectedWallId === closestId) setSelectedWallId(null);
    }
  }, [isGM, walls, selectedWallId, saveWalls, pushHistory]);

  // ── Sélectionner le mur le plus proche ─────────────────
  const selectWallAt = useCallback((x: number, y: number, threshold = 10) => {
    let closestId: string | null = null;
    let closestDist = Infinity;

    for (const wall of walls) {
      const d = distPointToSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
      if (d < threshold && d < closestDist) {
        closestDist = d;
        closestId = wall.id;
      }
    }
    setSelectedWallId(closestId);
    return closestId;
  }, [walls]);

  // ── Ouvrir/Fermer une porte ─────────────────────────────
  const toggleDoor = useCallback((wallId: string) => {
    setWalls(prev => {
      pushHistory(prev);
      const updated = prev.map(w =>
        w.id === wallId && w.type === "door"
          ? { ...w, isOpen: !w.isOpen }
          : w
      );
      saveWalls(updated);
      return updated;
    });
  }, [saveWalls, pushHistory]);

  // ── Tout effacer ────────────────────────────────────────
  const clearAllWalls = useCallback(() => {
    if (!isGM) return;
    setWalls(prev => {
      if (prev.length) pushHistory(prev);
      return [];
    });
    saveWalls([]);
    setSelectedWallId(null);
  }, [isGM, saveWalls, pushHistory]);

  // ── Undo / Redo ─────────────────────────────────────────
  const undo = useCallback(() => {
    if (!isGM) return;
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    setWalls(current => {
      redoStackRef.current.push(current);
      if (redoStackRef.current.length > MAX_HISTORY) redoStackRef.current.shift();
      saveWalls(prev);
      return prev;
    });
    bumpHistory();
  }, [isGM, saveWalls]);

  const redo = useCallback(() => {
    if (!isGM) return;
    const next = redoStackRef.current.pop();
    if (!next) return;
    setWalls(current => {
      undoStackRef.current.push(current);
      if (undoStackRef.current.length > MAX_HISTORY) undoStackRef.current.shift();
      saveWalls(next);
      return next;
    });
    bumpHistory();
  }, [isGM, saveWalls]);

  // ── Rendu des murs sur le canvas ────────────────────────
  const drawWalls = useCallback((
    ctx: CanvasRenderingContext2D,
    zoom: number,
    panOffset: { x: number; y: number },
    isGMView: boolean
  ) => {
    if (walls.length === 0 && !drawingStartRef.current) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // ── Murs existants ──────────────────────────────────
    for (const wall of walls) {
      const x1s = wall.x1 * zoom + panOffset.x;
      const y1s = wall.y1 * zoom + panOffset.y;
      const x2s = wall.x2 * zoom + panOffset.x;
      const y2s = wall.y2 * zoom + panOffset.y;

      // Couleur selon type (cohérente avec WALL_COLORS)
      let color = WALL_COLORS.solid;
      if (wall.type === "door") color = wall.isOpen ? DOOR_OPEN_COLOR : WALL_COLORS.door;
      if (wall.type === "window") color = WALL_COLORS.window;
      if (wall.type === "terrain") color = WALL_COLORS.terrain;

      // Épaisseur
      const thickness = wall.type === "terrain" ? 2 : 3;

      // Mur sélectionné
      const isSelected = wall.id === selectedWallId;

      // Glow si sélectionné
      if (isSelected && isGMView) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
      }

      ctx.strokeStyle = color + (wall.type === "terrain" ? "99" : "cc");
      ctx.lineWidth = (thickness / zoom) * zoom;

      // Porte ouverte = pointillés
      if (wall.type === "door" && wall.isOpen) {
        ctx.setLineDash([6 / zoom * zoom, 4 / zoom * zoom]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(x1s, y1s);
      ctx.lineTo(x2s, y2s);
      ctx.stroke();

      // Indicateur porte (carré au milieu)
      if (wall.type === "door") {
        const mx = (x1s + x2s) / 2;
        const my = (y1s + y2s) / 2;
        const sz = 6;
        ctx.fillStyle = color;
        ctx.fillRect(mx - sz / 2, my - sz / 2, sz, sz);
      }

      ctx.shadowBlur = 0;
      ctx.setLineDash([]);

      // Points d'extrémité (MJ uniquement, visibles au hover)
      if (isGMView) {
        ctx.fillStyle = color + "88";
        ctx.beginPath();
        ctx.arc(x1s, y1s, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2s, y2s, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Preview mur en cours de dessin ──────────────────
    if (drawingStartRef.current && previewEndRef.current && isGMView) {
      const start = drawingStartRef.current;
      const end = previewEndRef.current;

      const x1s = start.x * zoom + panOffset.x;
      const y1s = start.y * zoom + panOffset.y;
      const x2s = end.x * zoom + panOffset.x;
      const y2s = end.y * zoom + panOffset.y;

      let previewColor = WALL_COLORS.solid;
      if (selectedWallType === "door") previewColor = WALL_COLORS.door;
      if (selectedWallType === "window") previewColor = WALL_COLORS.window;
      if (selectedWallType === "terrain") previewColor = WALL_COLORS.terrain;

      ctx.strokeStyle = previewColor + "88";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(x1s, y1s);
      ctx.lineTo(x2s, y2s);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point de départ
      ctx.fillStyle = previewColor;
      ctx.beginPath();
      ctx.arc(x1s, y1s, 5, 0, Math.PI * 2);
      ctx.fill();

      // Longueur
      const len = Math.hypot(
        end.x - start.x,
        end.y - start.y
      ).toFixed(1);
      ctx.fillStyle = "white";
      ctx.font = "12px sans-serif";
      ctx.fillText(`${len}m`, (x1s + x2s) / 2 + 6, (y1s + y2s) / 2 - 4);
    }

    ctx.restore();
  }, [walls, selectedWallId, selectedWallType]);

  // ── Recevoir les murs depuis Supabase Realtime ──────────
  const receiveWalls = useCallback((newWalls: Wall[]) => {
    setWalls(newWalls || []);
  }, []);

  return {
    walls,
    setWalls,
    selectedWallType,
    setSelectedWallType,
    selectedWallId,
    setSelectedWallId,
    drawingStart: drawingStartRef,
    previewEnd: previewEndRef,
    loadWalls,
    startWall,
    updateWallPreview,
    finishWall,
    cancelWall,
    deleteWallAt,
    selectWallAt,
    toggleDoor,
    clearAllWalls,
    drawWalls,
    receiveWalls,
    undo,
    redo,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    historyVersion,
  };
}

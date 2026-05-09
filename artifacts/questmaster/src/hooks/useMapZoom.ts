import { useCallback, useState } from "react";

/**
 * Zoom + pan logique pour le plateau (sans gérer le wheel listener,
 * qui doit rester près du canvas dans le composant qui l'utilise).
 */
export interface UseMapZoomOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  initialPan?: { x: number; y: number };
}

export function useMapZoom({
  initialZoom = 1,
  minZoom = 0.25,
  maxZoom = 3,
  step = 0.15,
  initialPan = { x: 0, y: 0 },
}: UseMapZoomOptions = {}) {
  const [zoom, setZoomRaw] = useState(initialZoom);
  const [panOffset, setPanOffset] = useState(initialPan);

  const clamp = useCallback(
    (v: number) => Math.max(minZoom, Math.min(maxZoom, v)),
    [minZoom, maxZoom]
  );

  const setZoom = useCallback(
    (next: number | ((prev: number) => number)) => {
      setZoomRaw(prev => clamp(typeof next === "function" ? (next as (p: number) => number)(prev) : next));
    },
    [clamp]
  );

  const zoomIn = useCallback(() => setZoom(z => z + step), [setZoom, step]);
  const zoomOut = useCallback(() => setZoom(z => z - step), [setZoom, step]);
  const resetView = useCallback(() => {
    setZoomRaw(initialZoom);
    setPanOffset(initialPan);
  }, [initialZoom, initialPan]);

  return {
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    zoomIn,
    zoomOut,
    resetView,
    minZoom,
    maxZoom,
  };
}

// ============================================================
// HOOK LUMIÈRES DYNAMIQUES — Aetheria VTT
// Fichier : artifacts/questmaster/src/hooks/useLights.ts
// ============================================================

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LightSource, LightPreset } from "@/components/campaign/vtt/types";
import { LIGHT_PRESETS } from "@/components/campaign/vtt/types";

const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface UseLightsOptions {
  campaignId: string;
  isGM: boolean;
  saveStateDebounced: (
    partial: { lights?: LightSource[]; night_mode?: boolean },
    options?: { immediate?: boolean },
  ) => void;
}

export function useLights({ campaignId, isGM, saveStateDebounced }: UseLightsOptions) {
  const [lights, setLights] = useState<LightSource[]>([]);
  const [nightMode, setNightModeState] = useState(false);
  const lightsRef = useRef<LightSource[]>([]);
  useEffect(() => { lightsRef.current = lights; }, [lights]);
  // Une fois l'état reçu via la synchro temps réel, le chargement initial
  // ne doit plus écraser les données (évite les lumières « qui reviennent »).
  const hydratedRef = useRef(false);

  const [selectedPreset, setSelectedPreset] = useState<LightPreset>("torch");

  // Chargement initial direct depuis Supabase
  const loadLights = useCallback(async () => {
    const { data } = await supabase
      .from("tabletop_state")
      .select("lights, night_mode" as never)
      .eq("campaign_id", campaignId)
      .maybeSingle();
    if (hydratedRef.current) return;
    const d = data as { lights?: LightSource[]; night_mode?: boolean } | null;
    if (d?.lights) setLights(d.lights);
    if (typeof d?.night_mode === "boolean") setNightModeState(d.night_mode);
  }, [campaignId]);

  useEffect(() => { loadLights(); }, [loadLights]);

  // Réception depuis la sync (sans triggerer une nouvelle save)
  const receiveLights = useCallback((incoming: LightSource[]) => {
    hydratedRef.current = true;
    setLights(incoming || []);
  }, []);
  const receiveNightMode = useCallback((v: boolean) => {
    hydratedRef.current = true;
    setNightModeState(!!v);
  }, []);

  const persistLights = useCallback((next: LightSource[]) => {
    hydratedRef.current = true;
    setLights(next);
    // Diffusion immédiate : tous les joueurs doivent voir la lumière tout de suite.
    saveStateDebounced({ lights: next }, { immediate: true });
  }, [saveStateDebounced]);


  const setNightMode = useCallback((v: boolean) => {
    if (!isGM) return;
    hydratedRef.current = true;
    setNightModeState(v);
    saveStateDebounced({ night_mode: v }, { immediate: true });
  }, [isGM, saveStateDebounced]);


  // Crée une lumière à une position du monde
  const addLightAt = useCallback((wx: number, wy: number, preset: LightPreset = selectedPreset) => {
    if (!isGM) return;
    const base = preset === "custom" ? LIGHT_PRESETS.torch : LIGHT_PRESETS[preset];
    const light: LightSource = {
      id: newId(),
      x: wx,
      y: wy,
      ...base,
      enabled: true,
    };
    persistLights([...lightsRef.current, light]);
  }, [isGM, selectedPreset, persistLights]);

  // Attache une lumière à un token (suit ses déplacements)
  const addLightToToken = useCallback((tokenId: string, preset: LightPreset = selectedPreset) => {
    if (!isGM) return;
    const base = preset === "custom" ? LIGHT_PRESETS.torch : LIGHT_PRESETS[preset];
    const existingIdx = lightsRef.current.findIndex(l => l.tokenId === tokenId);
    if (existingIdx >= 0) {
      // Toggle off si même preset, sinon remplace
      const existing = lightsRef.current[existingIdx];
      if (existing.preset === preset) {
        const next = lightsRef.current.filter((_, i) => i !== existingIdx);
        persistLights(next);
        return;
      }
      const next = [...lightsRef.current];
      next[existingIdx] = { ...existing, ...base, enabled: true };
      persistLights(next);
      return;
    }
    const light: LightSource = {
      id: newId(),
      tokenId,
      ...base,
      enabled: true,
    };
    persistLights([...lightsRef.current, light]);
  }, [isGM, selectedPreset, persistLights]);

  const deleteLightById = useCallback((id: string) => {
    if (!isGM) return;
    persistLights(lightsRef.current.filter(l => l.id !== id));
  }, [isGM, persistLights]);

  // Suppression multiple (sélection sur la table)
  const deleteLightsByIds = useCallback((ids: string[]) => {
    if (!isGM || ids.length === 0) return;
    const set = new Set(ids);
    persistLights(lightsRef.current.filter(l => !set.has(l.id)));
  }, [isGM, persistLights]);

  // Déplacement multiple (lumières statiques uniquement)
  const moveLightsBy = useCallback((ids: string[], dx: number, dy: number) => {
    if (!isGM || ids.length === 0 || (dx === 0 && dy === 0)) return;
    const set = new Set(ids);
    persistLights(lightsRef.current.map(l =>
      set.has(l.id) && !l.tokenId
        ? { ...l, x: (l.x ?? 0) + dx, y: (l.y ?? 0) + dy }
        : l,
    ));
  }, [isGM, persistLights]);

  // Trouve la lumière (statique) la plus proche d'un point dans threshold (monde)
  const findLightAt = useCallback((wx: number, wy: number, threshold = 20): LightSource | null => {
    let best: LightSource | null = null;
    let bestDist = threshold;
    for (const l of lightsRef.current) {
      if (l.tokenId) continue; // ne sélectionne pas les lumières attachées (passe par le token)
      const dx = (l.x ?? 0) - wx;
      const dy = (l.y ?? 0) - wy;
      const d = Math.hypot(dx, dy);
      if (d < bestDist) { best = l; bestDist = d; }
    }
    return best;
  }, []);

  const deleteLightAt = useCallback((wx: number, wy: number, threshold = 20) => {
    const hit = findLightAt(wx, wy, threshold);
    if (hit) { deleteLightById(hit.id); return true; }
    return false;
  }, [findLightAt, deleteLightById]);

  const clearAllLights = useCallback(() => {
    if (!isGM) return;
    persistLights([]);
  }, [isGM, persistLights]);

  return {
    lights,
    nightMode,
    setNightMode,
    selectedPreset,
    setSelectedPreset,
    addLightAt,
    addLightToToken,
    deleteLightById,
    deleteLightAt,
    findLightAt,
    clearAllLights,
    receiveLights,
    receiveNightMode,
    loadLights,
  };
}

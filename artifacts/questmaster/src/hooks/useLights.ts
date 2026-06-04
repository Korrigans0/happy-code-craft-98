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
  saveStateDebounced: (partial: { lights?: LightSource[]; night_mode?: boolean }) => void;
}

export function useLights({ campaignId, isGM, saveStateDebounced }: UseLightsOptions) {
  const [lights, setLights] = useState<LightSource[]>([]);
  const [nightMode, setNightModeState] = useState(false);
  const lightsRef = useRef<LightSource[]>([]);
  useEffect(() => { lightsRef.current = lights; }, [lights]);

  const [selectedPreset, setSelectedPreset] = useState<LightPreset>("torch");

  // Chargement initial direct depuis Supabase
  const loadLights = useCallback(async () => {
    const { data } = await supabase
      .from("tabletop_state")
      .select("lights, night_mode" as never)
      .eq("campaign_id", campaignId)
      .maybeSingle();
    const d = data as { lights?: LightSource[]; night_mode?: boolean } | null;
    if (d?.lights) setLights(d.lights);
    if (typeof d?.night_mode === "boolean") setNightModeState(d.night_mode);
  }, [campaignId]);

  useEffect(() => { loadLights(); }, [loadLights]);

  // Réception depuis la sync (sans triggerer une nouvelle save)
  const receiveLights = useCallback((incoming: LightSource[]) => {
    setLights(incoming || []);
  }, []);
  const receiveNightMode = useCallback((v: boolean) => {
    setNightModeState(!!v);
  }, []);

  const persistLights = useCallback((next: LightSource[]) => {
    setLights(next);
    saveStateDebounced({ lights: next });
  }, [saveStateDebounced]);

  const setNightMode = useCallback((v: boolean) => {
    if (!isGM) return;
    setNightModeState(v);
    saveStateDebounced({ night_mode: v });
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

// LayersPanel — Gestion des 9 calques canoniques (MJ uniquement).
//
// Panneau autonome qui lit/écrit `tabletop_state.layers` via l'API existante.
// Il ne dépend pas de l'état mémoire de `CampaignTabletop` : il rafraîchit
// uniquement la clé `layers`, ce qui évite tout conflit avec le rendu actuel.
// Le rendu du canvas pourra consommer progressivement ces métadonnées sans
// avoir besoin de rechanger la structure de données.

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, LockOpen, UserCircle2, UserX, X, Layers as LayersIcon, RotateCcw, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { campaignsApi } from "@/lib/api";
import {
  DEFAULT_LAYERS, LAYER_ORDER, LAYER_META, normalizeLayers,
  type LayersState, type LayerId,
} from "./layers";

interface Props {
  campaignId: string;
  onClose: () => void;
}

export default function LayersPanel({ campaignId, onClose }: Props) {
  const [layers, setLayers] = useState<LayersState>(DEFAULT_LAYERS);
  const [activeLayer, setActiveLayer] = useState<LayerId>("tokens");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await campaignsApi.getTabletop(campaignId);
        if (cancelled) return;
        setLayers(normalizeLayers((data as { layers?: unknown }).layers));
      } catch (e) {
        console.error("[LayersPanel] load", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [campaignId]);

  const persist = useCallback(async (next: LayersState) => {
    setSaving(true);
    try {
      await campaignsApi.saveTabletop(campaignId, { layers: next } as Record<string, unknown>);
    } catch (e) {
      console.error("[LayersPanel] save", e);
      toast({ title: "Erreur", description: "Impossible d'enregistrer les calques.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [campaignId]);

  const update = useCallback((id: LayerId, patch: Partial<LayersState[LayerId]>) => {
    setLayers((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      void persist(next);
      return next;
    });
  }, [persist]);

  const reset = useCallback(() => {
    setLayers(DEFAULT_LAYERS);
    void persist(DEFAULT_LAYERS);
    toast({ title: "Calques réinitialisés", description: "Configuration par défaut restaurée." });
  }, [persist]);

  return (
    <aside
      className="fixed right-4 top-24 z-40 flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-primary/30 bg-card/95 shadow-2xl backdrop-blur"
      role="complementary"
      aria-label="Calques du tabletop"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <LayersIcon className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-semibold tracking-wide">Calques</h2>
          {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset} title="Réinitialiser">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto p-2">
          <ul className="space-y-1">
            {[...LAYER_ORDER].reverse().map((id) => {
              const config = layers[id];
              const meta = LAYER_META[id];
              const Icon = meta.icon;
              const isActive = activeLayer === id;
              return (
                <li key={id}>
                  <div
                    className={`group rounded-md border px-2 py-1.5 transition-colors ${
                      isActive ? "border-primary/60 bg-primary/10" : "border-border/40 hover:border-border"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveLayer(id)}
                      className="flex w-full items-center gap-2 text-left"
                      aria-pressed={isActive}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{meta.label}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{meta.description}</div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); update(id, { visible: !config.visible }); }}
                          className="rounded p-1 hover:bg-background/60"
                          title={config.visible ? "Masquer" : "Afficher"}
                          aria-label={config.visible ? "Masquer le calque" : "Afficher le calque"}
                        >
                          {config.visible
                            ? <Eye className="h-3.5 w-3.5" />
                            : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); update(id, { locked: !config.locked }); }}
                          className="rounded p-1 hover:bg-background/60"
                          title={config.locked ? "Déverrouiller" : "Verrouiller"}
                          aria-label={config.locked ? "Déverrouiller" : "Verrouiller"}
                        >
                          {config.locked
                            ? <Lock className="h-3.5 w-3.5 text-amber-400" />
                            : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); update(id, { pjVisible: !config.pjVisible }); }}
                          className="rounded p-1 hover:bg-background/60"
                          title={config.pjVisible ? "Cacher aux PJ" : "Montrer aux PJ"}
                          aria-label={config.pjVisible ? "Cacher aux PJ" : "Montrer aux PJ"}
                        >
                          {config.pjVisible
                            ? <UserCircle2 className="h-3.5 w-3.5" />
                            : <UserX className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                      </div>
                    </button>

                    {isActive && (
                      <div className="mt-2 space-y-1 border-t border-border/40 pt-2">
                        <label className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Opacité</span>
                          <span>{Math.round(config.opacity * 100)}%</span>
                        </label>
                        <Slider
                          value={[Math.round(config.opacity * 100)]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(v) => update(id, { opacity: (v[0] ?? 100) / 100 })}
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <Separator className="my-2" />
          <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
            Les nouveaux outils du VTT créeront leurs objets dans le calque actif.
            La synchronisation est instantanée pour tous les joueurs connectés.
          </p>
        </div>
      )}
    </aside>
  );
}

// LayersPanel — Gestion des 9 calques canoniques (MJ uniquement).
//
// Composant 100 % contrôlé : l'état des calques vit dans `CampaignTabletop`
// (persisté dans `tabletop_state.layers` et diffusé en temps réel). Le panneau
// se contente d'afficher et d'émettre des patchs, ce qui garantit que le rendu
// du canvas et le panneau ne divergent jamais.

import { Eye, EyeOff, Lock, LockOpen, UserCircle2, UserX, X, Layers as LayersIcon, RotateCcw, Loader2, Crosshair } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LAYER_ORDER, LAYER_META, DRAWABLE_LAYERS,
  type LayersState, type LayerId, type LayerConfig,
} from "./layers";

interface Props {
  layers: LayersState;
  activeLayer: LayerId;
  /** Nombre d'objets présents sur chaque calque (indicateur). */
  counts?: Partial<Record<LayerId, number>>;
  saving?: boolean;
  onChange: (id: LayerId, patch: Partial<LayerConfig>) => void;
  onSelect: (id: LayerId) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function LayersPanel({
  layers, activeLayer, counts, saving, onChange, onSelect, onReset, onClose,
}: Props) {
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
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReset} title="Réinitialiser" aria-label="Réinitialiser les calques">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fermer" aria-label="Fermer le panneau des calques">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="max-h-[70vh] overflow-y-auto p-2">
        <ul className="space-y-1">
          {[...LAYER_ORDER].reverse().map((id) => {
            const config = layers[id];
            const meta = LAYER_META[id];
            const Icon = meta.icon;
            const isActive = activeLayer === id;
            const drawable = DRAWABLE_LAYERS.includes(id);
            const count = counts?.[id];
            return (
              <li key={id}>
                <div
                  className={`group rounded-md border px-2 py-1.5 transition-colors ${
                    isActive ? "border-primary/60 bg-primary/10" : "border-border/40 hover:border-border"
                  } ${config.visible ? "" : "opacity-60"}`}
                >
                  <div className="flex w-full items-center gap-2 text-left">
                    <button
                      type="button"
                      onClick={() => onSelect(id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-pressed={isActive}
                      title={drawable ? "Définir comme calque de dessin actif" : "Sélectionner le calque"}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 truncate text-xs font-medium">
                          {meta.label}
                          {isActive && drawable && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-primary/25 px-1 text-[9px] font-bold uppercase text-primary">
                              <Crosshair className="h-2.5 w-2.5" /> actif
                            </span>
                          )}
                          {typeof count === "number" && count > 0 && (
                            <span className="rounded-full bg-muted px-1 text-[9px] font-semibold text-muted-foreground">{count}</span>
                          )}
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground">{meta.description}</div>
                      </div>
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onChange(id, { visible: !config.visible })}
                        className="rounded p-1 hover:bg-background/60"
                        title={config.visible ? "Masquer le calque" : "Afficher le calque"}
                        aria-label={config.visible ? "Masquer le calque" : "Afficher le calque"}
                      >
                        {config.visible
                          ? <Eye className="h-3.5 w-3.5" />
                          : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange(id, { locked: !config.locked })}
                        className="rounded p-1 hover:bg-background/60"
                        title={config.locked ? "Déverrouiller" : "Verrouiller (aucune édition)"}
                        aria-label={config.locked ? "Déverrouiller" : "Verrouiller"}
                      >
                        {config.locked
                          ? <Lock className="h-3.5 w-3.5 text-amber-400" />
                          : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange(id, { pjVisible: !config.pjVisible })}
                        className="rounded p-1 hover:bg-background/60"
                        title={config.pjVisible ? "Cacher aux joueurs" : "Montrer aux joueurs"}
                        aria-label={config.pjVisible ? "Cacher aux joueurs" : "Montrer aux joueurs"}
                      >
                        {config.pjVisible
                          ? <UserCircle2 className="h-3.5 w-3.5" />
                          : <UserX className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

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
                        onValueChange={(v) => onChange(id, { opacity: (v[0] ?? 100) / 100 })}
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
          Les nouveaux dessins sont créés sur le calque actif. Un calque verrouillé ne peut plus être
          modifié, et un calque caché aux joueurs reste visible uniquement pour le MJ.
          La synchronisation est instantanée pour tous les joueurs connectés.
        </p>
      </div>
    </aside>
  );
}

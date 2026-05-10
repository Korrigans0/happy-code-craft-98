import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Heart, Skull, Copy, Eye, EyeOff, Trash2, Crosshair,
  RotateCw, Maximize2, Swords, MapPin, PaintBucket, Plus,
  ChevronRight,
} from "lucide-react";
import { TokenItem, CONDITIONS } from "./types";

interface ContextMenuProps {
  screenX: number;
  screenY: number;
  type: "canvas" | "token";
  token?: TokenItem;
  isGM: boolean;
  onClose: () => void;
  onHealToken?: (amount: number) => void;
  onDamageToken?: (amount: number) => void;
  onSetHp?: (hp: number) => void;
  onToggleCondition?: (condId: string) => void;
  onAddToInitiative?: () => void;
  onDuplicate?: () => void;
  onToggleHide?: () => void;
  onDelete?: () => void;
  onCenter?: () => void;
  onResize?: (sizeUnits: number) => void;
  onToggleAura?: (size: number, color: string) => void;
  onAddToken?: () => void;
  onPing?: () => void;
  onToggleFog?: () => void;
  onClearFogHere?: () => void;
}

const ITEM_CLASS =
  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted/80 cursor-pointer transition-colors";
const DANGER_CLASS =
  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer transition-colors";
const SECTION_CLASS = "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";

export default function VTTContextMenu({
  screenX, screenY, type, token, isGM, onClose,
  onHealToken, onDamageToken, onSetHp, onToggleCondition,
  onAddToInitiative, onDuplicate, onToggleHide, onDelete, onCenter, onResize,
  onToggleAura, onAddToken, onPing, onToggleFog, onClearFogHere,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 220;
  const menuH = type === "token" ? 380 : 180;
  const left = Math.min(screenX, vw - menuW - 8);
  const top = Math.min(screenY, vh - menuH - 8);

  const act = (fn?: () => void) => { fn?.(); onClose(); };

  const activeConditions = new Set(token?.conditions ?? []);

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-[200] min-w-[200px] rounded-lg border border-border bg-card shadow-xl shadow-black/40 py-1"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {type === "token" && token && (
        <>
          {/* Token header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: token.color }} />
            <span className="font-semibold text-sm truncate">{token.name}</span>
            {token.hp !== undefined && (
              <span className="ml-auto text-xs text-muted-foreground shrink-0">
                {token.hp}/{token.maxHp} PV
              </span>
            )}
          </div>

          {/* HP controls */}
          {token.hp !== undefined && (
            <>
              <div className={SECTION_CLASS}>Points de vie</div>
              <div className="grid grid-cols-4 gap-1 px-2 pb-1">
                {[10, 5, 1].map(v => (
                  <button key={`dmg-${v}`} className="rounded text-xs py-1 bg-destructive/20 hover:bg-destructive/40 text-destructive font-medium transition-colors"
                    onClick={() => act(() => onDamageToken?.(v))}>
                    -{v}
                  </button>
                ))}
                <button className="rounded text-xs py-1 bg-muted/40 hover:bg-muted text-muted-foreground transition-colors"
                  onClick={() => { const v = prompt("PV exact :"); if (v !== null) { const n = parseInt(v); if (!isNaN(n)) act(() => onSetHp?.(n)); } }}>
                  =
                </button>
                {[1, 5, 10].map(v => (
                  <button key={`heal-${v}`} className="rounded text-xs py-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 font-medium transition-colors"
                    onClick={() => act(() => onHealToken?.(v))}>
                    +{v}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Conditions */}
          <div className={SECTION_CLASS}>Conditions</div>
          <div className="max-h-28 overflow-y-auto px-1 pb-1">
            <div className="grid grid-cols-2 gap-0.5">
              {CONDITIONS.map(cond => {
                const active = activeConditions.has(cond.id);
                return (
                  <button
                    key={cond.id}
                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors ${active ? "bg-primary/20 text-primary" : "hover:bg-muted/60 text-muted-foreground"}`}
                    onClick={() => act(() => onToggleCondition?.(cond.id))}
                  >
                    <span>{cond.emoji}</span>
                    <span className="truncate">{cond.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Taille */}
          {isGM && (
            <>
              <div className={SECTION_CLASS}>Taille (cases)</div>
              <div className="flex gap-1 px-2 pb-1">
                {[1, 2, 3, 4].map(n => (
                  <button key={n}
                    className={`flex-1 rounded text-xs py-1 font-medium transition-colors ${token.sizeUnits === n ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted text-foreground"}`}
                    onClick={() => act(() => onResize?.(n))}>
                    {n}×
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="my-1 border-t border-border/50" />

          {/* Actions */}
          {isGM && (
            <button className={ITEM_CLASS} onClick={() => act(onAddToInitiative)}>
              <Swords className="h-4 w-4 text-primary" />
              Ajouter à l'initiative
            </button>
          )}
          <button className={ITEM_CLASS} onClick={() => act(onCenter)}>
            <Crosshair className="h-4 w-4" />
            Centrer la vue
          </button>
          {isGM && (
            <button className={ITEM_CLASS} onClick={() => act(onDuplicate)}>
              <Copy className="h-4 w-4" />
              Dupliquer
            </button>
          )}
          {isGM && (
            <button className={ITEM_CLASS} onClick={() => act(onToggleHide)}>
              {token.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {token.isHidden ? "Montrer aux joueurs" : "Masquer aux joueurs"}
            </button>
          )}
          {isGM && (
            <button className={DANGER_CLASS} onClick={() => act(onDelete)}>
              <Trash2 className="h-4 w-4" />
              Supprimer le jeton
            </button>
          )}
        </>
      )}

      {type === "canvas" && (
        <>
          <div className={SECTION_CLASS}>Carte</div>
          <button className={ITEM_CLASS} onClick={() => act(onAddToken)}>
            <Plus className="h-4 w-4" />
            Placer un jeton ici
          </button>
          <button className={ITEM_CLASS} onClick={() => act(onPing)}>
            <MapPin className="h-4 w-4 text-yellow-400" />
            Ping ici
          </button>
          {isGM && (
            <>
              <div className="my-1 border-t border-border/50" />
              <div className={SECTION_CLASS}>Brouillard (MJ)</div>
              <button className={ITEM_CLASS} onClick={() => act(onToggleFog)}>
                <PaintBucket className="h-4 w-4" />
                Activer / désactiver le brouillard
              </button>
              <button className={ITEM_CLASS} onClick={() => act(onClearFogHere)}>
                <Eye className="h-4 w-4" />
                Révéler cette zone
              </button>
            </>
          )}
        </>
      )}
    </div>
  );

  return createPortal(menu, document.body);
}

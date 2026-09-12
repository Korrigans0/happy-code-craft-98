// Panneau de jeton Glyphes : points d'action, héroïsme, blessures, approche,
// actions rapides et actions héroïques filtrées par l'équipement.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Shield, Sparkles, Swords } from "lucide-react";
import {
  ACTIONS,
  ARMORS,
  MAX_HEROISM,
  availableHeroicActions,
  movementRange,
  type Approach,
  type LoadoutContext,
} from "@/lib/game-systems/glyphes";
import type { GlyphesTokenState } from "@/lib/game-systems/glyphes/useGlyphesCombat";

interface Props {
  tokenName: string;
  state: GlyphesTokenState;
  canEdit: boolean;
  loadout?: LoadoutContext;
  onChange: (patch: Partial<GlyphesTokenState>) => void;
  onSpend: (cost: number) => boolean;
  onSpendHeroism: (cost: number) => boolean;
  onStartTurn: () => void;
  onCheck: () => void;
  onAttack?: () => void;
}

export default function GlyphesTokenPanel({
  tokenName,
  state,
  canEdit,
  loadout,
  onChange,
  onSpend,
  onSpendHeroism,
  onStartTurn,
  onCheck,
  onAttack,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  const ctx: LoadoutContext = useMemo(
    () => ({
      armor: (state.armor as LoadoutContext["armor"]) ?? "aucune",
      hasShield: state.hasShield,
      weaponWeight: loadout?.weaponWeight ?? null,
      weaponRange: loadout?.weaponRange ?? null,
    }),
    [state.armor, state.hasShield, loadout],
  );

  const heroicActions = useMemo(() => availableHeroicActions(ctx, state.heroism), [ctx, state.heroism]);

  const setApproach = (approach: Approach) => {
    if (state.approach && state.approach !== approach) {
      setError("Une seule approche par tour : elle pourra changer au prochain tour.");
      return;
    }
    setError(null);
    onChange({ approach });
  };

  const runAction = (cost: number, approach?: Approach) => {
    if (approach && state.approach && state.approach !== approach) {
      setError("Approche déjà choisie pour ce tour.");
      return;
    }
    if (!onSpend(cost)) {
      setError("Points d'action insuffisants.");
      return;
    }
    setError(null);
    if (approach) onChange({ approach });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/80 p-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-foreground">{tokenName}</span>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onStartTurn} disabled={!canEdit}>
          Nouveau tour
        </Button>
      </div>

      {/* Ressources */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded border border-border p-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PA</p>
          <p className="font-mono text-lg font-bold text-primary">
            {state.actionPoints} / {state.maxActionPoints}
          </p>
          <p className="text-[9px] text-muted-foreground">{movementRange(state.actionPoints)} ft</p>
        </div>
        <div className="rounded border border-border p-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Héroïsme</p>
          <p className="flex items-center justify-center gap-1 font-mono text-lg font-bold text-amber-400">
            <Sparkles className="h-3 w-3" />
            {state.heroism} / {MAX_HEROISM}
          </p>
          <div className="mt-1 flex justify-center gap-1">
            <button
              className="rounded border border-border px-1 text-[10px] disabled:opacity-40"
              disabled={!canEdit}
              onClick={() => onChange({ heroism: state.heroism - 1 })}
            >
              −
            </button>
            <button
              className="rounded border border-border px-1 text-[10px] disabled:opacity-40"
              disabled={!canEdit}
              onClick={() => onChange({ heroism: state.heroism + 1 })}
            >
              +
            </button>
          </div>
        </div>
        <div className="rounded border border-border p-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Blessures</p>
          <p className="flex items-center justify-center gap-1 font-mono text-lg font-bold text-destructive">
            <Heart className="h-3 w-3" />
            {state.wounds} / {state.maxWounds}
          </p>
          <div className="mt-1 flex justify-center gap-1">
            <button
              className="rounded border border-border px-1 text-[10px] disabled:opacity-40"
              disabled={!canEdit}
              onClick={() => onChange({ wounds: state.wounds - 1 })}
            >
              −
            </button>
            <button
              className="rounded border border-border px-1 text-[10px] disabled:opacity-40"
              disabled={!canEdit}
              onClick={() => onChange({ wounds: state.wounds + 1 })}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Défense */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Résilience (TD)</p>
          <input
            type="number"
            min={1}
            className="h-8 w-full rounded border border-border bg-background px-2 text-sm"
            value={state.resilience}
            disabled={!canEdit}
            onChange={(e) => onChange({ resilience: Number(e.target.value) })}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Armure (protection)</p>
          <Select value={state.armor} onValueChange={(v) => onChange({ armor: v })} disabled={!canEdit}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ARMORS.map((a) => (
                <SelectItem key={a.key} value={a.key}>
                  {a.label} — {a.protection}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={state.hasShield}
          disabled={!canEdit}
          onChange={(e) => onChange({ hasShield: e.target.checked })}
        />
        <Shield className="h-3 w-3" /> Bouclier équipé
      </label>

      {/* Approche */}
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Approche du tour</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={state.approach === "parlementer" ? "default" : "outline"}
            className="h-8 text-xs"
            disabled={!canEdit}
            onClick={() => setApproach("parlementer")}
          >
            🗣️ Parlementer
          </Button>
          <Button
            size="sm"
            variant={state.approach === "guerroyer" ? "default" : "outline"}
            className="h-8 text-xs"
            disabled={!canEdit}
            onClick={() => setApproach("guerroyer")}
          >
            ⚔️ Guerroyer
          </Button>
        </div>
      </div>

      {/* Actions rapides */}
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Actions</p>
        <div className="grid grid-cols-2 gap-1">
          <Button size="sm" variant="outline" className="h-8 justify-start text-[11px]" onClick={onCheck}>
            🎲 Épreuve
          </Button>
          {onAttack && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 justify-start text-[11px]"
              disabled={!canEdit}
              onClick={() => {
                if (state.actionPoints < 2) {
                  setError("Points d'action insuffisants.");
                  return;
                }
                setApproach("guerroyer");
                onAttack();
              }}
            >
              ⚔️ Attaquer (2 PA)
            </Button>
          )}
          {ACTIONS.filter((a) => a.key !== "attaque" && a.key !== "parlementer" && a.cost !== null).map((a) => (
            <Button
              key={a.key}
              size="sm"
              variant="outline"
              className="h-8 justify-start text-[11px]"
              disabled={!canEdit}
              title={a.hint}
              onClick={() => runAction(a.cost ?? 0, a.approach)}
            >
              {a.icon} {a.label}
              {a.cost ? ` (${a.cost})` : ""}
            </Button>
          ))}
        </div>
      </div>

      {/* Actions héroïques */}
      <div>
        <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Swords className="h-3 w-3" /> Actions héroïques disponibles
        </p>
        <ScrollArea className="max-h-40">
          <div className="space-y-1 pr-2">
            {heroicActions.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                Aucune action héroïque accessible avec cet équipement ou cet héroïsme.
              </p>
            )}
            {heroicActions.map((a) => (
              <button
                key={a.id}
                className="w-full rounded border border-border p-2 text-left transition-colors hover:bg-muted/50 disabled:opacity-40"
                disabled={!canEdit}
                onClick={() => {
                  if (!onSpendHeroism(a.cost)) setError("Héroïsme insuffisant.");
                  else setError(null);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{a.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {a.costIsMinimum ? `${a.cost}+` : a.cost} pts
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{a.description}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

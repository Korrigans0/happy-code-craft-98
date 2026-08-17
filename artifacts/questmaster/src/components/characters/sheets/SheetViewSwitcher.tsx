// SheetViewSwitcher — Fiches multi-vues (Compacte / Complète / Jeu).
//
// Enveloppe la fiche dédiée du système (SheetRouter) et ajoute deux vues
// génériques pilotées par la SystemDefinition :
//  - Compacte : identité, PV, défenses et caractéristiques en un coup d'œil.
//  - Jeu      : suivi des ressources en table (dégâts / soins) + jets rapides.
// Aucune logique propre à un système ici : tout vient du registre.

import { useMemo, useState } from "react";
import { Heart, LayoutGrid, Maximize2, Swords, Shield, User, Minus, Plus, Dices } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSystem } from "@/lib/systems";
import { rollFormula, DiceError } from "@/lib/macros/engine";
import { broadcastDiceRoll } from "@/lib/vtt/diceBroadcast";
import { toast } from "@/hooks/use-toast";
import SheetRouter from "./SheetRouter";

export type SheetViewMode = "compact" | "full" | "play";

interface Props {
  character: any;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
  /** Diffuse les jets rapides sur le plateau de cette campagne. */
  campaignId?: string | null;
  /** Nom affiché comme auteur des jets. */
  authorName?: string;
  defaultView?: SheetViewMode;
}

const VIEWS: { id: SheetViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { id: "compact", label: "Compacte", icon: LayoutGrid },
  { id: "full", label: "Complète", icon: Maximize2 },
  { id: "play", label: "Jeu", icon: Swords },
];

function fmt(n: number) {
  return n >= 0 ? `+${n}` : `${n}`;
}

export default function SheetViewSwitcher({
  character, editable, onSave, onClose, onEdit, campaignId, authorName, defaultView = "full",
}: Props) {
  const [view, setView] = useState<SheetViewMode>(defaultView);
  const [delta, setDelta] = useState(1);

  const system = useMemo(() => getSystem(character?.system), [character?.system]);
  const sysData: Record<string, any> = character?.system_data ?? {};
  const statValues: Record<string, number> = sysData.stats ?? {};
  const defenseValues: Record<string, number> = sysData.defenses ?? {};
  const resourceValues: Record<string, any> = sysData.resources ?? {};

  const stats = system.stats.map((s) => {
    const raw = statValues[s.key] ?? (character?.[s.key.toLowerCase()] as number) ?? s.default;
    const mod = system.calculations?.statModifier(s, raw) ?? raw;
    return { ...s, raw, mod };
  });

  const hp = Number(character?.hp ?? 0);
  const maxHp = Math.max(1, Number(character?.max_hp ?? 1));
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  const patchHp = (next: number) => {
    if (!onSave) return;
    onSave({ hp: Math.max(0, Math.min(maxHp, next)) });
  };

  const quickRoll = (label: string, mod: number) => {
    try {
      const formula = `1d20${mod >= 0 ? "+" : "-"}${Math.abs(mod)}`;
      const res = rollFormula(formula);
      const results = res.terms.flatMap((t) => t.results.map((v) => ({ type: t.sides, value: v })));
      broadcastDiceRoll(campaignId, {
        author: authorName || character?.name || "Personnage",
        formula: res.formula,
        total: res.total,
        results,
        modifier: res.modifier,
        label: `${character?.name ?? ""} — ${label}`,
        crit: res.crit ?? undefined,
      });
      toast({ title: `${label} : ${res.total}`, description: res.formula });
    } catch (e) {
      toast({
        title: "Jet impossible",
        description: e instanceof DiceError ? e.message : "Erreur inattendue",
        variant: "destructive",
      });
    }
  };

  const header = (
    <div className="flex items-center gap-1 border-b border-border/60 bg-muted/30 px-3 py-2">
      {VIEWS.map((v) => (
        <Button
          key={v.id}
          variant={view === v.id ? "default" : "ghost"}
          size="sm"
          className="h-8 flex-1 text-xs"
          onClick={() => setView(v.id)}
        >
          <v.icon className="mr-1.5 h-3.5 w-3.5" />
          {v.label}
        </Button>
      ))}
    </div>
  );

  const identity = (
    <div className="flex items-center gap-3">
      {character?.avatar_url ? (
        <img
          src={character.avatar_url}
          alt={character.name}
          loading="lazy"
          className="h-14 w-14 rounded-full border-2 border-primary/50 object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
          <User className="h-7 w-7 text-primary" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-display text-lg text-foreground">{character?.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[character?.race, character?.class, `Niv. ${character?.level ?? 1}`].filter(Boolean).join(" · ")}
        </p>
        <Badge variant="outline" className="mt-1 text-[10px]">{system.shortLabel}</Badge>
      </div>
    </div>
  );

  const hpBlock = (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-red-300">
          <Heart className="h-4 w-4" /> Points de vie
        </span>
        <span className="font-mono text-foreground">{hp} / {maxHp}</span>
      </div>
      <Progress value={hpPct} className="[&>div]:bg-red-500/80" />
    </div>
  );

  if (view === "full") {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="min-h-0 flex-1">
          <SheetRouter
            character={character}
            editable={editable}
            onSave={onSave}
            onClose={onClose}
            onEdit={onEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/80">
      {header}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {identity}
          {hpBlock}

          {view === "compact" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {stats.map((s) => (
                  <div key={s.key} className="rounded-lg border border-border/60 bg-card/40 p-2 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                    <p className="font-display text-lg text-foreground">{s.raw}</p>
                    <p className="text-xs text-primary">{fmt(s.mod)}</p>
                  </div>
                ))}
              </div>

              {system.defenses.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {system.defenses.map((d) => (
                    <div
                      key={d.key}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 px-3 py-2"
                    >
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        {d.label}
                      </span>
                      <span className="font-display text-foreground">
                        {defenseValues[d.key] ?? character?.armor_class ?? d.default}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {character?.backstory && (
                <p className="line-clamp-4 text-xs text-muted-foreground">{character.backstory}</p>
              )}
            </>
          )}

          {view === "play" && (
            <>
              {/* Suivi PV en table */}
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <p className="mb-2 text-xs font-medium text-foreground">Dégâts / Soins</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={delta}
                    onChange={(e) => setDelta(Math.max(1, Number(e.target.value) || 1))}
                    className="h-9 w-20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-500/40 text-red-300"
                    disabled={!onSave}
                    onClick={() => patchHp(hp - delta)}
                  >
                    <Minus className="mr-1 h-4 w-4" /> Dégâts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-emerald-500/40 text-emerald-300"
                    disabled={!onSave}
                    onClick={() => patchHp(hp + delta)}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Soins
                  </Button>
                </div>
              </div>

              {/* Autres ressources du système */}
              {(system.resources ?? []).length > 0 && (
                <div className="space-y-2">
                  {(system.resources ?? []).map((r) => {
                    const val = resourceValues[r.key];
                    const cur = typeof val === "object" && val ? Number(val.current ?? 0) : Number(val ?? 0);
                    const max = typeof val === "object" && val ? Number(val.max ?? 0) : 0;
                    return (
                      <div
                        key={r.key}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 px-3 py-2"
                      >
                        <span className="text-xs text-muted-foreground">{r.label}</span>
                        <span className="font-mono text-sm text-foreground">
                          {cur}{max ? ` / ${max}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Jets rapides */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Dices className="h-3.5 w-3.5 text-primary" />
                  Jets rapides ({system.defaultRollHint})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {stats.map((s) => (
                    <Button
                      key={s.key}
                      variant="outline"
                      size="sm"
                      className="h-auto flex-col py-2"
                      onClick={() => quickRoll(s.label, s.mod)}
                    >
                      <span className="text-xs">{s.label}</span>
                      <span className="text-[11px] text-primary">{fmt(s.mod)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {onClose && (
            <Button variant="ghost" size="sm" className="w-full" onClick={onClose}>
              Fermer
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================
// MATCHUPS AETHERIA — Visualisation forces & faiblesses
// Fichier : src/components/compendium/AetheriaMatchups.tsx
// ============================================================

import { useState, useMemo } from "react";
import { CLASSES } from "@/lib/aetheria-data";
import {
  CLASS_MATCHUPS, MATCHUP_LOOPS,
  getMatchupData, getMatchupBetween,
  getMatchupColor, getMatchupLabel,
  type MatchupLevel,
} from "@/lib/aetheria-matchups";

// ── Badge niveau matchup ────────────────────────────────────
function MatchupBadge({ level }: { level: MatchupLevel }) {
  const color = getMatchupColor(level);
  const label = getMatchupLabel(level);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: `${color}22`, color, border: `1px solid ${color}66` }}
    >
      {label}
    </span>
  );
}

// ── Carte classe ────────────────────────────────────────────
function ClassMatchupCard({ matchupData, selected, onClick }: {
  matchupData: ReturnType<typeof getMatchupData>;
  selected: boolean;
  onClick: () => void;
}) {
  if (!matchupData) return null;
  const cls = CLASSES.find(c => c.id === matchupData.classId);
  if (!cls) return null;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10"
          : "border-border bg-card/50 hover:border-amber-500/30 hover:bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{cls.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-foreground text-sm">{cls.name}</p>
          <p className="text-xs text-muted-foreground truncate">{matchupData.playCasual}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
          cls.tier === "core"
            ? "bg-amber-500/20 text-amber-400"
            : "bg-blue-500/20 text-blue-400"
        }`}>
          {cls.tier === "core" ? "Core" : "Avancée"}
        </span>
      </div>
    </button>
  );
}

// ── Détail matchup sélectionné ──────────────────────────────
function ClassMatchupDetail({ classId }: { classId: string }) {
  const matchupData = getMatchupData(classId);
  const cls = CLASSES.find(c => c.id === classId);
  if (!matchupData || !cls) return null;

  const getClassName = (id: string) => CLASSES.find(c => c.id === id)?.name || id;
  const getClassEmoji = (id: string) => CLASSES.find(c => c.id === id)?.emoji || "⚔️";

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <span className="text-4xl">{cls.emoji}</span>
        <div>
          <h3 className="font-display text-xl font-bold text-amber-400">{cls.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{matchupData.roleDescription}</p>
          <p className="text-xs text-amber-400/70 mt-1 italic">"{matchupData.playCasual}"</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Forces */}
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <h4 className="font-display text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
            <span>✦</span> Forces
          </h4>
          <div className="space-y-3">
            {matchupData.strengths.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span>{getClassEmoji(s.againstClassId)}</span>
                  <span className="text-sm font-medium text-foreground">{getClassName(s.againstClassId)}</span>
                  <MatchupBadge level={s.level} />
                </div>
                {s.note && (
                  <p className="text-xs text-muted-foreground pl-6">{s.note}</p>
                )}
              </div>
            ))}
            {matchupData.strengths.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Polyvalent — pas de force marquée</p>
            )}
          </div>
        </div>

        {/* Faiblesses */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h4 className="font-display text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <span>✧</span> Faiblesses
          </h4>
          <div className="space-y-3">
            {matchupData.weaknesses.map((w, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span>{getClassEmoji(w.againstClassId)}</span>
                  <span className="text-sm font-medium text-foreground">{getClassName(w.againstClassId)}</span>
                  <MatchupBadge level={w.level} />
                </div>
                {w.note && (
                  <p className="text-xs text-muted-foreground pl-6">{w.note}</p>
                )}
              </div>
            ))}
            {matchupData.weaknesses.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Peu de faiblesses marquées</p>
            )}
          </div>
        </div>
      </div>

      {/* Relations spéciales */}
      {matchupData.specialRelations && matchupData.specialRelations.length > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
          <h4 className="font-display text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
            <span>◆</span> Relation Spéciale
          </h4>
          {matchupData.specialRelations.map((r, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <span>{getClassEmoji(r.againstClassId)}</span>
                <span className="text-sm font-medium text-foreground">{getClassName(r.againstClassId)}</span>
                <MatchupBadge level={r.level} />
              </div>
              {r.note && (
                <p className="text-xs text-muted-foreground mt-1">{r.note}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Matrice vs toutes les classes */}
      <div>
        <h4 className="font-display text-sm font-semibold text-foreground mb-3">
          Matchups complets
        </h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CLASS_MATCHUPS.filter(m => m.classId !== classId).map(other => {
            const otherCls = CLASSES.find(c => c.id === other.classId);
            if (!otherCls) return null;
            const matchup = getMatchupBetween(classId, other.classId);
            const color = getMatchupColor(matchup?.level || "neutre");
            return (
              <div
                key={other.classId}
                className="flex items-center gap-2 rounded-lg border p-2"
                style={{ borderColor: `${color}44`, background: `${color}0a` }}
              >
                <span className="text-lg">{otherCls.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{otherCls.name}</p>
                  <p className="text-xs" style={{ color }}>{getMatchupLabel(matchup?.level || "neutre")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Boucles / Roue ──────────────────────────────────────────
function MatchupLoops() {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-base font-semibold text-foreground">
        Roues des Forces & Faiblesses
      </h3>
      {MATCHUP_LOOPS.map(loop => {
        // Cycle: dernier == premier → on retire le doublon
        const nodes = loop.loop[loop.loop.length - 1] === loop.loop[0]
          ? loop.loop.slice(0, -1)
          : loop.loop;
        const n = nodes.length;
        const size = 280;
        const cx = size / 2;
        const cy = size / 2;
        const radius = size * 0.36;
        // Coordonnées des sommets (triangle = 3 sommets, pentagone, etc.)
        const points = nodes.map((_, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
        });
        const polygonPoints = points.map(p => `${p.x},${p.y}`).join(" ");

        return (
          <div
            key={loop.id}
            className="rounded-xl border p-4"
            style={{ borderColor: `${loop.color}44`, background: `${loop.color}08` }}
          >
            <h4
              className="font-display text-sm font-semibold mb-1"
              style={{ color: loop.color }}
            >
              {loop.label}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">{loop.description}</p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
              {/* Triangle géométrique */}
              <svg
                viewBox={`0 0 ${size} ${size}`}
                className="w-full max-w-[280px] flex-shrink-0"
                aria-label={`Roue ${loop.label}`}
              >
                <defs>
                  <marker
                    id={`arrow-${loop.id}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill={loop.color} />
                  </marker>
                </defs>

                {/* Polygone (triangle) de fond */}
                <polygon
                  points={polygonPoints}
                  fill={`${loop.color}10`}
                  stroke={`${loop.color}55`}
                  strokeWidth={1.5}
                />

                {/* Arêtes orientées (A bat B) */}
                {points.map((p, i) => {
                  const next = points[(i + 1) % n];
                  // Raccourci pour ne pas chevaucher les nœuds
                  const dx = next.x - p.x;
                  const dy = next.y - p.y;
                  const len = Math.hypot(dx, dy);
                  const pad = 28;
                  const x1 = p.x + (dx / len) * pad;
                  const y1 = p.y + (dy / len) * pad;
                  const x2 = next.x - (dx / len) * pad;
                  const y2 = next.y - (dy / len) * pad;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={loop.color}
                      strokeWidth={2}
                      markerEnd={`url(#arrow-${loop.id})`}
                    />
                  );
                })}

                {/* Nœuds (sommets) */}
                {points.map((p, i) => {
                  const cls = CLASSES.find(c => c.id === nodes[i]);
                  return (
                    <g key={`node-${i}`}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={24}
                        fill="hsl(var(--card))"
                        stroke={loop.color}
                        strokeWidth={2}
                      />
                      <text
                        x={p.x}
                        y={p.y + 6}
                        textAnchor="middle"
                        fontSize="18"
                      >
                        {cls?.emoji}
                      </text>
                      <text
                        x={p.x}
                        y={p.y + 42}
                        textAnchor="middle"
                        fontSize="11"
                        fill="hsl(var(--foreground))"
                        className="font-display font-semibold"
                      >
                        {cls?.name || nodes[i]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Liste cycle (lisible) */}
              <div className="flex flex-wrap items-center gap-1">
                {loop.loop.map((classId, i) => {
                  const cls = CLASSES.find(c => c.id === classId);
                  const isLast = i === loop.loop.length - 1;
                  const isFirst = i === 0;
                  return (
                    <div key={`${classId}-${i}`} className="flex items-center gap-1">
                      <span className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium text-foreground"
                        style={{ borderColor: `${loop.color}44`, background: `${loop.color}15` }}>
                        {cls?.emoji} {cls?.name || classId}
                        {isLast && isFirst && " (cycle)"}
                      </span>
                      {!isLast && (
                        <span className="text-muted-foreground text-xs">›</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Légende */}
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Légende
        </h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(["tres-fort", "fort", "neutre", "faible", "tres-faible", "special"] as MatchupLevel[]).map(level => (
            <div key={level} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ background: getMatchupColor(level) }} />
              <span className="text-xs text-muted-foreground">{getMatchupLabel(level)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────
export default function AetheriaMatchups() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [view, setView] = useState<"classes" | "loops">("classes");

  const { coreMatchups, advancedMatchups } = useMemo(() => {
    const core: typeof CLASS_MATCHUPS = [];
    const advanced: typeof CLASS_MATCHUPS = [];
    for (const m of CLASS_MATCHUPS) {
      const cls = CLASSES.find(c => c.id === m.classId);
      if (cls?.tier === "core") core.push(m);
      else if (cls?.tier === "advanced") advanced.push(m);
    }
    return { coreMatchups: core, advancedMatchups: advanced };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-amber-400 flex items-center gap-2">
            ⚖️ Forces & Faiblesses des Classes
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sélectionne une classe pour voir ses matchups détaillés
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5">
          <button
            onClick={() => setView("classes")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "classes" ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Classes
          </button>
          <button
            onClick={() => setView("loops")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "loops" ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Roues
          </button>
        </div>
      </div>

      {view === "loops" ? (
        <MatchupLoops />
      ) : (
        <div className={`grid gap-4 ${selectedClassId ? "lg:grid-cols-2" : ""}`}>

          {/* Liste des classes */}
          <div className="space-y-4">
            {/* Core */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/70 mb-2">
                Classes Core
              </p>
              <div className="space-y-2">
                {coreMatchups.map(m => (
                  <ClassMatchupCard
                    key={m.classId}
                    matchupData={m}
                    selected={selectedClassId === m.classId}
                    onClick={() => setSelectedClassId(
                      selectedClassId === m.classId ? null : m.classId
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Advanced */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400/70 mb-2">
                Classes Avancées
              </p>
              <div className="space-y-2">
                {advancedMatchups.map(m => (
                  <ClassMatchupCard
                    key={m.classId}
                    matchupData={m}
                    selected={selectedClassId === m.classId}
                    onClick={() => setSelectedClassId(
                      selectedClassId === m.classId ? null : m.classId
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Détail */}
          {selectedClassId && (
            <div className="sticky top-4">
              <ClassMatchupDetail classId={selectedClassId} />
            </div>
          )}

        </div>
      )}
    </div>
  );
}

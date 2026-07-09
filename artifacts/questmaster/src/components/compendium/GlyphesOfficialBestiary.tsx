// Bestiaire officiel Glyphes — Nouvel Empire.
// Composant réutilisable dans le compendium (Codex) et la page publique.

import { useState } from "react";
import { Skull, Shield, Swords } from "lucide-react";
import { GLYPHES_BESTIARY, BESTIARY_CATEGORIES, type GlyphesCreature } from "@/pages/systems/glyphes/bestiary";

const WoundRow = ({ count, icon }: { count: number; icon: "wound" | "shield" }) => (
  <div className="flex gap-1">
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className={icon === "wound" ? "text-red-400" : "text-amber-300"}>
        {icon === "wound" ? "🔴" : "🛡️"}
      </span>
    ))}
    {count === 0 && <span className="text-xs text-slate-500">aucune</span>}
  </div>
);

const CreatureCard = ({ c }: { c: GlyphesCreature }) => (
  <article className="rounded-xl border border-amber-500/20 bg-[hsl(215,68%,10%)] p-5 shadow-lg">
    <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-amber-500/15 pb-3">
      <div>
        <h3 className="font-display text-lg font-bold text-amber-300">{c.nom}</h3>
        <p className="text-[10px] uppercase tracking-wider text-amber-400/60">{c.categorie}</p>
      </div>
      {c.tags && c.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {c.tags.map((t) => (
            <span key={t} className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-300">
              {t}
            </span>
          ))}
        </div>
      )}
    </header>

    <p className="mb-3 text-sm italic leading-relaxed text-slate-400">{c.description}</p>

    {/* Blessure + Protection */}
    <div className="mb-3 grid grid-cols-2 gap-3 rounded-lg border border-white/5 bg-black/20 p-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Blessures</p>
        <WoundRow count={c.blessure} icon="wound" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Protection</p>
        <WoundRow count={c.protection} icon="shield" />
      </div>
    </div>

    {/* Caracs */}
    <div className="mb-3 grid grid-cols-6 gap-1 text-center">
      {(["PUI", "SOU", "CON", "FOI", "SOC", "ESP"] as const).map((k) => (
        <div key={k} className="rounded border border-white/5 bg-white/[0.02] p-1.5">
          <p className="text-[9px] font-bold text-amber-400/70">{k}</p>
          <p className="font-mono text-sm font-bold text-slate-200">{c.stats[k]}</p>
        </div>
      ))}
    </div>

    {/* Def / Atk */}
    <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
        <div className="mb-1 flex items-center gap-1.5 text-blue-300">
          <Shield className="h-3 w-3" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Défense</span>
        </div>
        <p className="text-slate-300"><span className="text-slate-500">Résilience</span> <span className="font-mono">{c.defense.resilience}</span></p>
        <p className="text-slate-300"><span className="text-slate-500">Esquive</span> <span className="font-mono">{c.defense.esquive}</span></p>
      </div>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
        <div className="mb-1 flex items-center gap-1.5 text-red-300">
          <Swords className="h-3 w-3" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Attaque</span>
        </div>
        <p className="text-slate-300"><span className="text-slate-500">Mêlée</span> <span className="font-mono">{c.attaque.melee}</span></p>
        <p className="text-slate-300"><span className="text-slate-500">Distance</span> <span className="font-mono">{c.attaque.distance}</span></p>
      </div>
    </div>

    {/* Aptitudes */}
    {c.aptitudes.length > 0 && (
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Aptitudes</p>
        <div className="flex flex-wrap gap-1.5">
          {c.aptitudes.map((a) => (
            <span key={a.nom} className="rounded border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-xs text-slate-300">
              {a.nom} <span className="font-mono text-amber-400">{a.niveau}</span>
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Expert */}
    {c.expert && (
      <div className="mb-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-2.5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple-300">Expert en créatures</p>
        <p className="text-xs leading-relaxed text-slate-300">{c.expert}</p>
      </div>
    )}

    {/* Capacités spéciales */}
    {c.capacites && c.capacites.length > 0 && (
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Capacités spéciales</p>
        {c.capacites.map((cap) => (
          <div key={cap.nom} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
            <p className="text-xs font-semibold text-amber-300">{cap.nom}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{cap.desc}</p>
          </div>
        ))}
      </div>
    )}
  </article>
);

export default function GlyphesOfficialBestiary() {
  const [filter, setFilter] = useState<string>("all");
  const list = filter === "all" ? GLYPHES_BESTIARY : GLYPHES_BESTIARY.filter((c) => c.categorie === filter);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <Skull className="h-6 w-6 shrink-0 text-amber-400" />
          <div>
            <h3 className="font-display text-lg font-semibold text-amber-300">Bestiaire officiel — Nouvel Empire</h3>
            <p className="mt-1 text-sm text-slate-400">
              {GLYPHES_BESTIARY.length} créatures canoniques extraites des guides officiels : bandits, faune sauvage,
              mycoïdes et gardiens de fer-argent.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            filter === "all"
              ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
          }`}
        >
          Toutes ({GLYPHES_BESTIARY.length})
        </button>
        {BESTIARY_CATEGORIES.map((cat) => {
          const count = GLYPHES_BESTIARY.filter((c) => c.categorie === cat).length;
          const active = filter === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => <CreatureCard key={c.nom} c={c} />)}
      </div>
    </div>
  );
}

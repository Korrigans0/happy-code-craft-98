// Page publique /systems — index de tous les systèmes de jeu supportés par
// Aetheria VTT. Chaque carte pointe vers un hub dédié quand il existe, sinon
// vers la page compendium associée. Style dark fantasy cohérent avec le hub
// Glyphes.

import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { SYSTEM_LIST } from "@/lib/systems";

// Systèmes dotés d'un hub public dédié (autres → renvoient vers /compendium).
const SYSTEM_HUB: Record<string, string> = {
  Glyphes: "/systems/glyphes",
};

const ACCENT_BY_ID: Record<string, string> = {
  Aetheria: "from-amber-500/30 via-amber-400/10 to-transparent",
  "Worlds Awakening": "from-purple-500/25 via-purple-400/5 to-transparent",
  "D&D 5e": "from-red-500/25 via-red-400/5 to-transparent",
  "Pathfinder 2e": "from-orange-500/25 via-orange-400/5 to-transparent",
  "Call of Cthulhu": "from-emerald-500/20 via-emerald-400/5 to-transparent",
  Glyphes: "from-indigo-500/25 via-indigo-400/5 to-transparent",
  Custom: "from-slate-500/20 via-slate-400/5 to-transparent",
};

export default function SystemsIndex() {
  return (
    <div className="relative flex min-h-screen flex-col animate-fade-in bg-[hsl(215,70%,8%)]">
      <SEO
        title="Systèmes de jeu | Aetheria VTT"
        description="Tous les systèmes JDR supportés par Aetheria VTT : Aetheria, Worlds Awakening, D&D 5e, Pathfinder 2e, L'Appel de Cthulhu, Glyphes et Homebrew."
        path="/systems"
      />
      <Header />
      <main className="flex-1 pb-24 md:pb-12">
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-amber-400/80 hover:text-amber-300"
            >
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </Link>
          </div>

          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5" /> Multi-systèmes
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold text-gradient-gold md:text-5xl">
              Systèmes de jeu
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              Chaque système reste cloisonné, avec ses propres règles, races et
              bestiaires. Aucun mélange automatique — vous choisissez à la
              création de campagne.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SYSTEM_LIST.map((sys) => {
              const href = SYSTEM_HUB[sys.id] ?? "/compendium";
              const accent =
                ACCENT_BY_ID[sys.id] ??
                "from-amber-500/20 via-amber-400/5 to-transparent";
              const hasHub = !!SYSTEM_HUB[sys.id];
              return (
                <Link key={sys.id} to={href} className="block h-full">
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[hsl(215,60%,12%)] to-[hsl(215,68%,8%)] p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-gold">
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${accent}`}
                    />
                    <div className="relative">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-2xl">
                        {sys.emoji ?? "📖"}
                      </div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-400/70">
                        {sys.shortLabel ?? sys.id}
                      </div>
                      <h2 className="font-display text-2xl font-bold text-slate-100">
                        {sys.label}
                      </h2>
                      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-400">
                        {sys.description}
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                          {sys.featured
                            ? "Système phare"
                            : sys.partner
                            ? "Partenaire"
                            : sys.custom
                            ? "Homebrew"
                            : "Supporté"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-400 transition-transform group-hover:translate-x-1">
                          {hasHub ? "Découvrir" : "Compendium"}{" "}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

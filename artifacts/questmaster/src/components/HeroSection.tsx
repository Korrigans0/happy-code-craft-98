import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sword, BookOpen, Sparkles, Users, Gem, Cloud, Shield } from "lucide-react";
import heroBg from "@/assets/hero-fantasy-bg.jpg";
import MagicParticles from "./fantasy/MagicParticles";
import FloatingRunes from "./fantasy/FloatingRunes";
import MistOverlay from "./fantasy/MistOverlay";
import SideDecorations from "./fantasy/SideDecorations";

const badges = [
  { icon: Users, label: "MJ & PJ", sub: "Réunis", hue: 43 },
  { icon: Sparkles, label: "WA", sub: "Intégré", hue: 270 },
  { icon: Gem, label: "VTT", sub: "Immersif", hue: 190 },
  { icon: Cloud, label: "Cloud", sub: "Sécurisé", hue: 155 },
];

const HeroSection = () => {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden">
      {/* ── Fond image fantasy ── */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        {/* Vignette + overlay sombre pour lisibilité */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(215, 70%, 6%, 0.35) 0%, hsl(215, 75%, 5%, 0.75) 70%, hsl(215, 80%, 4%, 0.95) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{
            background:
              "linear-gradient(to bottom, transparent, hsl(215, 70%, 8%))",
          }}
        />
      </div>

      {/* ── Ambiance ── */}
      <MistOverlay />
      <SideDecorations />
      <MagicParticles />
      <FloatingRunes />

      {/* ── Contenu ── */}
      <div className="relative mx-auto max-w-5xl px-4 py-24 text-center md:py-36 md:px-6">
        {/* Tagline runique */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div
            className="h-px w-16 md:w-24"
            style={{ background: "linear-gradient(90deg, transparent, hsl(43, 75%, 55%))" }}
          />
          <Shield className="h-3.5 w-3.5 text-amber-400/70" />
          <span className="font-display text-[10px] md:text-xs uppercase tracking-[0.35em] text-amber-300/70">
            Table Virtuelle Immersive
          </span>
          <Shield className="h-3.5 w-3.5 text-amber-400/70" />
          <div
            className="h-px w-16 md:w-24"
            style={{ background: "linear-gradient(270deg, transparent, hsl(43, 75%, 55%))" }}
          />
        </div>

        {/* Titre */}
        <h1 className="font-display text-5xl font-bold tracking-wide text-gradient-gold md:text-7xl lg:text-8xl">
          AETHERIA
        </h1>
        <p
          className="mt-1 font-display text-2xl font-semibold tracking-[0.4em] md:text-3xl"
          style={{
            background: "linear-gradient(90deg, hsl(190, 95%, 75%), hsl(270, 80%, 75%))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          VTT
        </p>

        <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-slate-300/85 md:text-base">
          Entrez dans l'univers d'Aetheria, où la magie prend vie et où chaque
          histoire devient légendaire. Créez, explorez, partagez des aventures
          épiques dans un VTT pensé pour les MJ et les joueurs.
        </p>

        {/* CTAs */}
        {!loading && (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            {user ? (
              <>
                <Button asChild size="lg" className="shadow-gold group font-bold" style={{ background: "linear-gradient(135deg, hsl(43,80%,55%) 0%, hsl(35,90%,45%) 100%)", color: "hsl(215,70%,8%)" }}>
                  <Link to="/campaigns">
                    <Sword className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                    Créer mon aventure
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="group border-cyan-400/30 bg-slate-950/40 backdrop-blur hover:border-cyan-400/60 hover:bg-cyan-500/5">
                  <Link to="/compendium">
                    <BookOpen className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Explorer le Codex
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="shadow-gold group font-bold" style={{ background: "linear-gradient(135deg, hsl(43,80%,55%) 0%, hsl(35,90%,45%) 100%)", color: "hsl(215,70%,8%)" }}>
                  <Link to="/sign-up">
                    <Sparkles className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                    Créer mon aventure
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="group border-cyan-400/30 bg-slate-950/40 backdrop-blur hover:border-cyan-400/60 hover:bg-cyan-500/5">
                  <Link to="/campaigns">
                    <Sword className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Rejoindre une partie
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="mx-auto mt-14 grid max-w-2xl grid-cols-4 gap-3 md:gap-6">
          {badges.map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-1.5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border md:h-14 md:w-14"
                style={{
                  borderColor: `hsl(${b.hue}, 75%, 55%, 0.4)`,
                  background: `radial-gradient(circle, hsl(${b.hue}, 70%, 30%, 0.35) 0%, hsl(215, 70%, 10%, 0.6) 100%)`,
                  boxShadow: `0 0 18px hsl(${b.hue}, 80%, 55%, 0.25), inset 0 0 12px hsl(${b.hue}, 80%, 55%, 0.1)`,
                }}
              >
                <b.icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: `hsl(${b.hue}, 85%, 70%)` }} />
              </div>
              <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-slate-200 md:text-xs">
                {b.label}
              </span>
              <span className="text-[9px] text-slate-400 md:text-[10px]">{b.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

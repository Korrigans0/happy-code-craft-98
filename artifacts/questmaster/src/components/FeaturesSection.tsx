import { Link } from "react-router-dom";
import { Sparkles, Sword, User, BookOpen, Map, Globe } from "lucide-react";
import cardCampaigns from "@/assets/card-campaigns.jpg";
import cardCharacters from "@/assets/card-characters.jpg";
import cardCodex from "@/assets/card-codex.jpg";
import cardVtt from "@/assets/card-vtt.jpg";
import cardUniverse from "@/assets/card-universe.jpg";

interface Feature {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  hue: number;
  cta: string;
}

const features: Feature[] = [
  { icon: Sword, title: "Campagnes", subtitle: "Organisez sessions et joueurs en toute simplicité.", href: "/campaigns", image: cardCampaigns, hue: 43, cta: "Lancer" },
  { icon: User, title: "Personnages", subtitle: "Fiches Aetheria complètes, évolutives et illustrées.", href: "/characters", image: cardCharacters, hue: 320, cta: "Créer" },
  { icon: BookOpen, title: "Codex", subtitle: "Bestiaire, races, classes et lore vivant.", href: "/compendium", image: cardCodex, hue: 270, cta: "Explorer" },
  { icon: Map, title: "Table virtuelle", subtitle: "Plateau, tokens, murs et lumières dynamiques.", href: "/campaigns", image: cardVtt, hue: 155, cta: "Voir" },
  { icon: Globe, title: "Univers", subtitle: "Aetheria & Worlds Awakening, deux mondes intégrés.", href: "/compendium", image: cardUniverse, hue: 43, cta: "Découvrir" },
];

const FeaturesSection = () => {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/5 px-4 py-1.5 text-xs font-medium text-amber-300 backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Conçu pour vos aventures
          </div>
          <h2 className="font-display text-3xl font-bold text-gradient-gold md:text-5xl">
            Tout pour vos aventures
          </h2>
          <p className="mt-3 text-sm text-slate-400 md:text-base">
            Des outils puissants pour des expériences inoubliables
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.href}
              className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: `hsl(${f.hue}, 75%, 55%, 0.25)`,
                background:
                  "linear-gradient(160deg, hsl(215, 60%, 12%, 0.85) 0%, hsl(230, 65%, 9%, 0.95) 100%)",
                boxShadow:
                  "0 8px 32px hsl(0,0%,0%,0.5), inset 0 1px 0 hsl(43, 75%, 50%, 0.06)",
              }}
            >
              {/* Image illustration */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={f.image}
                  alt={f.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to bottom, hsl(215, 70%, 8%, 0.1) 0%, hsl(215, 70%, 8%, 0.9) 100%), radial-gradient(ellipse at top right, hsl(${f.hue}, 80%, 55%, 0.25), transparent 60%)`,
                  }}
                />
                {/* Glow halo */}
                <div
                  className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `hsl(${f.hue}, 80%, 55%)` }}
                />
              </div>

              {/* Contenu */}
              <div className="relative space-y-2 p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: `hsl(${f.hue}, 75%, 55%, 0.4)`,
                      background: `hsl(${f.hue}, 70%, 30%, 0.25)`,
                      boxShadow: `0 0 14px hsl(${f.hue}, 80%, 55%, 0.3)`,
                    }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: `hsl(${f.hue}, 85%, 70%)` }} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-100">{f.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{f.subtitle}</p>
                <div className="pt-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all"
                    style={{ color: `hsl(${f.hue}, 85%, 70%)` }}
                  >
                    {f.cta}
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </div>

              {/* Bordure runique top */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
                style={{
                  background: `linear-gradient(90deg, transparent, hsl(${f.hue}, 85%, 65%), transparent)`,
                }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

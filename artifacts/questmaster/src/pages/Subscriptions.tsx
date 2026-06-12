import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Sword, User, Star } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import MagicParticles from "@/components/fantasy/MagicParticles";
import MistOverlay from "@/components/fantasy/MistOverlay";
import FloatingRunes from "@/components/fantasy/FloatingRunes";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  hue: number;
  icon: typeof Crown;
  features: string[];
  highlight?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Aetheria",
    price: "0 €",
    period: "à vie",
    tagline: "Pour découvrir l'aventure",
    hue: 190,
    icon: Sparkles,
    cta: "Commencer",
    features: [
      "3 campagnes actives",
      "3 personnages actifs",
      "Jusqu'à 5 joueurs par campagne",
      "1 To de stockage",
      "Brouillard de guerre",
      "Vision des tokens",
      "Lumières de base",
      "Codex Aetheria & Worlds Awakening",
    ],
  },
  {
    id: "pj",
    name: "Premium PJ",
    price: "2 €",
    period: "/mois",
    tagline: "Pour les joueurs passionnés",
    hue: 270,
    icon: User,
    cta: "Choisir PJ",
    features: [
      "20 personnages actifs",
      "Inventaire avancé",
      "Portraits HD",
      "Historique complet",
      "Effets visuels",
      "Accès anticipé aux nouveautés",
    ],
  },
  {
    id: "mj",
    name: "Premium MJ",
    price: "3 €",
    period: "/mois",
    tagline: "Pour les Maîtres de Jeu",
    hue: 43,
    icon: Sword,
    cta: "Choisir MJ",
    features: [
      "20 campagnes actives",
      "Jusqu'à 10 joueurs par campagne",
      "5 To de stockage",
      "Lumières dynamiques avancées",
      "Murs dynamiques avancés",
      "Sauvegardes automatiques",
      "Import optimisé des cartes",
    ],
  },
  {
    id: "mixte",
    name: "Premium Mixte",
    price: "4 €",
    period: "/mois",
    tagline: "Le pouvoir absolu",
    hue: 320,
    icon: Crown,
    highlight: true,
    cta: "Devenir Fondateur",
    features: [
      "50 campagnes actives",
      "50 personnages actifs",
      "Jusqu'à 10 joueurs par campagne",
      "10 To de stockage",
      "Toutes les fonctionnalités Premium MJ",
      "Toutes les fonctionnalités Premium PJ",
      "Badge Fondateur",
      "Priorité sur les nouvelles fonctionnalités",
      "Création de mondes illimitée",
    ],
  },
];

const Subscriptions = () => {
  const handleSelect = (planName: string) => {
    toast.info(`Bientôt disponible — ${planName}`, {
      description: "Les abonnements seront activables prochainement.",
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-dark">
      <SEO
        title="Abonnements — Aetheria VTT premium"
        description="Découvrez les offres Aetheria VTT : Gratuit, Premium PJ, Premium MJ et Premium Mixte. Plus de campagnes, plus de stockage, plus de magie."
        path="/subscriptions"
      />
      <Header />

      <main className="relative flex-1 overflow-hidden">
        {/* Ambiance fond */}
        <div className="pointer-events-none absolute inset-0">
          <MistOverlay />
          <MagicParticles density={0.6} />
          <FloatingRunes />
        </div>

        <section className="container relative mx-auto px-4 py-16 md:px-6 md:py-24">
          {/* Header */}
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/5 px-4 py-1.5 text-xs font-medium text-amber-300 backdrop-blur">
              <Crown className="h-3 w-3" />
              Offres Aetheria
            </div>
            <h1 className="font-display text-4xl font-bold text-gradient-gold md:text-6xl">
              Choisissez votre voie
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 md:text-base">
              Quatre offres pensées pour les aventuriers, les Maîtres de Jeu et
              les architectes de mondes.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                  p.highlight ? "lg:scale-[1.03]" : ""
                }`}
                style={{
                  borderColor: p.highlight
                    ? "hsl(43, 80%, 55%, 0.55)"
                    : `hsl(${p.hue}, 75%, 55%, 0.25)`,
                  background:
                    "linear-gradient(160deg, hsl(215, 60%, 12%, 0.85) 0%, hsl(230, 65%, 9%, 0.95) 100%)",
                  boxShadow: p.highlight
                    ? "0 18px 60px hsl(0,0%,0%,0.65), 0 0 40px hsl(43, 80%, 55%, 0.25)"
                    : "0 8px 32px hsl(0,0%,0%,0.5)",
                }}
              >
                {p.highlight && (
                  <div
                    className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-md px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      background: "linear-gradient(135deg, hsl(43,80%,55%), hsl(35,90%,45%))",
                      color: "hsl(215,70%,8%)",
                    }}
                  >
                    <Star className="mr-1 inline h-3 w-3" />
                    Recommandé
                  </div>
                )}

                <div
                  className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full opacity-30 blur-3xl"
                  style={{ background: `hsl(${p.hue}, 80%, 55%)` }}
                />

                {/* Header carte */}
                <div className="relative flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: `hsl(${p.hue}, 75%, 55%, 0.4)`,
                      background: `hsl(${p.hue}, 70%, 30%, 0.25)`,
                      boxShadow: `0 0 16px hsl(${p.hue}, 80%, 55%, 0.35)`,
                    }}
                  >
                    <p.icon className="h-5 w-5" style={{ color: `hsl(${p.hue}, 85%, 70%)` }} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-100">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.tagline}</p>
                  </div>
                </div>

                {/* Prix */}
                <div className="relative mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-bold text-gradient-gold">
                    {p.price}
                  </span>
                  <span className="text-sm text-slate-500">{p.period}</span>
                </div>

                <div
                  className="relative my-5 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, hsl(${p.hue}, 75%, 55%, 0.4), transparent)`,
                  }}
                />

                {/* Liste */}
                <ul className="relative flex-1 space-y-2.5">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: `hsl(${p.hue}, 85%, 65%)` }}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="relative mt-6">
                  {p.id === "free" ? (
                    <Button asChild className="w-full font-bold" variant="outline">
                      <Link to="/sign-up">{p.cta}</Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full font-bold"
                      onClick={() => handleSelect(p.name)}
                      style={
                        p.highlight
                          ? {
                              background:
                                "linear-gradient(135deg, hsl(43,80%,55%) 0%, hsl(35,90%,45%) 100%)",
                              color: "hsl(215,70%,8%)",
                            }
                          : {
                              background: `linear-gradient(135deg, hsl(${p.hue}, 75%, 50%) 0%, hsl(${p.hue}, 70%, 35%) 100%)`,
                              color: "hsl(215,70%,8%)",
                            }
                      }
                    >
                      {p.cta}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-slate-500">
            Les paiements seront activés prochainement. Tous les abonnements
            seront sans engagement, annulables à tout moment.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Subscriptions;

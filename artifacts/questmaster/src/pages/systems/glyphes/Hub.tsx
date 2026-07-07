import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ArrowRight, Sword, Hourglass, Rocket, ArrowLeft, BookOpen } from "lucide-react";

const ERAS = [
  {
    id: "nouvel-empire",
    title: "Nouvel Empire",
    subtitle: "Médiéval Fantastique",
    desc: "1527 AE. Les Territoires Libres se relèvent des cendres de l'Empire. Évocateurs traqués, brumes envahissantes, factions à l'affût.",
    icon: Sword,
    status: "Disponible",
    available: true,
    accent: "from-amber-500/30 via-amber-400/10 to-transparent",
  },
  {
    id: "present",
    title: "Présent",
    subtitle: "Ère contemporaine",
    desc: "Le monde post-brisure aujourd'hui. Modulé sur les conflits modernes, les sociétés bouleversées par la brume.",
    icon: Hourglass,
    status: "En développement",
    available: false,
    accent: "from-slate-500/20 via-slate-400/5 to-transparent",
  },
  {
    id: "futur",
    title: "Futur",
    subtitle: "Anticipation",
    desc: "Demain, quand la technologie tente de domestiquer le flux. Conflit entre science et glyphes antiques.",
    icon: Rocket,
    status: "En développement",
    available: false,
    accent: "from-indigo-500/20 via-indigo-400/5 to-transparent",
  },
];

export default function GlyphesHub() {
  return (
    <div className="relative flex min-h-screen flex-col animate-fade-in bg-[hsl(215,70%,8%)]">
      <SEO
        title="Glyphes — Système JDR | Aetheria VTT"
        description="Glyphes : système modulaire dark fantasy en trois époques. Nouvel Empire (médiéval), Présent et Futur."
        path="/systems/glyphes"
      />
      <Header />
      <main className="flex-1 pb-24 md:pb-12">
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
          <div className="mb-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-amber-400/80 hover:text-amber-300">
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </Link>
          </div>

          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <BookOpen className="h-3.5 w-3.5" /> Système modulaire
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold text-gradient-gold md:text-5xl">
              Glyphes
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              Un univers dark fantasy où les océans ont disparu, engloutis par <em>la Brume</em> depuis
              la <strong>Brisure du Monde</strong>. La magie repose sur des glyphes anciens, gravés
              dans le Flux — pouvoir immense, danger ultime. Trois époques. Un seul système modulaire.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {ERAS.map((era) => {
              const Icon = era.icon;
              const card = (
                <div
                  className={`group relative h-full overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[hsl(215,60%,12%)] to-[hsl(215,68%,8%)] p-6 shadow-card transition-all duration-300 ${
                    era.available ? "hover:-translate-y-1 hover:shadow-gold hover:border-amber-400/60" : "opacity-80"
                  }`}
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${era.accent}`} />
                  <div className="relative">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                      <Icon className="h-7 w-7 text-amber-400" />
                    </div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-400/70">
                      {era.subtitle}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-slate-100">{era.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">{era.desc}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                          era.available
                            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border border-slate-500/40 bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {era.status}
                      </span>
                      {era.available && (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-400 transition-transform group-hover:translate-x-1">
                          Explorer <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
              return (
                <Link key={era.id} to={`/systems/glyphes/${era.id}`} className="block h-full">
                  {card}
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/systems/glyphes/compendium"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-300 transition-all hover:bg-amber-500/20"
            >
              <BookOpen className="h-4 w-4" />
              Compendium Glyphes — Races, Origines, Archétypes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

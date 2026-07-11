import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ArrowLeft, Hourglass, Rocket } from "lucide-react";

interface Props {
  era: "present" | "futur";
}

const META = {
  present: {
    title: "Expédition",
    subtitle: "Ère contemporaine",
    icon: Hourglass,
    desc: "Le monde post-brisure aujourd'hui. Sociétés bouleversées par la brume, factions modernes, héritage des glyphes anciens.",
  },
  futur: {
    title: "Odyssée",
    subtitle: "Anticipation",
    icon: Rocket,
    desc: "Demain, quand la technologie tente de domestiquer le flux. Affrontement entre science et glyphes antiques.",
  },
} as const;

export default function ComingSoon({ era }: Props) {
  const m = META[era];
  const Icon = m.icon;
  return (
    <div className="relative flex min-h-screen flex-col animate-fade-in bg-[hsl(215,70%,8%)]">
      <SEO
        title={`${m.title} — Glyphes | Aetheria VTT`}
        description={`Module ${m.title} du système Glyphes — en développement.`}
        path={`/systems/glyphes/${era}`}
      />
      <Header />
      <main className="flex-1 pb-24 md:pb-12">
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-20">
          <Link
            to="/systems/glyphes"
            className="mb-8 inline-flex items-center gap-2 text-sm text-amber-400/80 hover:text-amber-300"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à Glyphes
          </Link>

          <div className="mx-auto max-w-2xl rounded-3xl border border-amber-500/20 bg-gradient-to-b from-[hsl(215,60%,12%)] to-[hsl(215,68%,8%)] p-10 text-center shadow-card">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
              <Icon className="h-10 w-10 text-amber-400" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-400/70">
              {m.subtitle}
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold text-gradient-gold md:text-5xl">
              {m.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-300">{m.desc}</p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-500/10 px-4 py-2 text-sm font-semibold text-slate-300">
              <Hourglass className="h-4 w-4 animate-pulse" />
              Ce module est en développement et sera disponible prochainement.
            </div>
            <div className="mt-8">
              <Link
                to="/systems/glyphes"
                className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/20"
              >
                <ArrowLeft className="h-4 w-4" /> Retour au hub Glyphes
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

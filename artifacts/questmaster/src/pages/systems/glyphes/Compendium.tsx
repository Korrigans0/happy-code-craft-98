import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ArrowLeft, Users, Compass, Swords, BookOpen, Skull, Shield, Sparkles, Scroll, Star } from "lucide-react";
import {
  RACES, FACTIONS, ATLAS, DONS, APTITUDES,
  ARMES_CATEGORIES, ARMURES_CATEGORIES, OBJETS_QUALITE,
  GLYPHES_CONNUS, FABRICATION_TABLE, MAGNITUDE_DEGATS, TEMPETE_PAR_ND,
  CARACTERISTIQUES, NIVEAUX_DES, DIFFICULTES, RANGS, RICHESSES, SENS,
  ACTIONS_HEROIQUES, ETATS, IMMERSION_TABLE,
} from "./data";
import GlyphesOfficialBestiary from "@/components/compendium/GlyphesOfficialBestiary";

type TabId = "regles" | "races" | "origines" | "classes" | "dons" | "bestiaire" | "equipement" | "magie";

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "regles", label: "Règles", icon: Scroll },
  { id: "races", label: "Races", icon: Users },
  { id: "origines", label: "Origines", icon: Compass },
  { id: "classes", label: "Archétypes", icon: Swords },
  { id: "dons", label: "Dons & Aptitudes", icon: Star },
  { id: "bestiaire", label: "Bestiaire", icon: Skull },
  { id: "equipement", label: "Équipement", icon: Shield },
  { id: "magie", label: "Magie", icon: Sparkles },
];

// Archétypes construits à partir des dons + aptitudes emblématiques.
// Glyphes est un système « sans classes » : ces archétypes servent de guide de création.
const ARCHETYPES = [
  {
    nom: "Combattant",
    theme: "Martial",
    desc: "Guerrier de première ligne, tacticien de mêlée ou de tir. Dépense l'héroïsme pour frapper fort et souvent.",
    dons: ["Stratège", "Écorcheur", "Combattant"],
    aptitudes: ["Armes légères de mêlée", "Armes lourdes de mêlée", "Pied léger"],
  },
  {
    nom: "Fidèle",
    theme: "Foi",
    desc: "Voix du divin ou serment personnel. Inspire ses alliés, résiste à la peur, canalise la conviction.",
    dons: ["Courage radiant", "Fidèle compagnon", "Choisi"],
    aptitudes: ["Courageux", "Persuasion", "Érudition"],
  },
  {
    nom: "Évocateur",
    theme: "Esprit",
    desc: "Manipule les glyphes du flux, officiellement formé ou sauvage. Puissant mais toujours en danger.",
    dons: ["Évocateur officiel", "Évocateur sauvage", "Marqué"],
    aptitudes: ["Forge-glyphe", "Déduction", "Érudition"],
  },
  {
    nom: "Rôdeur",
    theme: "Survie",
    desc: "Éclaireur, pisteur, herboriste. À l'aise dans la sauvagerie, prépare toujours l'inattendu.",
    dons: ["Toujours prêt", "Insaisissable", "Expert en créatures"],
    aptitudes: ["Scout", "Traqueur", "Botanique", "Camouflage"],
  },
  {
    nom: "Ombre",
    theme: "Furtivité",
    desc: "Espion, cambrioleur, assassin. Frappe une fois puis disparaît.",
    dons: ["Insaisissable", "Expert en créatures"],
    aptitudes: ["Camouflage", "Main légère", "Pied léger", "Tromperie"],
  },
  {
    nom: "Diplomate",
    theme: "Social",
    desc: "Marchand, négociateur, courtisan. Manie la parole comme une arme.",
    dons: ["Visage", "Linguiste"],
    aptitudes: ["Charme", "Persuasion", "Négociateur", "Tromperie"],
  },
  {
    nom: "Rêveur",
    theme: "Onirique",
    desc: "Mange-songe capable d'invoquer compagnons ou cauchemars selon son repos.",
    dons: ["Rêveur", "Araignée"],
    aptitudes: ["Médecin", "Déduction", "Forge-glyphe"],
  },
];

export default function GlyphesCompendium() {
  const [tab, setTab] = useState<TabId>("races");

  return (
    <div className="relative flex min-h-screen flex-col animate-fade-in bg-[hsl(215,70%,8%)]">
      <SEO
        title="Compendium Glyphes — Races, Origines, Archétypes | Aetheria VTT"
        description="Compendium officiel du système Glyphes : races jouables, origines (factions et territoires), archétypes de personnage."
        path="/systems/glyphes/compendium"
      />
      <Header />
      <main className="flex-1 pb-24 md:pb-12">
        <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
          <div className="mb-4">
            <Link to="/systems/glyphes" className="inline-flex items-center gap-2 text-sm text-amber-400/80 hover:text-amber-300">
              <ArrowLeft className="h-4 w-4" /> Retour au hub Glyphes
            </Link>
          </div>

          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <BookOpen className="h-3.5 w-3.5" /> Compendium officiel
            </div>
            <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold text-gradient-gold">
              Compendium Glyphes
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-slate-400">
              Toutes les briques de création pour incarner un personnage dans les Territoires Libres.
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "races" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {RACES.map((r) => (
                <article
                  key={r.nom}
                  className="rounded-xl border border-amber-500/15 bg-[hsl(215,68%,10%)] p-5 shadow-lg"
                >
                  <h3 className="font-display text-xl text-amber-300">{r.nom}</h3>
                  <p className="mt-2 text-sm text-slate-400">{r.desc}</p>
                  <ul className="mt-3 space-y-1.5">
                    {r.traits.map((t, i) => (
                      <li key={i} className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-amber-400/70">▸</span> {t}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}

          {tab === "origines" && (
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-2xl text-amber-300 mb-4">Factions</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {FACTIONS.map((f) => (
                    <article
                      key={f.nom}
                      className="rounded-xl border border-amber-500/15 bg-[hsl(215,68%,10%)] p-5"
                    >
                      <h3 className="font-display text-lg text-amber-200">{f.nom}</h3>
                      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl text-amber-300 mb-4">Territoires Libres</h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {ATLAS.map((a) => (
                    <article
                      key={a.lieu}
                      className="rounded-lg border border-white/10 bg-[hsl(215,68%,9%)] p-4"
                    >
                      <h3 className="font-semibold text-amber-200">{a.lieu}</h3>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{a.desc}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "classes" && (
            <div className="space-y-6">
              <p className="text-center text-sm text-slate-400 max-w-2xl mx-auto">
                Glyphes est un système sans classes fixes. Ces archétypes rassemblent des dons et
                aptitudes qui fonctionnent bien ensemble pour vous guider à la création.
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ARCHETYPES.map((a) => (
                  <article
                    key={a.nom}
                    className="rounded-xl border border-amber-500/15 bg-[hsl(215,68%,10%)] p-5"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-xl text-amber-300">{a.nom}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-amber-400/60">
                        {a.theme}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{a.desc}</p>
                    <div className="mt-3">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Dons clés</p>
                      <p className="text-xs text-slate-300 mt-1">{a.dons.join(" · ")}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Aptitudes</p>
                      <p className="text-xs text-slate-300 mt-1">{a.aptitudes.join(" · ")}</p>
                    </div>
                  </article>
                ))}
              </div>
              <p className="text-center text-xs text-slate-500 pt-4">
                Voir la liste complète des dons ({DONS.reduce((n, d) => n + d.items.length, 0)}) et
                aptitudes ({APTITUDES.reduce((n, a) => n + a.items.length, 0)}) dans la page{" "}
                <Link to="/systems/glyphes/nouvel-empire" className="text-amber-400 hover:underline">
                  Nouvel Empire
                </Link>
                .
              </p>
            </div>
          )}

          {tab === "bestiaire" && <GlyphesOfficialBestiary />}

          {tab === "equipement" && (
            <div className="space-y-10">
              <div>
                <h2 className="font-display text-2xl text-amber-300 mb-4">Armes</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {ARMES_CATEGORIES.map((a) => (
                    <article key={a.cat} className="rounded-xl border border-amber-500/15 bg-[hsl(215,68%,10%)] p-5">
                      <h3 className="font-display text-lg text-amber-200">{a.cat}</h3>
                      <p className="mt-1 text-sm text-slate-400">{a.desc}</p>
                      <p className="mt-2 text-xs text-slate-500"><span className="text-amber-400/70">Exemples :</span> {a.exemples}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl text-amber-300 mb-4">Armures</h2>
                <div className="overflow-x-auto rounded-xl border border-amber-500/15 bg-[hsl(215,68%,10%)]">
                  <table className="w-full text-sm">
                    <thead className="bg-amber-500/10 text-amber-300">
                      <tr>
                        <th className="px-4 py-2 text-left">Catégorie</th>
                        <th className="px-4 py-2 text-center">Protection</th>
                        <th className="px-4 py-2 text-center">Esquive</th>
                        <th className="px-4 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ARMURES_CATEGORIES.map((a) => (
                        <tr key={a.cat} className="border-t border-white/5 text-slate-300">
                          <td className="px-4 py-2 font-semibold text-amber-200">{a.cat}</td>
                          <td className="px-4 py-2 text-center font-mono">{a.protection}</td>
                          <td className="px-4 py-2 text-center font-mono">{a.bonus}</td>
                          <td className="px-4 py-2 text-slate-400">{a.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl text-amber-300 mb-4">Objets de qualité</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {OBJETS_QUALITE.map((o) => (
                    <article key={o.type} className="rounded-lg border border-white/10 bg-[hsl(215,68%,9%)] p-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-sm font-semibold text-amber-200">{o.type}</h3>
                        <span className="shrink-0 text-xs font-mono text-amber-400/80">{o.prix}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{o.effet}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "magie" && (
            <div className="space-y-10">
              <div>
                <h2 className="font-display text-2xl text-amber-300 mb-4">Glyphes connus</h2>
                <p className="text-sm text-slate-400 mb-4 max-w-2xl">
                  Seuls trois glyphes sont documentés dans le Nouvel Empire. Chaque évocateur en découvre
                  d'autres au fil de son voyage — la magie reste rare et instable.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {GLYPHES_CONNUS.map((g) => (
                    <article key={g.nom} className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-5">
                      <h3 className="font-display text-xl text-purple-200">{g.nom}</h3>
                      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{g.desc}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl text-amber-300 mb-4">Fabrication d'un sort</h2>
                <div className="overflow-x-auto rounded-xl border border-amber-500/15 bg-[hsl(215,68%,10%)]">
                  <table className="w-full text-sm">
                    <thead className="bg-amber-500/10 text-amber-300">
                      <tr>
                        <th className="px-4 py-2 text-center">Coût</th>
                        <th className="px-4 py-2 text-left">Zone</th>
                        <th className="px-4 py-2 text-left">Durée</th>
                        <th className="px-4 py-2 text-left">Temps de fabrication</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FABRICATION_TABLE.map((f, i) => (
                        <tr key={i} className="border-t border-white/5 text-slate-300">
                          <td className="px-4 py-2 text-center font-mono text-amber-200">{f.cout}</td>
                          <td className="px-4 py-2">{f.zone}</td>
                          <td className="px-4 py-2">{f.duree}</td>
                          <td className="px-4 py-2 text-slate-400">{f.temps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h2 className="font-display text-xl text-amber-300 mb-3">Magnitude des dégâts</h2>
                  <div className="rounded-xl border border-amber-500/15 bg-[hsl(215,68%,10%)] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-amber-500/10 text-amber-300">
                        <tr>
                          <th className="px-4 py-2 text-center">Résilience visée</th>
                          <th className="px-4 py-2 text-center">Coût en âme</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MAGNITUDE_DEGATS.map((m) => (
                          <tr key={m.resilience} className="border-t border-white/5 text-slate-300">
                            <td className="px-4 py-2 text-center font-mono">{m.resilience}</td>
                            <td className="px-4 py-2 text-center font-mono text-amber-200">{m.cout}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-xl text-amber-300 mb-3">Tempête spirituelle</h2>
                  <div className="rounded-xl border border-amber-500/15 bg-[hsl(215,68%,10%)] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-amber-500/10 text-amber-300">
                        <tr>
                          <th className="px-4 py-2 text-center">Niveau de difficulté</th>
                          <th className="px-4 py-2 text-center">Points de tempête</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TEMPETE_PAR_ND.map((t) => (
                          <tr key={t.nd} className="border-t border-white/5 text-slate-300">
                            <td className="px-4 py-2 text-center">{t.nd}</td>
                            <td className="px-4 py-2 text-center font-mono text-amber-200">{t.tempete}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

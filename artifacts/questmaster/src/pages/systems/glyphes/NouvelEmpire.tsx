import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ArrowLeft, Menu, X, Sparkles } from "lucide-react";
import {
  SECTIONS, CARACTERISTIQUES, NIVEAUX_DES, DIFFICULTES, RANGS, RICHESSES, SENS,
  DONS, RACES, ACTIONS_HEROIQUES, APTITUDES, ETATS, IMMERSION_TABLE, TEMPETE_PAR_ND,
  MAGNITUDE_DEGATS, GLYPHES_CONNUS, FABRICATION_TABLE, ARMES_CATEGORIES, ARMURES_CATEGORIES,
  OBJETS_QUALITE, FACTIONS, ATLAS, ANNEE_DE_REFERENCE, SectionId,
} from "./data";

// ── Atomes ───────────────────────────────────────────────────────────────
const H = ({ id, n, children }: { id: SectionId; n: number; children: React.ReactNode }) => (
  <header id={id} className="mb-5 scroll-mt-24 border-b border-amber-500/20 pb-3">
    <div className="text-[10px] font-semibold uppercase tracking-[3px] text-amber-400/60">
      Section {String(n).padStart(2, "0")}
    </div>
    <h2 className="font-display text-2xl font-bold text-gradient-gold md:text-3xl">{children}</h2>
  </header>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 leading-relaxed text-slate-300">{children}</p>
);
const Strong = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-amber-300">{children}</strong>
);
const Quote = ({ children }: { children: React.ReactNode }) => (
  <blockquote className="my-4 rounded-r-lg border-l-4 border-amber-500/60 bg-amber-500/5 px-4 py-3 italic text-slate-300">
    {children}
  </blockquote>
);
const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="mb-4 rounded-xl border border-amber-500/20 bg-[hsl(215,60%,11%)]/60 p-4">
    {title && <h3 className="mb-2 font-display text-base font-semibold text-amber-300">{title}</h3>}
    <div className="text-sm leading-relaxed text-slate-300">{children}</div>
  </div>
);

const Table = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
  <div className="my-4 overflow-x-auto rounded-lg border border-amber-500/20">
    <table className="w-full text-sm">
      <thead className="bg-amber-500/10 text-amber-300">
        <tr>{head.map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody className="text-slate-300">
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 ? "bg-white/[0.02]" : ""}>
            {row.map((c, j) => <td key={j} className="border-t border-white/5 px-3 py-2">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Accordion = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-amber-500/20 bg-[hsl(215,60%,11%)]/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-amber-500/5"
      >
        <span className="flex items-center gap-2">
          <span className="font-display font-semibold text-amber-200">{title}</span>
          {badge && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">{badge}</span>}
        </span>
        <span className="text-amber-400">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="border-t border-amber-500/15 px-4 py-3 text-sm leading-relaxed text-slate-300">{children}</div>}
    </div>
  );
};

// ── Page ────────────────────────────────────────────────────────────────
export default function NouvelEmpire() {
  const [navOpen, setNavOpen] = useState(false);
  const [active, setActive] = useState<SectionId>("avant-propos");

  // Active section via IntersectionObserver
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id as SectionId);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const nav = useMemo(
    () => (
      <nav className="space-y-1">
        {SECTIONS.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={() => setNavOpen(false)}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${
              active === s.id
                ? "bg-amber-500/15 text-amber-300"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <span className="w-5 text-right tabular-nums text-amber-500/40">{String(i + 1).padStart(2, "0")}</span>
            <span className="truncate">{s.label}</span>
          </a>
        ))}
      </nav>
    ),
    [active]
  );

  return (
    <div className="relative flex min-h-screen flex-col bg-[hsl(215,70%,8%)]">
      <SEO
        title="Nouvel Empire — Glyphes | Aetheria VTT"
        description="Module Médiéval Fantastique du système Glyphes. Règles complètes : épreuves, races, dons, magie des glyphes, factions, atlas."
        path="/systems/glyphes/nouvel-empire"
      />
      <Header />

      <main className="flex-1 pb-24 md:pb-12">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link to="/systems/glyphes" className="inline-flex items-center gap-2 text-sm text-amber-400/80 hover:text-amber-300">
              <ArrowLeft className="h-4 w-4" /> Retour à Glyphes
            </Link>
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 lg:hidden"
            >
              {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Sommaire
            </button>
          </div>

          <header className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5" /> Médiéval Fantastique · {ANNEE_DE_REFERENCE}
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold text-gradient-gold md:text-5xl">
              Nouvel Empire
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
              Module d'époque officiel — règles du Cœur + Atlas des Territoires Libres.
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Sidebar desktop */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-amber-500/20 bg-[hsl(215,60%,10%)]/80 p-3 backdrop-blur">
                <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-amber-400/70">
                  Sommaire
                </div>
                {nav}
              </div>
            </aside>

            {/* Mobile drawer */}
            {navOpen && (
              <div className="rounded-xl border border-amber-500/20 bg-[hsl(215,60%,10%)] p-3 lg:hidden">
                {nav}
              </div>
            )}

            {/* Content */}
            <article className="min-w-0 max-w-3xl space-y-12 text-slate-200">
              {/* 1 */}
              <section>
                <H id="avant-propos" n={1}>Avant-Propos</H>
                <P>Bienvenue dans <Strong>Glyphes</Strong>, un système de jeu de rôle modulaire dark fantasy où chaque époque possède son propre module. Vous lisez actuellement le module <Strong>Nouvel Empire</Strong>, ancré dans une atmosphère médiéval fantastique.</P>
                <P>Le jeu de rôle est une expérience collaborative : un meneur de jeu (MJ) tisse l'histoire et incarne le monde, tandis que les joueurs incarnent des personnages qui font des choix et lancent des dés pour résoudre l'incertitude. Glyphes utilise <Strong>deux modules</Strong> conjointement :</P>
                <Card title="Module Cœur">Règles universelles : épreuves, combat, magie des glyphes, progression. Commun à toutes les époques.</Card>
                <Card title="Module Nouvel Empire">Spécificités médiévales : équipement, races jouables, factions politiques, géographie des Territoires Libres.</Card>
              </section>

              {/* 2 */}
              <section>
                <H id="histoire" n={2}>Un peu d'Histoire</H>
                <P>Avant <Strong>la Brisure du Monde</Strong>, les océans recouvraient une grande partie du globe. Puis vint le cataclysme : les eaux s'évaporèrent, remplacées par <em>la Brume</em>, un brouillard dense et changeant qui sépare désormais les continents et engloutit les imprudents.</P>
                <P>Aujourd'hui (1527 AE), les <Strong>Territoires Libres</Strong> émergent à peine des cendres de l'ancien Empire humain, tombé en 1428 AE. Les évocateurs sont traqués, les glyphes anciens convoités, et la Brume reste un défi mortel pour qui ose s'y aventurer.</P>
                <Quote>
                  « J'ai vu la Brume engloutir trois bateaux marchands en moins d'une nuit. Les corps ne sont jamais revenus. »
                  <br/>— Sarielle Frenn, exploratrice, journal de bord.
                </Quote>
                <P>Pourquoi explorer ces brumes mortelles ? Pour les <Strong>artefacts du premier peuple</Strong>, pour les routes commerciales perdues, pour la gloire — ou pour fuir des persécutions politiques et religieuses.</P>
              </section>

              {/* 3 */}
              <section>
                <H id="epreuves" n={3}>Jouer à Glyphes — Épreuves & Résolutions</H>
                <P>Une épreuve consiste à lancer <Strong>autant de dés que le niveau d'aptitude</Strong> du personnage, de la taille de la caractéristique liée. On compte les réussites : chaque dé ≥ valeur de difficulté = 1 succès.</P>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Type de Difficulté (TD)</h3>
                <Table head={["Type", "Valeur cible", "Description"]} rows={DIFFICULTES.map(d => [d.td, d.valeur, d.desc])} />

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Rang de difficulté</h3>
                <P>Le rang indique le nombre de réussites requises. Indispensable à mesurer pour calibrer la tension.</P>
                <Table head={["Rang", "Ajout"]} rows={RANGS.map(r => [r.rang, r.ajout])} />

                <Card title="Supériorité">Un dé supplémentaire offert par une circonstance (aide d'un allié, position avantageuse). Cumulable si les sources sont différentes.</Card>
                <Card title="Points de corps & d'âme">Dépensez 1 point pour <Strong>augmenter d'un niveau de dé</Strong> sur une épreuve. Corps = PUI / SOU / CON. Âme = FOI / ESP / SOC.</Card>
                <Card title="Épreuves sous pression">Le MJ impose la caractéristique et l'aptitude. Succès ou échec, un point de corps ou d'âme est gagné.</Card>
                <Card title="Résistance">Une cible peut utiliser une action héroïque (réaction) pour résister à une action qui l'affecte.</Card>
                <Card title="Choisir la difficulté (guide MJ)">Placez la barre trop haute → injustice. Trop basse → sentiment d'inachevé. Ne dépassez Héroïque que si les PJ ont aptitude 3+ et D6+. Légendaire dès D8 / niveau 5 minimum.</Card>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Épreuves complexes</h3>
                <P>Un enchaînement d'épreuves simples (interrogatoire, escalade longue, infiltration). Le nombre de succès requis = niveau de complexité. Le MJ peut révéler ou cacher ce nombre.</P>
                <Card title="Échec partiel">Au moins la moitié des succès atteints : le MJ choisit entre succès à contrecoup ou échec sans conséquences graves.</Card>
                <Card title="Échec complet">Tentatives épuisées sans atteindre la moitié des succès. Conséquences pleines.</Card>
              </section>

              {/* 4 */}
              <section>
                <H id="personnages" n={4}>Personnages — Caractéristiques fondamentales</H>
                <P>Tout personnage commence à <Strong>1D4</Strong> dans chaque caractéristique, modifié par sa race et son origine. Les niveaux de dés vont de <Strong>{NIVEAUX_DES.join(" → ")}</Strong>.</P>
                <Table head={["Carac", "Nom complet", "Description"]} rows={CARACTERISTIQUES.map(c => [c.key, c.label, c.desc])} />

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Points de corps & d'âme</h3>
                <P>Représentent la fatigue physique et mentale. Dépensés pour augmenter le niveau d'un dé d'épreuve. Corps influe sur PUI/SOU/CON, Âme sur FOI/ESP/SOC.</P>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Sens</h3>
                <Table head={["Sens", "Formule"]} rows={SENS.map(s => [s.sens, s.formule])} />

                <Card title="Tempête spirituelle">Stabilité de l'âme. Chaque personnage commence avec autant de stades que le score max de son dé d'Esprit. L'évocation et l'échec ajoutent des points de tempête — saturer = catastrophe.</Card>
                <Card title="Héroïsme">Gagné par coups d'éclat ou actions épiques. Max 5 points. Dépensé pour les actions héroïques. Un seul usage par tour.</Card>
                <Card title="Aptitudes">Définissent le personnage. À la création : <Strong>5 niveaux à répartir</Strong> (max 3 par aptitude). Progression jusqu'au niveau 5 ensuite.</Card>
              </section>

              {/* 5 */}
              <section>
                <H id="fiche" n={5}>Fiche de personnage</H>
                <P>La fiche officielle se structure en blocs distincts :</P>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card title="Identité">Nom, Origine, Race.</Card>
                  <Card title="Corps & Âme">5 jauges chacune + valeurs PUI/SOU/CON et FOI/ESP/SOC.</Card>
                  <Card title="Sens">Vue, Ouïe, Instinct, Flux (calculés depuis les carac).</Card>
                  <Card title="Dons & Aptitudes">2 dons d'origine + tableau des aptitudes avec niveau.</Card>
                  <Card title="Héroïsme & Actions">5 cases d'héroïsme + liste des actions héroïques connues.</Card>
                  <Card title="Attaque & Défense">Mêlée / Distance, Blessures, Résilience, Esquive, protections.</Card>
                  <Card title="Évocation">Liste des glyphes connus, jauge de Tempête spirituelle (max 10).</Card>
                  <Card title="Inventaire">Consommables + objets, encombrement max = score max du dé de PUI.</Card>
                  <Card title="Richesses">Bronze, Argent, Brume, Rubis, Saphir + total en argent.</Card>
                </div>
              </section>

              {/* 6 */}
              <section>
                <H id="dons" n={6}>Dons</H>
                <P>L'origine offre <Strong>2 dons</Strong> au personnage. Contrairement aux aptitudes, les dons n'évoluent pas.</P>
                {DONS.map((cat) => (
                  <div key={cat.cat} className="mt-4">
                    <h3 className="font-display text-lg font-bold text-amber-300">{cat.cat}</h3>
                    <div className="mt-2">
                      {cat.items.map((d) => (
                        <Accordion key={d.nom} title={d.nom}>{d.desc}</Accordion>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              {/* 7 */}
              <section>
                <H id="races" n={7}>Races</H>
                {RACES.map((r) => (
                  <Accordion key={r.nom} title={r.nom} badge="Race">
                    <P>{r.desc}</P>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-400/70">Traits raciaux</div>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {r.traits.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </Accordion>
                ))}
              </section>

              {/* 8 */}
              <section>
                <H id="actions" n={8}>Actions Héroïques</H>
                <P>Une action héroïque par tour, payée en points d'héroïsme. Impossible d'en gagner pendant une action héroïque.</P>
                <Table head={["Action", "Coût", "Effet"]} rows={ACTIONS_HEROIQUES.map(a => [a.nom, `${a.cout} pts`, a.desc])} />
              </section>

              {/* 9 */}
              <section>
                <H id="magie" n={9}>La Magie des Glyphes</H>
                <P>Le <Strong>Flux</Strong> est un plan d'existence invisible, décrit comme une mer déchaînée. Les glyphes sont gravés en partie dans la réalité, en partie dans le Flux (les <em>reflets</em>).</P>
                <Card title="Théorie de la vie">Le consensus académique considère le Flux comme l'essence de l'univers. Les <em>nœuds de flux</em> sont des points de convergence observables dans le monde.</Card>
                <Card title="Composition d'un glyphe">Une <Strong>rune centrale</Strong> évoque un concept (interprétable). Une <Strong>rune en orbite</Strong> (optionnelle) influe sur les événements de flux.</Card>
                <Card title="Transposition vs Évocation">
                  <strong>Transposition</strong> : graver/peindre un glyphe (forge-glyphe, 2h).<br/>
                  <strong>Évocation</strong> : matérialiser le concept par immersion. Plus dangereux.
                </Card>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">L'immersion</h3>
                <P>Le joueur choisit son TD d'immersion (de Commun à Mythique). Sur un succès, il obtient des <Strong>points d'immersion</Strong> = score du dé. À répartir dans le tableau :</P>
                <Table head={["Coût", "Portée", "Magnitude", "Zone d'effet"]} rows={IMMERSION_TABLE.map(i => [i.cout, i.portee, i.magnitude, i.zone])} />

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Échec d'immersion → Tempête spirituelle</h3>
                <Table head={["TD choisi", "Tempête gagnée"]} rows={TEMPETE_PAR_ND.map(t => [t.nd, t.tempete])} />

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Magnitude — Dégâts</h3>
                <P>Coût en points d'immersion pour infliger 1 blessure selon la résilience de la cible :</P>
                <Table head={["Résilience cible", "Coût par blessure"]} rows={MAGNITUDE_DEGATS.map(m => [m.resilience, m.cout])} />

                <Card title="Magnitudes — Temps & espace">Voir dans le passé : Commune. Voir le présent en distance : Héroïque min. La netteté de la vision module la magnitude.</Card>
                <Card title="Magnitudes — Effets & états">Imposer un état (Apeuré, Sonné, Charmé...) coûte selon la difficulté à le faire passer. Le MJ arbitre.</Card>
                <Card title="Événements de flux">Apparition d'entités, ouverture de failles, possessions. Déclenchés par les évocateurs sauvages et les échecs critiques.</Card>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Glyphes connus</h3>
                {GLYPHES_CONNUS.map((g) => (
                  <Accordion key={g.nom} title={`Glyphe de ${g.nom}`} badge="Glyphe">{g.desc}</Accordion>
                ))}

                <Card title="Création de glyphes (MJ)">Inaccessible aux mortels. Les MJ peuvent introduire des glyphes inédits comme récompenses de campagne, à interpréter via une rune centrale (concept) + rune orbitale (effet de flux).</Card>
              </section>

              {/* 10 */}
              <section>
                <H id="repos" n={10}>Activités & Repos</H>
                <Card title="Activité simple">Quelques heures de travail (récolte, étude légère, fabrication courte).</Card>
                <Card title="Activité complète">Une journée entière dédiée à une tâche.</Card>
                <Card title="Repos simple">Quelques heures de pause. Récupère 1 point de corps OU 1 point d'âme.</Card>
                <Card title="Repos complet">Nuit complète. Récupère tous les points de corps et d'âme, soigne 1 blessure légère.</Card>
                <Card title="Récolte">Activité simple avec aptitude Botanique. Le résultat dépend de la flore locale et de l'environnement.</Card>
              </section>

              {/* 11 */}
              <section>
                <H id="fabrication" n={11}>Fabrication</H>
                <P>La fabrication consomme un certain nombre de <Strong>dés de fabrication</Strong> (issus des aptitudes Alchimiste/Ingénieur) et des ingrédients. Le tableau donne le coût en magnitude :</P>
                <Table head={["Coût", "Zone d'effet", "Durée", "Temps"]} rows={FABRICATION_TABLE.map(f => [f.cout, f.zone, f.duree, f.temps])} />
                <Card title="Magnitudes de fabrication">Simple, Héroïque, Grandiose, Légendaire — modulent le pouvoir final de l'objet créé.</Card>
              </section>

              {/* 12 */}
              <section>
                <H id="combat" n={12}>Combattre</H>
                <Card title="Initiative">Épreuve d'instinct ou de souplesse (selon contexte). Ordre du tour décidé par le score.</Card>
                <Card title="Points d'action (PA)">Chaque tour : 4 PA. Attaque = 2 PA, mouvement = 1 PA pour 15 ft.</Card>
                <Card title="Charge">Mouvement + attaque, +1D si pas de mouvement préalable. Coûte plus de PA sauf action héroïque.</Card>
                <Card title="Escalade">Épreuve de Pied léger ou Athlétique selon la paroi.</Card>
                <Card title="Se désengager">Évite l'attaque d'opportunité de l'ennemi en contact. Don Insaisissable la rend gratuite.</Card>
                <Card title="Terrains difficiles / dangereux">Coût de mouvement doublé. Difficile peut occasionner une chute (épreuve d'agilité).</Card>
                <Card title="Attaquer">Épreuve d'attaque selon arme + aptitude. Réussites = blessures (modulées par la protection cible).</Card>
                <Card title="Subir des dégâts">Réussites adverses au-delà de la protection = blessures. La résilience limite le coût en immersion magique.</Card>
                <Card title="Jetons de sacrifice">Tirés sur blessure critique : effets divers (estropié, sonné, perte de PA).</Card>
                <Card title="Couverture">Réduit les réussites ennemies (légère −1D, totale −2D).</Card>
                <Card title="Surprise & supériorité numérique">Surprise = première action gratuite. Supériorité numérique = +1D aux attaques mêlée.</Card>
              </section>

              {/* 13 */}
              <section>
                <H id="etats" n={13}>États & leurs Effets</H>
                <Table head={["État", "Effet"]} rows={ETATS.map(e => [e.etat, e.effet])} />
              </section>

              {/* 14 */}
              <section>
                <H id="progression" n={14}>Progression des Personnages</H>
                <Card title="Progression d'aptitude">Après plusieurs sessions, le MJ octroie un niveau d'aptitude (max 5).</Card>
                <Card title="Progression de caractéristique">Évolutions rares, récompenses de jalons narratifs majeurs. +1 niveau de dé.</Card>
                <Card title="Touché par le flux">Étape transformatrice. Le personnage gagne un don d'évocation ou un glyphe inédit.</Card>
                <Card title="Devenir une légende">Au bout du parcours : le personnage entre dans les chroniques. Don héroïque ou capacité unique.</Card>
                <Card title="Dons héroïques">Versions surpuissantes des dons. Acquis seulement par accomplissements légendaires.</Card>
              </section>

              {/* 15 */}
              <section>
                <H id="exploration" n={15}>Exploration</H>
                <Card title="Approche classique">Description narrative. Le MJ détaille, les joueurs choisissent.</Card>
                <Card title="Sous pression">Temps limité, danger imminent. Épreuves sous pression imposées.</Card>
                <Card title="Tour par tour">Quand le tempo l'exige (poursuite, dédale piégé). Découpage en rounds non-combat.</Card>
                <Card title="Le donjon est vivant">Les lieux explorés évoluent : patrouilles, mécanismes, rumeurs, manifestations de flux.</Card>
              </section>

              {/* 16 */}
              <section>
                <H id="richesses" n={16}>Richesses & Équipements</H>
                <Table head={["Pièce", "Conversion"]} rows={RICHESSES.map(r => [r.piece, r.taux])} />
                <Card title="Poids & encombrement">L'encombrement max = score max du dé de PUI. Un D6 PUI = 6 emplacements d'inventaire. Au-delà : pénalités de mouvement.</Card>
              </section>

              {/* 17 */}
              <section>
                <H id="armes" n={17}>S'Armer</H>
                <Table head={["Catégorie", "Description", "Exemples"]} rows={ARMES_CATEGORIES.map(a => [a.cat, a.desc, a.exemples])} />
                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Actions héroïques offensives</h3>
                <P>Annotations : <Strong>Le</Strong> (légère), <Strong>Lo</Strong> (lourde), <Strong>Di</Strong> (distance), <Strong>Me</Strong> (mêlée).</P>
                <Table head={["Action", "Tags", "Coût"]} rows={[
                  ["Frappe dévastatrice", "Lo Me", "2 pts (+1D par 2pts)"],
                  ["Riposte Insaisissable", "Le Di Me", "3 pts"],
                  ["Estourbir", "Le Lo Me", "2 pts"],
                  ["Sentinelle", "Le Lo Di", "2 pts"],
                ]} />
              </section>

              {/* 18 */}
              <section>
                <H id="armures" n={18}>Se Protéger</H>
                <Table head={["Catégorie", "Protection", "Bonus / Malus", "Description"]} rows={ARMURES_CATEGORIES.map(a => [a.cat, a.protection, a.bonus, a.desc])} />
                <Card title="Boucliers">Action héroïque <Strong>Levée de bouclier</Strong> (2 pts) — annule des réussites adverses.</Card>
                <Card title="Esquive">Action héroïque universelle. Lance les dés d'esquive (modulés par armure). +1D pour 2 pts supplémentaires.</Card>
              </section>

              {/* 19 */}
              <section>
                <H id="aptitudes" n={19}>Aptitudes</H>
                <P>Niveau 1 à 5. Chaque niveau = 1D supplémentaire à l'épreuve correspondante.</P>
                {APTITUDES.map((cat) => (
                  <div key={cat.cat} className="mt-4">
                    <h3 className="font-display text-lg font-bold text-amber-300">{cat.cat}</h3>
                    <Table head={["Aptitude", "Caractéristique", "Effet"]} rows={cat.items.map(a => [a.nom, a.carac, a.desc])} />
                  </div>
                ))}
              </section>

              {/* 20 */}
              <section>
                <H id="qualite" n={20}>Objets de Qualité</H>
                <P>Ces objets octroient des dés supplémentaires aux épreuves concernées (non cumulables avec corps/âme).</P>
                <Table head={["Objet", "Prix", "Effet"]} rows={OBJETS_QUALITE.map(o => [o.type, o.prix, o.effet])} />
              </section>

              {/* 21 */}
              <section>
                <H id="legende" n={21}>Objets de Légende — La Baguette de Passage</H>
                <P>Artefact unique. Selon la légende, son porteur peut <Strong>déchirer la réalité</Strong>. Réapparu en 1503 AE entre les mains d'un évocateur inconnu.</P>
                <Quote>
                  « Et c'est alors qu'il déchira la réalité d'un simple revers de la main. La faille s'ouvrit et engloutit ses pairs… »
                  <br/>— Archives théologiques de Solstice, 764 AE.
                </Quote>
                <Accordion title="Magnitude Commune (4+)" badge="Niveau I">
                  Ouvre une déchirure pour faire passer jusqu'au score du dé d'immersion de créatures vers un lieu déjà visité dans un rayon de 50 miles.
                </Accordion>
                <Accordion title="Magnitude Héroïque (6+)" badge="Niveau II">
                  Ouvre une faille vers le Flux. Toute créature qui y entre est happée. Le porteur doit réussir une épreuve commune de flux à chaque début de tour pour maintenir la faille. Échec → implosion, aspire 1D4 créatures dans 50 ft.
                </Accordion>
                <Accordion title="Magnitude Grandiose (8+)" badge="Niveau III">
                  Ouvre vers les profondeurs abyssales du Flux. Une créature abyssale émerge, alliée au porteur. À chaque tour : épreuve commune de flux. Échec → la faille se referme et aspire la créature + 1D6 dans 40 ft.
                </Accordion>
              </section>

              {/* 22 */}
              <section>
                <H id="factions" n={22}>Les Factions</H>
                {FACTIONS.map((f) => (
                  <Accordion key={f.nom} title={f.nom} badge="Faction">{f.desc}</Accordion>
                ))}
              </section>

              {/* 23 */}
              <section>
                <H id="atlas" n={23}>L'Atlas des Territoires Libres</H>
                <P>Par Virsek Frahl, cartographe indépendant. Présentation Sud → Nord des régions principales :</P>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ATLAS.map((a) => (
                    <Card key={a.lieu} title={a.lieu}>{a.desc}</Card>
                  ))}
                </div>
                <Quote>
                  « Quant au terme Régions Libres : le terme officiel de Territoires Libres n'est qu'une fumisterie à mes yeux. »
                  <br/>— Virsek Frahl, introduction de l'Atlas.
                </Quote>
              </section>

              <div className="border-t border-amber-500/15 pt-6 text-center text-xs text-slate-500">
                Glyphes — Module Nouvel Empire · Synthèse de jeu officielle.
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

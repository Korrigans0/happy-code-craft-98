import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ArrowLeft, Menu, X, Sparkles } from "lucide-react";
import {
  SECTIONS, CARACTERISTIQUES, NIVEAUX_DES, DIFFICULTES, RANGS, RICHESSES, SENS,
  DONS, RACES, ACTIONS_HEROIQUES, APTITUDES, ETATS, IMMERSION_TABLE, TEMPETE_PAR_ND,
  MAGNITUDE_DEGATS, SACRIFICES, PALIERS, GLYPHES_CONNUS, FABRICATION_TABLE, ARMES_CATEGORIES, ARMURES_CATEGORIES,
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
  <div className="mb-4 rounded-xl border border-amber-500/20 bg-[hsl(228,60%,11%)]/60 p-4">
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
    <div className="mb-2 overflow-hidden rounded-lg border border-amber-500/20 bg-[hsl(228,60%,11%)]/60">
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
    <div className="relative flex min-h-screen flex-col bg-[hsl(228,70%,8%)]">
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
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-amber-500/20 bg-[hsl(228,60%,10%)]/80 p-3 backdrop-blur">
                <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-amber-400/70">
                  Sommaire
                </div>
                {nav}
              </div>
            </aside>

            {/* Mobile drawer */}
            {navOpen && (
              <div className="rounded-xl border border-amber-500/20 bg-[hsl(228,60%,10%)] p-3 lg:hidden">
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
                <P>Lors d'une épreuve simple, le joueur lance <Strong>autant de dés que le niveau de l'aptitude</Strong> utilisée, de la taille de la caractéristique liée. Chaque dé égal ou supérieur au type de difficulté est une <Strong>réussite</Strong> ; l'épreuve est un succès si le nombre de réussites atteint le rang de difficulté.</P>
                <P>Le TD est choisi par le MJ et gardé secret jusqu'au lancer. Un personnage qui prend le temps d'examiner la situation peut tenter de le deviner (épreuve d'instinct, aptitude Déduction).</P>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Type de Difficulté (TD)</h3>
                <Table head={["Type", "Valeur cible", "Description"]} rows={DIFFICULTES.map(d => [d.td, d.valeur, d.desc])} />

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Rang de difficulté</h3>
                <P>Le rang est le nombre de réussites nécessaires. Une épreuve Commune de rang 2 demande deux dés à 4 ou plus. Pour un jeu équilibré, augmentez le rang avant d'augmenter le type de difficulté.</P>
                <Card title="Type de difficulté Nul">L'épreuve réussit automatiquement. Aucun point d'héroïsme ne peut être gagné.</Card>
                <Card title="Coup d'éclat">Plus de réussites que nécessaire : le personnage gagne autant de points d'héroïsme que le rang de l'épreuve.</Card>
                <Table head={["Rang", "Ajout"]} rows={RANGS.map(r => [r.rang, r.ajout])} />

                <Card title="Supériorité">Un dé supplémentaire (surprise, aide d'un allié, supériorité numérique, preuve, diversion…). Cumulable si les sources sont de types différents.</Card>
                <Card title="Niveau d'aptitude nul">Si le nombre de dés tombe à 0 ou moins, la créature lance 2 dés et garde le moins bon. Exception : sans dé de Flux, les épreuves de Flux sont impossibles.</Card>
                <Card title="Points de corps & d'âme">Dépensez 1 point pour <Strong>augmenter d'un niveau le dé</Strong> de caractéristique de l'épreuve (D6 → D8 avec 1 point, D10 avec 2). Corps = PUI / SOU / CON. Âme = FOI / ESP / SOC. 2 de chaque à la création.</Card>
                <Card title="Choix de la caractéristique">Le MJ fixe la caractéristique et l'aptitude idéales ; le joueur peut en proposer une autre qui correspond mieux à son personnage (enfoncer la porte plutôt que la crocheter).</Card>
                <Card title="Épreuves sous pression">Le MJ impose la caractéristique et l'aptitude. Succès ou échec, le personnage reçoit un point de corps ou d'âme selon la caractéristique utilisée.</Card>
                <Card title="Choisir la difficulté (guide MJ)">Nul : actions ordinaires, indices gratuits. Commun : débutants et intermédiaires (au-delà de deux aptitudes niveau 3, montez le rang). Héroïque : fait dépenser corps et âme. Grandiose : aptitudes niveau 4+. Légendaire : D8 et niveau 5 minimum. Mythique : un avertissement plus qu'une épreuve.</Card>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Épreuves à sacrifice</h3>
                <P>Lors de l'échec d'une épreuve à sacrifice, le joueur choisit : <Strong>garantir le succès en sacrifiant quelque chose</Strong>, ou accepter l'échec et ses conséquences. Idéal pour les épreuves qui durent dans le temps (infiltration, interrogatoire).</P>
                <Card title="Que sacrifier ?">Le MJ détermine toujours le sacrifice : narratif (traces, information partielle, confiance perdue), corporel (blessure, points de corps ou d'âme) ou matériel (outil ou équipement brisé).</Card>
              </section>

              {/* 4 */}
              <section>
                <H id="personnages" n={4}>Personnages — Caractéristiques fondamentales</H>
                <P>Tout personnage commence à <Strong>1D4</Strong> dans chaque caractéristique, agrandi par les bonus de race puis par la progression. Les niveaux de dés vont de <Strong>{NIVEAUX_DES.join(" → ")}</Strong>.</P>
                <Table head={["Carac", "Nom complet", "Description"]} rows={CARACTERISTIQUES.map(c => [c.key, c.label, c.desc])} />

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Points de corps & d'âme</h3>
                <P>Représentent la fatigue physique et mentale. Dépensés pour augmenter le niveau d'un dé d'épreuve. Corps influe sur PUI/SOU/CON, Âme sur FOI/ESP/SOC.</P>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Sens</h3>
                <Table head={["Sens", "Formule"]} rows={SENS.map(s => [s.sens, s.formule])} />

                <P>Les sens servent de manière <Strong>passive</Strong> (le TD d'une épreuve de camouflage adverse est égal au niveau de dé de vue ou d'ouïe) ou <Strong>active</Strong> (chercher, sentir, découvrir).</P>
                <Card title="Résilience">Score minimum à atteindre lors d'une attaque pour blesser la créature. <Strong>4</Strong> à la création.</Card>
                <Card title="Tempête spirituelle">Stabilité de l'âme. Maximum de points de tempête = score maximal du dé d'Esprit (D6 → 6 points).</Card>
                <Card title="Héroïsme">Gagné par coups d'éclat ou épreuves désespérées. Maximum 5 points ; tout point au-delà est perdu.</Card>
                <Card title="Aptitudes">Niveau 1 dans toutes les aptitudes à la création, puis <Strong>5 niveaux à répartir</Strong> (max 3 par aptitude). Progression jusqu'au niveau 5.</Card>
                <Card title="Création">2 dons d'origine, 3 actions héroïques, 2 points de corps et 2 points d'âme, 0 point de potentiel.</Card>
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
                  <Card title="Évocation">Liste des glyphes connus, jauge de Tempête spirituelle (max = score du dé d'Esprit).</Card>
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
                <P>Déclenchables à <Strong>tout moment</Strong> si leurs conditions sont remplies, sans limite par tour. Impossible de gagner de l'héroïsme pendant une action héroïque. <Strong>3 actions héroïques</Strong> au choix à la création.</P>
                <Card title="Traits">Réussite garantie : dépenser la moitié du TD garantit une réussite. Augmentation : +1D par 2 points. Combo : permet à un allié à 30 ft de déclencher une action au même trait (sans nouveau combo). Guerroyer / Parlementer : réservées à l'approche choisie.</Card>
                <Card title="Annotations martiales">Armes : Le légère, Lo lourde, Di distance, Me mêlée. Protections : Le légère, In intermédiaire, Lo lourde, Bou bouclier.</Card>
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
                <P>Le joueur choisit le TD de son immersion (de Commun 4+ à Mythique 12+), puis lance <Strong>autant de dés d'Esprit qu'il le souhaite</Strong>. Une seule réussite suffit pour que l'évocation réussisse ; chaque réussite rapporte des points d'immersion selon le TD.</P>
                <Table head={["TD choisi", "Points par réussite"]} rows={TEMPETE_PAR_ND.map(t => [t.nd, t.points])} />
                <Card title="Effet de base">Origine : l'évocateur. Portée 30 ft, magnitude simple, cible unique. Les points d'immersion s'ajoutent, et peuvent être dépensés plusieurs fois dans une même colonne.</Card>
                <Table head={["Coût", "Portée", "Magnitude", "Zone (rayon)", "Durée"]} rows={IMMERSION_TABLE.map(i => [i.cout, i.portee, i.magnitude, i.zone, i.duree])} />

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Le coût d'un tel pouvoir</h3>
                <Card title="Réussite">1 point de tempête spirituelle par dé qui n'atteint pas le TD choisi.</Card>
                <Card title="Échec d'immersion">Points de tempête égaux au score minimal du TD (4 pour 4+, 6 pour 6+…).</Card>
                <Card title="Immersion rituelle">Les créatures à 10 ft peuvent aider : chaque dé rituel coûte 2 points de tempête à l'aidant. Les dés rituels comptent seulement s'ils donnent des réussites et n'influent pas sur les événements de flux ; sans réussite de l'évocateur, l'immersion échoue.</Card>
                <Card title="Tempête spirituelle atteinte">Épreuve de Flux TD commun rang 1 : un échec provoque un événement de flux catastrophique, un succès coupe le lien avec le flux.</Card>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Magnitude — Dégâts</h3>
                <P>Dépenser une magnitude égale ou supérieure à la résilience de la cible inflige une blessure ; répétez la dépense pour plusieurs blessures.</P>
                <Table head={["Résilience cible", "Coût par blessure"]} rows={MAGNITUDE_DEGATS.map(m => [m.resilience, m.cout])} />

                <Card title="Évoquer">La description doit faire tenir le concept de la rune centrale en une phrase (« Je veux <em>voir</em> dans le passé »).</Card>
                <Card title="Magnitudes — Temps & espace">Changer le temps est impossible. Une vision du passé dépend de la distance temporelle et de la netteté ; voir le présent ailleurs demande au moins une magnitude héroïque.</Card>
                <Card title="Magnitudes — Effets & états">Un état sans blessure réussit automatiquement dès la magnitude commune. Plusieurs états, un état rare ou une transformation profonde : héroïque ou plus.</Card>
                <Card title="Événements de flux">Une fois tous les dés jetés (rituels compris), si les dés pairs ne sont pas plus nombreux que les impairs, un événement se produit : bénéfique si l'immersion réussit, potentiellement catastrophique sinon.</Card>

                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Glyphes connus</h3>
                {GLYPHES_CONNUS.map((g) => (
                  <Accordion key={g.nom} title={`Glyphe de ${g.nom}`} badge="Glyphe">{g.desc}</Accordion>
                ))}

                <Card title="Création de glyphes (MJ)">Inaccessible aux mortels. Les MJ peuvent introduire des glyphes inédits comme récompenses de campagne, à interpréter via une rune centrale (concept) + rune orbitale (effet de flux).</Card>
              </section>

              {/* 10 */}
              <section>
                <H id="repos" n={10}>Activités & Repos</H>
                <Card title="Activité simple">15 minutes ; échoue si elle est interrompue (explorer une pièce, désarmer un piège, soigner).</Card>
                <Card title="Activité complète">Une heure ; échoue si elle est interrompue. Allonger une activité peut réduire la difficulté ou apporter un bonus.</Card>
                <Card title="Repos simple">Une heure : panser ses plaies, bandages, consommables. Soigner : épreuve de médecine, TD = résilience de la créature.</Card>
                <Card title="Repos complet">6 heures minimum. Récupère 1 point de corps ou d'âme. Guérit une blessure sans interruption (pas de quart de surveillance).</Card>
                <Card title="Réduire sa tempête">Méditation profonde : épreuve de Flux TD commun avec autant de dés que de points de tempête ; chaque réussite retire un point.</Card>
                <Card title="Récolte">Au moins une activité complète, épreuve de survie. Riche : 2 ingrédients par réussite ; moyenne : 1 ; désertique : impossible.</Card>
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
                <Card title="Enjeux">Avant chaque confrontation, celui qui l'initie fixe un enjeu (convaincre, tenir/protéger, dérober, effrayer, distraire, neutraliser). Le MJ peut cacher le sien ou imposer un enjeu supplémentaire.</Card>
                <Card title="Victoire, défaite, nulle">Victoire : chaque participant gagne 5 points d'héroïsme. Défaite : ils perdent tout leur héroïsme et subissent les conséquences. Nulle : les deux camps échouent, sans effet de défaite.</Card>
                <Card title="Ordre de jeu">Épreuve de vigilance avec le dé d'instinct, TD commun rang 1. Réussite : joue en premier ; échec : en dernier. La surprise inflige un échec automatique.</Card>
                <Card title="Points d'action (PA)">4 PA au début du tour, dépensables jusqu'au tour suivant. Parlementer gratuit, 15 ft = 1 PA, objet = 1 PA, attaque = 2 PA.</Card>
                <Card title="Parlementer ou guerroyer">Une seule approche par tour. Parlementer : épreuve sociale gratuite (TD = valeur max du dé de caractéristique de la cible, rang = son aptitude correspondante).</Card>
                <Card title="Attaquer">2 PA. TD = résilience de la cible, rang = taux de protection de son armure.</Card>
                <Card title="Charge">15 ft minimum en ligne droite puis attaque ou mise à terre, avec supériorité. Coût = déplacement + attaque.</Card>
                <Card title="Se désengager">1 PA, épreuve de souplesse (TD = score max du dé de souplesse adverse). En cas d'échec : rester au contact, ou partir en subissant une attaque (1 PA pour l'adversaire).</Card>
                <Card title="Escalade">1 PA pour un obstacle aussi haut ou plus haut que la créature ; gratuit sinon.</Card>
                <Card title="Surprise & supériorité numérique">Chacune apporte une supériorité à l'attaque, cumulables. Pas de défense active contre une attaque surprise.</Card>
                <Card title="Couverture (attaque à distance)">Léger : +1 protection. Intermédiaire : +2. Complet : attaque impossible.</Card>
                <Card title="Subir des dégâts">Un PNJ succombe à son nombre maximal de blessures. Un PJ qui subit sa 3e blessure tire un jeton de sacrifice.</Card>
                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Jetons de sacrifice</h3>
                <P>4 exemplaires de chaque jeton, sauf Mort (autant que de joueurs présents) et Furie (un seul). Un jeton tiré ne revient pas dans le sac, sauf la Mort ; le sac est reconstitué après une semaine de repos en lieu sûr.</P>
                <Table head={["N°", "Sacrifice", "Effet"]} rows={SACRIFICES.map(x => [x.n, x.nom, x.effet])} />
              </section>

              {/* 13 */}
              <section>
                <H id="etats" n={13}>États & leurs Effets</H>
                <Table head={["État", "Effet"]} rows={ETATS.map(e => [e.etat, e.effet])} />
              </section>

              {/* 14 */}
              <section>
                <H id="progression" n={14}>Progression des Personnages</H>
                <Card title="Le potentiel (PP)">0 PP à la création ; environ 1 PP par session (2 à 5 pour une fin d'arc).</Card>
                <Card title="Augmenter une aptitude">Coûte autant de PP que le niveau actuel (niveau 1 → 2 : 1 PP ; 2 → 3 : 2 PP…). Maximum niveau 5.</Card>
                <Card title="Augmenter un dé de caractéristique">D4 → D6 : 5 PP. D6 → D8 : 10 PP. Maximum D8, 4 caractéristiques améliorables sur 6, et 2 au plus en D8.</Card>
                <Table head={["Palier", "PP dépensés"]} rows={PALIERS.map(p => [p.palier, p.pp])} />
                <Card title="Palier héroïque — un don au choix">Grande figure (surnom, +2 héroïsme max), Vétéran endurci (résilience 6), Efficace (5 points d'action par tour), Forteresse spirituelle (réduit sa tempête de 1D4 par repos complet), Métabolisme rapide (+1 point de corps ou d'âme par repos complet).</Card>
              </section>

              {/* 15 */}
              <section>
                <H id="exploration" n={15}>Exploration</H>
                <Card title="Tour par tour">Quelle que soit l'approche, l'exploration d'une zone restreinte (donjon, fort, souterrain) se joue en tours.</Card>
                <Card title="Approche classique">Chaque tour dure 15 minutes : chaque personnage peut faire une activité simple. Le MJ peut compter le temps avec un D4 visible tourné à chaque tour.</Card>
                <Card title="Approche sous pression">Chaque tour dure 5 secondes : c'est une confrontation contre l'environnement, avec les mêmes règles d'actions et de déplacement, et une épreuve d'initiative au départ.</Card>
                <Card title="Le donjon est vivant">Le lieu réagit au groupe : pont trop chargé, éboulement, rencontre inattendue.</Card>
              </section>

              {/* 16 */}
              <section>
                <H id="richesses" n={16}>Richesses & Équipements</H>
                <Table head={["Pièce", "Conversion"]} rows={RICHESSES.map(r => [r.piece, r.taux])} />
                <Card title="Poids & encombrement">Le nombre d'objets encombrants transportables dépend du dé de PUI. Armes : 1 emplacement (légère) ou 2 (lourde), non comptées si portées. Armures : lourde 2, intermédiaire 1, légère 0, comptées même portées. 10 petits objets = 1 emplacement.</Card>
              </section>

              {/* 17 */}
              <section>
                <H id="armes" n={17}>S'Armer</H>
                <Table head={["Catégorie", "Description", "Exemples"]} rows={ARMES_CATEGORIES.map(a => [a.cat, a.desc, a.exemples])} />
                <h3 className="mt-6 font-display text-lg font-bold text-amber-300">Actions héroïques offensives</h3>
                <P>Annotations : <Strong>Le</Strong> (légère), <Strong>Lo</Strong> (lourde), <Strong>Di</Strong> (distance), <Strong>Me</Strong> (mêlée).</P>
                <Table head={["Action", "Tags", "Coût"]} rows={[
                  ["Frappe dévastatrice", "Lo Me", "2 pts (+1D par 2pts)"],
                  ["Tir traversant", "Lo Di", "2 pts"],
                  ["Riposte insaisissable", "Le Di Me", "1 pt + esquive"],
                  ["Estourbir", "Le Lo Me", "2 pts"],
                  ["Sentinelle", "Le Lo Di", "2 pts"],
                ]} />
              </section>

              {/* 18 */}
              <section>
                <H id="armures" n={18}>Se Protéger</H>
                <Table head={["Catégorie", "Protection", "Bonus / Malus", "Description"]} rows={ARMURES_CATEGORIES.map(a => [a.cat, a.protection, a.bonus, a.desc])} />
                <Card title="Taux de protection">Nombre de réussites nécessaires pour blesser le porteur : légère 1, intermédiaire 2, lourde 3. Sans armure, chaque réussite inflige une blessure.</Card>
                <Card title="Boucliers">Défense active uniquement : <Strong>Levée de bouclier</Strong> (2 pts, apprise avec le bouclier) et <Strong>Intervention défensive</Strong> (3 pts, +1 protection à un allié). Actions défensives sans héroïsme : Tenir bon (2 PA, +1 rang aux épreuves offensives contre lui) et Repousser (2 PA, désengagement avec PUI).</Card>
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

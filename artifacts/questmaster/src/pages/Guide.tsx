import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageAmbiance from "@/components/fantasy/PageAmbiance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PlayCircle, BookOpen, Swords, Users, Map, Shield, Sparkles,
  Dices, Lightbulb, DoorClosed, RectangleHorizontal, Trees,
  Crown, Smartphone, Wand2, Eye, Target, Skull, MessageCircle,
  HelpCircle, Keyboard, Crosshair,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
 * Page Guide — explication complète de l'utilisation d'Aetheria VTT
 * Décor dark fantasy cohérent avec les autres pages (Campagnes, Codex…)
 * ───────────────────────────────────────────────────────────── */

type SectionProps = {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

const Section = ({ id, icon, title, children }: SectionProps) => (
  <section id={id} className="scroll-mt-24">
    <Card className="border-amber-500/20 bg-card/60 backdrop-blur-sm shadow-gold/10 hover:shadow-gold/20 transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="font-display flex items-center gap-3 text-2xl text-gradient-gold">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  </section>
);

const Step = ({ n, title, children }: { n: number | string; title: string; children: React.ReactNode }) => (
  <div className="flex gap-3">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 font-display text-sm font-bold text-amber-400">
      {n}
    </div>
    <div className="flex-1">
      <p className="font-semibold text-foreground/90">{title}</p>
      <div className="mt-0.5 text-muted-foreground">{children}</div>
    </div>
  </div>
);

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
    {children}
  </kbd>
);

const TOC_ITEMS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "demarrer",  label: "Bien démarrer",      icon: <PlayCircle className="h-4 w-4" /> },
  { id: "systemes",  label: "Multi-systèmes",     icon: <BookOpen className="h-4 w-4" /> },
  { id: "perso",     label: "Personnages",        icon: <Users className="h-4 w-4" /> },
  { id: "campagnes", label: "Campagnes",          icon: <Map className="h-4 w-4" /> },
  { id: "codex",     label: "Codex",              icon: <Sparkles className="h-4 w-4" /> },
  { id: "vtt",       label: "Tabletop & tokens",  icon: <Crosshair className="h-4 w-4" /> },
  { id: "murs",      label: "Murs & vision",      icon: <Shield className="h-4 w-4" /> },
  { id: "combat",    label: "Combat & dés",       icon: <Swords className="h-4 w-4" /> },
  { id: "mj",        label: "Astuces MJ",         icon: <Crown className="h-4 w-4" /> },
  { id: "mobile",    label: "Mobile",             icon: <Smartphone className="h-4 w-4" /> },
  { id: "faq",       label: "FAQ",                icon: <HelpCircle className="h-4 w-4" /> },
];

const Guide = () => {
  return (
    <div className="relative flex min-h-screen flex-col animate-fade-in">
      <PageAmbiance />
      <SEO
        title="Guide d'utilisation — Aetheria VTT"
        description="Tout ce qu'il faut savoir pour jouer ou maîtriser sur Aetheria VTT : campagnes, personnages, tabletop, murs dynamiques, combat, multi-systèmes."
        path="/guide"
      />
      <Header />

      <main className="flex-1 pb-24 md:pb-16">
        {/* ── HERO + VIDÉO ── */}
        <section className="container mx-auto px-4 pt-8 md:pt-12">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gradient-gold mb-3">
              Guide d'Aetheria VTT
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Apprends à utiliser la plateforme : campagnes, personnages, codex, tabletop dynamique, murs, lumières, combat. Conçu pour les joueurs comme pour les MJ.
            </p>
          </div>

          {/* Emplacement vidéo — 16:9, prêt à recevoir un <iframe> YouTube/Vimeo ou un <video> plus tard */}
          <div className="mx-auto max-w-4xl">
            <div className="group relative aspect-video w-full overflow-hidden rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-[#0d0d14] via-[#13131c] to-[#0d0d14] shadow-gold">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,184,106,0.15),transparent_70%)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500/60 bg-amber-500/10 backdrop-blur-sm transition-transform group-hover:scale-110">
                  <PlayCircle className="h-10 w-10 text-amber-400" />
                </div>
                <p className="font-display text-lg text-amber-300/90">Vidéo de présentation</p>
                <p className="max-w-md text-xs text-muted-foreground">
                  La vidéo tutoriel sera ajoutée ici prochainement. Elle couvrira l'essentiel pour bien démarrer en moins de 10 minutes.
                </p>
              </div>
              {/* Coins décoratifs */}
              <div className="pointer-events-none absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-amber-500/60" />
              <div className="pointer-events-none absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-amber-500/60" />
              <div className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-amber-500/60" />
              <div className="pointer-events-none absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-amber-500/60" />
            </div>
          </div>
        </section>

        {/* ── TABLE DES MATIÈRES ── */}
        <section className="container mx-auto px-4 mt-10">
          <Card className="border-amber-500/20 bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg text-amber-300/90 flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Sommaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {TOC_ITEMS.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className="flex items-center gap-2 rounded-md border border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground transition-all hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-300"
                  >
                    <span className="text-amber-400/80">{t.icon}</span>
                    {t.label}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── CONTENU ── */}
        <div className="container mx-auto px-4 mt-10 space-y-8 max-w-5xl">

          <Section id="demarrer" icon={<PlayCircle className="h-5 w-5" />} title="Bien démarrer">
            <Step n={1} title="Crée un compte ou connecte-toi">
              Rends-toi sur la page <strong>Connexion</strong>. Tu peux aussi essayer la plateforme en mode invité depuis l'écran de connexion.
            </Step>
            <Step n={2} title="Choisis ton rôle">
              <strong>Maître du Jeu (MJ)</strong> : crée une campagne, prépare les cartes, gère les créatures et les règles.
              <br />
              <strong>Joueur (PJ)</strong> : rejoins une campagne avec un code d'invitation, crée ta fiche, joue.
            </Step>
            <Step n={3} title="Lance ta première campagne">
              MJ : depuis <em>Campagnes</em> → <strong>Nouvelle campagne</strong>, choisis ton système (Aetheria, D&D 5e, Pathfinder 2e, Cthulhu, Worlds Awakening, Personnalisé).
              <br />
              PJ : depuis <em>Campagnes</em> → bouton <strong>Rejoindre</strong>, colle le code fourni par ton MJ.
            </Step>
          </Section>

          <Section id="systemes" icon={<BookOpen className="h-5 w-5" />} title="Multi-systèmes">
            <p>
              Aetheria VTT supporte plusieurs systèmes de jeu, totalement <strong>cloisonnés</strong> entre eux : chaque campagne utilise un seul système et ne mélange jamais le contenu d'un autre.
            </p>
            <ul className="space-y-1.5 ml-4 list-disc list-outside marker:text-amber-400/70">
              <li><strong className="text-amber-300">Aetheria</strong> — système maison, fiches dédiées, bestiaire complet, règles de tenues et d'affinités.</li>
              <li><strong className="text-amber-300">Worlds Awakening</strong> — système partenaire, fiches et bestiaire propres.</li>
              <li><strong className="text-amber-300">D&D 5e</strong> — bestiaire et codex SRD, fiche 6 caractéristiques.</li>
              <li><strong className="text-amber-300">Pathfinder 2e</strong> — codex et créatures dédiés.</li>
              <li><strong className="text-amber-300">L'Appel de Cthulhu 7e</strong> — bestiaire et fiche d'investigateur.</li>
              <li><strong className="text-amber-300">Personnalisé / Homebrew</strong> — créatures, sorts, objets entièrement libres, partage communautaire optionnel.</li>
            </ul>
            <p className="text-xs italic text-muted-foreground/80">
              Le MJ peut autoriser l'usage de contenu Homebrew dans une campagne via les paramètres de la campagne.
            </p>
          </Section>

          <Section id="perso" icon={<Users className="h-5 w-5" />} title="Personnages">
            <Step n={1} title="Création">
              Depuis <em>Personnages</em> → <strong>Nouveau personnage</strong>. Choisis le système : la fiche affiche automatiquement les bons champs (caracs, compétences, ressources).
            </Step>
            <Step n={2} title="Avatar">
              Importe une image depuis ton appareil. Elle apparaîtra sur ta fiche, ton token et le suivi d'initiative.
            </Step>
            <Step n={3} title="Synchronisation fiche ↔ token">
              Toute modification de PV, état ou nom sur ta fiche est répercutée en temps réel sur ton token, et inversement.
            </Step>
            <Step n={4} title="Permissions">
              Tu ne peux modifier que <strong>tes propres</strong> fiches. Le MJ a accès à toutes les fiches de sa campagne.
            </Step>
          </Section>

          <Section id="campagnes" icon={<Map className="h-5 w-5" />} title="Campagnes">
            <Step n="MJ" title="Créer une campagne">
              Nom, description, système, paramètres. Un <strong>code d'invitation</strong> est généré automatiquement — partage-le avec tes joueurs.
            </Step>
            <Step n="MJ" title="Membres & rôles">
              Onglet <em>Membres</em> : promouvoir, rétrograder, expulser. Le créateur reste toujours MJ.
            </Step>
            <Step n="MJ" title="Sessions, notes, chat">
              Planifie des sessions, prends des notes privées ou partagées, utilise le chat intégré (messages MJ-only possibles).
            </Step>
            <Step n="PJ" title="Rejoindre">
              <em>Campagnes</em> → <strong>Rejoindre</strong> → colle le code d'invitation. Tu apparais immédiatement comme joueur.
            </Step>
          </Section>

          <Section id="codex" icon={<Sparkles className="h-5 w-5" />} title="Codex (bestiaire, sorts, objets)">
            <p>
              Le codex affiche <strong>uniquement</strong> le contenu du système courant. En contexte campagne, il est filtré automatiquement.
            </p>
            <Step n="✚" title="Créer une créature, un sort, un objet">
              Bouton <strong>Créer</strong> dans le codex. Choisis la portée : <em>Privé</em>, <em>Partagé avec mes campagnes</em>, ou <em>Public (communauté)</em>.
            </Step>
            <Step n="★" title="Favoris">
              Marque tes entrées préférées d'une étoile pour les retrouver rapidement.
            </Step>
            <Step n="↳" title="Drag & drop vers la carte">
              Glisse une créature du panneau bestiaire <strong>directement sur le tabletop</strong> : un token lié apparaît à l'endroit du curseur, avec PV, CA et taille pré-remplis.
            </Step>
          </Section>

          <Section id="vtt" icon={<Crosshair className="h-5 w-5" />} title="Tabletop & tokens">
            <p>Le cœur du jeu. La carte se manipule à la souris, au trackpad et au tactile.</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <p className="font-semibold text-foreground/90 flex items-center gap-2"><Eye className="h-4 w-4 text-amber-400" /> Navigation</p>
                <ul className="mt-1 space-y-0.5 text-xs">
                  <li>• Molette / pinch : zoom</li>
                  <li>• Clic-glisser fond ou <Kbd>Espace</Kbd> + glisser : pan</li>
                  <li>• <Kbd>F</Kbd> : plein écran</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <p className="font-semibold text-foreground/90 flex items-center gap-2"><Target className="h-4 w-4 text-amber-400" /> Tokens</p>
                <ul className="mt-1 space-y-0.5 text-xs">
                  <li>• Clic = sélection / ouverture fiche</li>
                  <li>• Glisser : déplacer (avec magnétisme grille)</li>
                  <li>• Flèches : déplacement fin (<Kbd>Maj</Kbd> = 5 cases)</li>
                  <li>• Clic droit : menu contextuel</li>
                </ul>
              </div>
            </div>

            <Step n={<Users className="h-3.5 w-3.5" />} title="Lier une fiche à un token">
              Le MJ peut associer n'importe quelle fiche à un token via le panneau de droite. Le clic sur le token ouvre alors la fiche correspondante (toutes pour le MJ, uniquement la sienne pour un PJ).
            </Step>
            <Step n={<Sparkles className="h-3.5 w-3.5" />} title="États & conditions">
              Applique des conditions (déséquilibre, saignement, brûlure, immobilisé, peur, corruption…) directement sur le token : des badges colorés apparaissent autour de lui pour tout le monde.
            </Step>
          </Section>

          <Section id="murs" icon={<Shield className="h-5 w-5" />} title="Murs dynamiques & vision (MJ)">
            <p>
              Quatre types de murs, accessibles directement depuis la barre d'outils MJ :
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <p className="font-semibold text-foreground/90 flex items-center gap-2"><Shield className="h-4 w-4 text-amber-400" /> Mur solide <Kbd>W</Kbd></p>
                <p className="mt-1 text-xs">Bloque les déplacements et la vision.</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <p className="font-semibold text-foreground/90 flex items-center gap-2"><DoorClosed className="h-4 w-4 text-amber-400" /> Porte <Kbd>D</Kbd></p>
                <p className="mt-1 text-xs">Bloque si fermée. Clic = ouvrir/fermer (MJ).</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <p className="font-semibold text-foreground/90 flex items-center gap-2"><RectangleHorizontal className="h-4 w-4 text-amber-400" /> Fenêtre</p>
                <p className="mt-1 text-xs">Bloque les déplacements mais <em>laisse passer la vision</em>.</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <p className="font-semibold text-foreground/90 flex items-center gap-2"><Trees className="h-4 w-4 text-amber-400" /> Terrain difficile</p>
                <p className="mt-1 text-xs">Ralentit, ne bloque pas la vision ni le passage.</p>
              </div>
            </div>
            <Step n={<Lightbulb className="h-3.5 w-3.5" />} title="Lumières dynamiques">
              Place torches, bougies, feux de camp ou sources personnalisées. Réglages : intensité, couleur, portée. Compatible avec le mode <strong>nuit</strong>.
            </Step>
            <Step n="↩" title="Annuler / rétablir">
              <Kbd>Ctrl</Kbd>+<Kbd>Z</Kbd> annule le dernier mur, <Kbd>Ctrl</Kbd>+<Kbd>Maj</Kbd>+<Kbd>Z</Kbd> rétablit. <Kbd>Suppr</Kbd> efface le mur sélectionné.
            </Step>
          </Section>

          <Section id="combat" icon={<Swords className="h-5 w-5" />} title="Combat, initiative & dés">
            <Step n={<Swords className="h-3.5 w-3.5" />} title="Initiative">
              Ouvre le suivi d'initiative depuis le panneau du tabletop. Ajoute participants, lance les jets, fais avancer les tours. L'ordre est <strong>synchronisé en temps réel</strong> avec les joueurs et survit aux rafraîchissements de page.
            </Step>
            <Step n={<Skull className="h-3.5 w-3.5" />} title="PV, dégâts, soins">
              Sur le token sélectionné : boutons rapides <strong>-5 / -1 / +1 / +5</strong>, ou champ <em>Montant</em> + boutons <strong>Dégâts</strong> / <strong>Soin</strong> pour appliquer une valeur custom.
            </Step>
            <Step n={<Dices className="h-3.5 w-3.5" />} title="Lanceur de dés">
              Page <em>Dés</em> ou panneau intégré : tous les dés classiques (d4 à d100), modificateurs, avantage/désavantage. Les résultats apparaissent dans le chat.
            </Step>
            <Step n={<Wand2 className="h-3.5 w-3.5" />} title="Zones d'effet">
              Outils <strong>Cône</strong> (<Kbd>C</Kbd>) et <strong>Zone</strong> (<Kbd>Z</Kbd>) pour matérialiser sorts et explosions. La mesure de distance utilise l'échelle de la grille.
            </Step>
          </Section>

          <Section id="mj" icon={<Crown className="h-5 w-5" />} title="Astuces MJ">
            <ul className="space-y-1.5 ml-4 list-disc list-outside marker:text-amber-400/70">
              <li><strong>Brouillard de guerre</strong> : outil <em>Révéler</em> pour dévoiler progressivement la carte aux joueurs.</li>
              <li><strong>Mode nuit</strong> : assombrit la carte ; seules les lumières dynamiques éclairent.</li>
              <li><strong>Token caché</strong> : marque un token invisible aux PJ (utile pour pièges, embuscades).</li>
              <li><strong>Boss</strong> : statut spécial qui ajoute un halo doré et un anneau lumineux.</li>
              <li><strong>Murmures</strong> : envoie un message privé à un joueur précis depuis le chat.</li>
              <li><strong>Mode partage d'écran</strong> : utilise la version desktop pour les outils avancés (murs, lumières, suivi).</li>
            </ul>
          </Section>

          <Section id="mobile" icon={<Smartphone className="h-5 w-5" />} title="Sur mobile">
            <p>
              Les joueurs ont accès à <strong>presque toutes</strong> les fonctions essentielles depuis leur téléphone : fiche, jets, chat, déplacement de leur token, vision, conditions.
            </p>
            <p>
              Les outils avancés MJ (murs, lumières dynamiques, suivi détaillé) restent réservés au desktop pour des raisons d'ergonomie.
            </p>
            <p className="text-xs italic">
              Astuce : ajoute Aetheria VTT à ton écran d'accueil depuis le menu de ton navigateur pour un lancement instantané, comme une application.
            </p>
          </Section>

          <Section id="faq" icon={<HelpCircle className="h-5 w-5" />} title="FAQ rapide">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-foreground/90">Est-ce que mes données sont sauvegardées ?</p>
                <p className="text-xs">Oui — campagnes, fiches, tokens, murs, initiative, brouillard… tout est synchronisé et conservé entre les sessions.</p>
              </div>
              <Separator className="opacity-30" />
              <div>
                <p className="font-semibold text-foreground/90">Puis-je mélanger D&D et Aetheria dans une même campagne ?</p>
                <p className="text-xs">Non. Chaque campagne est verrouillée sur un système pour éviter les conflits de règles. Le contenu Homebrew est la seule passerelle, et uniquement si le MJ l'autorise.</p>
              </div>
              <Separator className="opacity-30" />
              <div>
                <p className="font-semibold text-foreground/90">Combien de campagnes / personnages puis-je créer ?</p>
                <p className="text-xs">3 campagnes et 3 personnages en gratuit. Les abonnements Premium lèvent ces limites — voir la page <em>Abonnements</em>.</p>
              </div>
              <Separator className="opacity-30" />
              <div>
                <p className="font-semibold text-foreground/90">Comment signaler un bug ou proposer une idée ?</p>
                <p className="text-xs flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-amber-400" />
                  Rejoins notre Discord communautaire ou utilise le formulaire de contact sur la page partenaires.
                </p>
              </div>
            </div>
          </Section>

          {/* Raccourcis clavier — récap final */}
          <Card className="border-amber-500/20 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display flex items-center gap-2 text-xl text-gradient-gold">
                <Keyboard className="h-5 w-5" />
                Raccourcis clavier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 md:grid-cols-3">
                {[
                  ["Déplacer", "V"], ["Crayon", "P"], ["Gomme", "E"],
                  ["Mesure", "M"], ["Texte", "T"], ["Cône", "C"], ["Zone", "Z"],
                  ["Mur solide (MJ)", "W"], ["Porte (MJ)", "D"],
                  ["Magnétisme grille", "G"], ["Plein écran", "F"],
                  ["Annuler mur", "Ctrl+Z"], ["Rétablir mur", "Ctrl+Maj+Z"],
                  ["Supprimer sélection", "Suppr"], ["Pan temporaire", "Espace"],
                ].map(([label, key]) => (
                  <div key={label} className="flex items-center justify-between gap-2 border-b border-border/30 py-1">
                    <span className="text-muted-foreground">{label}</span>
                    <Kbd>{key}</Kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Guide;

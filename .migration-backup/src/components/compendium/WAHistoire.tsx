import { ExternalLink, BookOpen, Crown, Globe } from "lucide-react";

const WAHistoire = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              L'Éveil des Mondes
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Bienvenue dans l'univers captivant de Worlds Awakening, une création immersive façonnée par 
              <strong className="text-foreground"> Nicolas BÉDÉ</strong> et illustrée par la plume créative de 
              <strong className="text-foreground"> Christian BERNARD</strong>.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              À travers ces pages, découvrez l'histoire enchanteresse de l'Absolu, un monde éthéré où 
              l'équilibre délicat entre l'harmonie et le chaos a donné naissance aux Royaumes Lointains…
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <p className="text-sm text-red-400">
          ⚠️ Ce lore s'adresse principalement aux Maîtres de Jeu. Il contient des révélations qui pourraient 
          compromettre l'effet de surprise pour les joueurs.
        </p>
      </div>

      <blockquote className="rounded-xl border-l-4 border-primary bg-muted/30 p-5 italic text-muted-foreground">
        Vous avez toujours eu le sentiment de ne pas vraiment appartenir à cet univers. Tout autour de vous semble 
        étrange, presque artificiel. En quête de réponses, le monde s'est révélé encore plus absurde. Les phénomènes 
        que d'autres appellent légendes urbaines, vous les nommez <strong className="text-foreground">Disharmonies</strong>. 
        Des ruelles où les passants s'évanouissent, des créatures qui défient les lois de la physique… tout cela est réel.
      </blockquote>

      <div className="grid gap-4 md:grid-cols-2">
        <a
          href="https://www.worlds-awakening.com/fr/leveil-des-mondes"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-3 rounded-xl border border-border/50 bg-gradient-card p-5 shadow-card transition-all duration-300 hover:border-primary/30"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h4 className="flex items-center gap-2 font-display font-semibold text-foreground">
              Lore Complet
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Explorez le lore officiel sur le site de Worlds Awakening
            </p>
          </div>
        </a>

        <a
          href="https://www.worlds-awakening.com/fr/guide-du-joueur"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-3 rounded-xl border border-border/50 bg-gradient-card p-5 shadow-card transition-all duration-300 hover:border-primary/30"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h4 className="flex items-center gap-2 font-display font-semibold text-foreground">
              Guide du Joueur
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Maîtrisez les bases et créez des personnages puissants
            </p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default WAHistoire;

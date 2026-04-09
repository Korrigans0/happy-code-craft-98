import { ExternalLink, Star } from "lucide-react";

const GameSystemsSection = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Système de jeu
          </h2>
          <p className="mt-2 text-muted-foreground">
            Conçu exclusivement pour l'univers Aetheria
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="group relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-b from-primary/5 to-card p-6 shadow-card transition-all duration-300 hover:shadow-gold">
            <div className="absolute top-3 right-3">
              <Star className="h-4 w-4 fill-primary text-primary" />
            </div>
            <div
              className="mb-4 h-1 w-12 rounded-full bg-primary transition-all duration-300 group-hover:w-20"
            />
            <h3 className="font-display text-lg font-semibold text-foreground">
              Worlds Awakening
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Le système natif d'Aetheria. Ascendances, tenues, bestiaire intégré — une expérience VTT pensée pour cet univers.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Natif", "Bestiaire intégré", "Fantasy"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/50 bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            <a
              href="https://www.worlds-awakening.com/fr"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Site officiel
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameSystemsSection;

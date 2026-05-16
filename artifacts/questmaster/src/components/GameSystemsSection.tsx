import { ExternalLink, Star, Handshake, Swords, MessageCircle } from "lucide-react";
import vaeloriaLogo from "@/assets/vaeloria-logo.svg";

const GameSystemsSection = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Système de jeu
          </h2>
          <p className="mt-2 text-muted-foreground">
            Le système natif de l'univers Aetheria
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {/* Aetheria — système principal */}
          <div className="group relative overflow-hidden rounded-xl border-2 border-primary/60 bg-gradient-to-b from-primary/10 to-card p-6 shadow-card transition-all duration-300 hover:shadow-gold">
            <div className="absolute top-3 right-3">
              <Star className="h-5 w-5 fill-primary text-primary" />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Système principal
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">
              Aetheria
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Le système de jeu officiel de l'univers Aetheria. Ascendances, tenues, bestiaire intégré — une expérience VTT complète et immersive.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Système natif", "Bestiaire intégré", "Dark Fantasy"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Worlds Awakening — partenaire */}
          <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-muted/30 to-card p-6 shadow-card transition-all duration-300 hover:border-border">
            <div className="absolute top-3 right-3">
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full border border-border/50 bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Partenaire
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Worlds Awakening
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Partenaire officiel d'Aetheria VTT. Données du bestiaire, codex et ressources issues de l'univers Worlds Awakening.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Partenaire", "Codex", "Ressources"].map((tag) => (
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
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
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

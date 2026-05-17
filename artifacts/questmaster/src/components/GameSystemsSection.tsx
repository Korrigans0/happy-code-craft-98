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
          <div className="group relative overflow-hidden rounded-xl border-2 border-primary/60 bg-gradient-to-b from-primary/10 to-card p-6 shadow-card transition-all duration-300 hover:shadow-gold hover:-translate-y-0.5">
            <div className="absolute top-3 right-3">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Partenaire
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">
              Worlds Awakening
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Partenaire officiel d'Aetheria VTT. Données du bestiaire, codex et ressources issues de l'univers Worlds Awakening.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Partenaire", "Codex", "Ressources"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
            <a
              href="https://www.worlds-awakening.com/fr"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Site officiel
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Le Repos de Vaeloria — partenaire */}
          <div className="group relative overflow-hidden rounded-xl border-2 border-primary/60 bg-gradient-to-b from-primary/10 to-card p-6 shadow-card transition-all duration-300 hover:shadow-gold hover:-translate-y-0.5">
            <div className="absolute top-3 right-3">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Partenaire
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://vaeloria.fr/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Le Repos de Vaeloria"
                className="shrink-0 transition-transform hover:scale-105"
              >
                <img
                  src={vaeloriaLogo}
                  alt="Logo Le Repos de Vaeloria"
                  className="h-12 w-12 rounded-lg border border-primary/30 bg-background/80 p-1"
                />
              </a>
              <h3 className="font-display text-xl font-bold text-foreground">
                Le Repos de Vaeloria
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Communauté JDR francophone autour du jeu de rôle, de la création et des univers fantasy.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://discord.gg/MVYGCd79ec"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <MessageCircle className="h-3 w-3" />
                Discord
              </a>
              <a
                href="https://vaeloria.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <ExternalLink className="h-3 w-3" />
                Site officiel
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameSystemsSection;

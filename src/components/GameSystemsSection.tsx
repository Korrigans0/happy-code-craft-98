import { ExternalLink } from "lucide-react";

const systems = [
  {
    name: "D&D 5e",
    description: "Le jeu de rôle fantastique le plus populaire au monde. Explorez des donjons, combattez des dragons et forgez des légendes.",
    color: "hsl(var(--primary))",
    tags: ["Fantaisie", "Héroïque", "Classique"],
  },
  {
    name: "Call of Cthulhu",
    description: "Plongez dans l'horreur cosmique de Lovecraft. Enquêtez sur des mystères indicibles et luttez pour votre santé mentale.",
    color: "hsl(142, 50%, 45%)",
    tags: ["Horreur", "Enquête", "Années 1920"],
  },
  {
    name: "Worlds Awakening",
    description: "Un JdR gratuit et communautaire avec un système original. Créez des personnages uniques dans un univers fantasy riche.",
    color: "hsl(200, 70%, 55%)",
    tags: ["Gratuit", "Communautaire", "Fantasy"],
    link: "https://www.worlds-awakening.com/fr",
  },
];

const GameSystemsSection = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Systèmes de jeu supportés
          </h2>
          <p className="mt-2 text-muted-foreground">
            Une table virtuelle pour tous vos univers préférés
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {systems.map((system) => (
            <div
              key={system.name}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-card p-6 shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-gold"
            >
              <div
                className="mb-4 h-1 w-12 rounded-full transition-all duration-300 group-hover:w-20"
                style={{ backgroundColor: system.color }}
              />
              <h3 className="font-display text-lg font-semibold text-foreground">
                {system.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {system.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {system.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/50 bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {system.link && (
                <a
                  href={system.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Découvrir
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          D'autres systèmes à venir — Pathfinder, Shadowrun, Vampire et plus encore…
        </p>
      </div>
    </section>
  );
};

export default GameSystemsSection;

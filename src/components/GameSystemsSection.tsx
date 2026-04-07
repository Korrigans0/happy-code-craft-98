import { ExternalLink, Star } from "lucide-react";

const systems = [
  {
    name: "Worlds Awakening",
    description: "Le système natif d'Aetheria. Ascendances, tenues, bestiaire intégré — une expérience VTT pensée pour cet univers.",
    color: "hsl(var(--primary))",
    tags: ["Natif", "Bestiaire intégré", "Fantasy"],
    link: "https://www.worlds-awakening.com/fr",
    featured: true,
  },
  {
    name: "D&D 5e",
    description: "Le jeu de rôle fantastique le plus populaire. Support complet des sorts, monstres et fiches de personnage.",
    color: "hsl(0, 72%, 51%)",
    tags: ["Fantaisie", "Héroïque", "Classique"],
  },
  {
    name: "Call of Cthulhu",
    description: "Plongez dans l'horreur cosmique de Lovecraft. Enquêtez sur des mystères indicibles.",
    color: "hsl(142, 50%, 45%)",
    tags: ["Horreur", "Enquête", "Années 1920"],
  },
];

const GameSystemsSection = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Systèmes de jeu
          </h2>
          <p className="mt-2 text-muted-foreground">
            Optimisé pour Aetheria — compatible avec vos univers préférés
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {systems.map((system) => (
            <div
              key={system.name}
              className={`group relative overflow-hidden rounded-xl border p-6 shadow-card transition-all duration-300 hover:shadow-gold ${
                system.featured 
                  ? "border-primary/40 bg-gradient-to-b from-primary/5 to-card" 
                  : "border-border/50 bg-gradient-card hover:border-primary/30"
              }`}
            >
              {system.featured && (
                <div className="absolute top-3 right-3">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                </div>
              )}
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
                  Site officiel
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameSystemsSection;
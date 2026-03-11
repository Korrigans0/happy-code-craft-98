import { ExternalLink, Users, Swords, Shirt, Zap, Shield, Package, Beer, Map } from "lucide-react";

const codexSections = [
  {
    title: "Ascendances",
    description: "Les Ascendances définissent l'héritage, la culture, les traits distinctifs et les capacités innées de votre personnage.",
    icon: Users,
    url: "https://www.worlds-awakening.com/fr/codex/ascendances",
    color: "text-emerald-400 bg-emerald-500/20",
  },
  {
    title: "Classes",
    description: "Les Classes déterminent votre rôle et comment vous interagissez avec le monde. Chaque classe offre des tenues uniques.",
    icon: Swords,
    url: "https://www.worlds-awakening.com/fr/codex/classes",
    color: "text-red-400 bg-red-500/20",
  },
  {
    title: "Tenues",
    description: "Les Tenues représentent une extension de la personnalité, définissant capacités, protections et rôle dans le groupe.",
    icon: Shirt,
    url: "https://www.worlds-awakening.com/fr/codex/tenues",
    color: "text-purple-400 bg-purple-500/20",
  },
  {
    title: "Capacités",
    description: "L'ensemble des capacités associées aux tenues disponibles dans Worlds Awakening.",
    icon: Zap,
    url: "https://www.worlds-awakening.com/fr/codex/capacites",
    color: "text-amber-400 bg-amber-500/20",
  },
  {
    title: "Armes & Équipements",
    description: "Une sélection d'équipements variés, chacun offrant des avantages uniques pour les aventuriers.",
    icon: Shield,
    url: "https://www.worlds-awakening.com/fr/codex/armes-equipements",
    color: "text-blue-400 bg-blue-500/20",
  },
  {
    title: "Objets",
    description: "Objets essentiels pour survivre, guérir ou accomplir des exploits extraordinaires.",
    icon: Package,
    url: "https://www.worlds-awakening.com/fr/codex/objets",
    color: "text-cyan-400 bg-cyan-500/20",
  },
  {
    title: "À l'Auberge",
    description: "Restaurez-vous et reposez-vous. Découvrez les délices culinaires et options d'hébergement.",
    icon: Beer,
    url: "https://www.worlds-awakening.com/fr/codex/lauberge",
    color: "text-orange-400 bg-orange-500/20",
  },
  {
    title: "Voyager",
    description: "Règles et conseils pour les déplacements et l'exploration du monde.",
    icon: Map,
    url: "https://www.worlds-awakening.com/fr/codex/voyager",
    color: "text-green-400 bg-green-500/20",
  },
];

const WACodex = () => {
  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Le Codex de Worlds Awakening centralise les informations essentielles : ascendances, classes, tenues, armes, équipements et objets.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {codexSections.map((section) => {
          const Icon = section.icon;
          return (
            <a
              key={section.title}
              href={section.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-border/50 bg-gradient-card p-5 shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-gold"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
                    {section.title}
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default WACodex;

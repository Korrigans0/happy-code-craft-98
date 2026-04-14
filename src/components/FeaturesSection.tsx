import { Dice5, Map, BookOpen, User, Sparkles } from "lucide-react";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: Dice5,
    title: "Lanceur de dés",
    subtitle: "Tous les dés JdR",
    colorClass: "text-feature-dice",
    href: "/dice",
  },
  {
    icon: Map,
    title: "Campagnes",
    subtitle: "Sessions immersives",
    colorClass: "text-feature-maps",
    href: "/campaigns",
  },
  {
    icon: BookOpen,
    title: "Codex Aetheria",
    subtitle: "Bestiaire & Créatures",
    colorClass: "text-feature-compendium",
    href: "/compendium",
  },
  {
    icon: User,
    title: "Fiches personnage",
    subtitle: "Aetheria",
    colorClass: "text-feature-character",
    href: "/characters",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <Sparkles className="h-3 w-3" />
            Outils du Maître de Jeu
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Tout pour vos aventures
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Des outils pensés pour une expérience immersive
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

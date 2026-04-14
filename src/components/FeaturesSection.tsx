import { Dice5, Map, BookOpen, User } from "lucide-react";
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
    <section className="py-8">
      <div className="container mx-auto px-4 md:px-6">
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
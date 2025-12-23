import { Dice5, Map, BookOpen, User } from "lucide-react";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: Dice5,
    title: "Lanceur de dés",
    subtitle: "Tous les dés D&D",
    colorClass: "text-feature-dice",
    href: "/dice-roller",
  },
  {
    icon: Map,
    title: "Cartes animées",
    subtitle: "GIF, MP4, WebM",
    colorClass: "text-feature-maps",
    href: "/campaigns",
  },
  {
    icon: BookOpen,
    title: "Compendium",
    subtitle: "Sorts & Monstres",
    colorClass: "text-feature-compendium",
    href: "/compendium",
  },
  {
    icon: User,
    title: "Fiches personnage",
    subtitle: "D&D 5e complet",
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

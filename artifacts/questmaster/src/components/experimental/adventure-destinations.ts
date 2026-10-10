import { Sword, User, BookOpen, Crown, Handshake } from "lucide-react";
import cardCampaigns from "@/assets/card-campaigns.jpg";
import cardCharacters from "@/assets/card-characters.jpg";
import cardCodex from "@/assets/card-codex.jpg";
import cardVtt from "@/assets/card-vtt.jpg";
import cardUniverse from "@/assets/card-universe.jpg";

// Shared destinations keep the opt-in experiment identical to the existing navigation.
export const adventureDestinations = [
  { icon: Sword, title: "Campagnes", subtitle: "Plateau, tokens, murs et lumières dynamiques en temps réel.", href: "/campaigns", image: cardCampaigns, hue: 43, cta: "Lancer", tone: "gold" },
  { icon: User, title: "Personnages", subtitle: "Fiches Aetheria complètes, évolutives et illustrées.", href: "/characters", image: cardCharacters, hue: 320, cta: "Créer", tone: "rose" },
  { icon: BookOpen, title: "Codex", subtitle: "Bestiaire, races, classes et lore vivant.", href: "/compendium", image: cardCodex, hue: 270, cta: "Explorer", tone: "violet" },
  { icon: Crown, title: "Abonnements", subtitle: "Choisissez la formule adaptée à votre aventure.", href: "/subscriptions", image: cardVtt, hue: 155, cta: "Découvrir", tone: "emerald" },
  { icon: Handshake, title: "Partenaires", subtitle: "Worlds Awakening, Vaeloria et l'écosystème Aetheria.", href: "/partners", image: cardUniverse, hue: 190, cta: "Voir", tone: "cyan" },
];
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/50 py-6">
      <div className="container mx-auto px-4 text-center md:px-6">
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          DragonTable - Table Virtuelle D&D 5e • Créé avec
          <Heart className="h-4 w-4 fill-destructive text-destructive" />
          pour les aventuriers
        </p>
      </div>
    </footer>
  );
};

export default Footer;

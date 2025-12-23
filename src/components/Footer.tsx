import { forwardRef } from "react";
import { Heart } from "lucide-react";

const Footer = forwardRef<HTMLElement>((props, ref) => {
  return (
    <footer ref={ref} className="border-t border-border/50 bg-background/50 py-6" {...props}>
      <div className="container mx-auto px-4 text-center md:px-6">
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          DragonTable - Table Virtuelle D&D 5e • Créé avec
          <Heart className="h-4 w-4 fill-destructive text-destructive" />
          pour les aventuriers
        </p>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";

export default Footer;

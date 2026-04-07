import { forwardRef } from "react";
import { Globe } from "lucide-react";

const Footer = forwardRef<HTMLElement>((props, ref) => {
  return (
    <footer ref={ref} className="border-t border-border/30 bg-background/50 py-6" {...props}>
      <div className="container mx-auto px-4 text-center md:px-6">
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4 text-primary" />
          <span className="font-display text-primary">Aetheria VTT</span>
          — Table Virtuelle Immersive pour l'univers Aetheria
        </p>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";

export default Footer;
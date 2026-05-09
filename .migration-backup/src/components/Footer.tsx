import { forwardRef } from "react";
import { Swords, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = forwardRef<HTMLElement>((props, ref) => {
  return (
    <footer ref={ref} className="border-t border-border/20 bg-background/80 backdrop-blur-sm py-8" {...props}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold">
              <Swords className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-gradient-gold">Aetheria VTT</p>
              <p className="text-[10px] text-muted-foreground">Table Virtuelle Immersive</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link to="/campaigns" className="hover:text-primary transition-colors">Campagnes</Link>
            <Link to="/characters" className="hover:text-primary transition-colors">Personnages</Link>
            <Link to="/compendium" className="hover:text-primary transition-colors">Codex</Link>
            <Link to="/dice" className="hover:text-primary transition-colors">Dés</Link>
          </nav>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Sparkles className="h-3 w-3" />
            Univers Aetheria
          </p>
        </div>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";

export default Footer;

import { forwardRef } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = forwardRef<HTMLElement>((props, ref) => {
  return (
    <footer ref={ref} className="border-t py-8" style={{ borderColor: "hsl(43,75%,50%,0.10)", background: "hsl(215,70%,7%)" }} {...props}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <img src="/aetheria-logo.png" alt="Aetheria" className="h-8 w-8 rounded-full object-cover opacity-90" />
            <div>
              <p className="font-display text-sm font-semibold text-gradient-gold">Aetheria VTT</p>
              <p className="text-[10px] text-muted-foreground">Table Virtuelle Immersive</p>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link to="/campaigns" className="hover:text-amber-400 transition-colors">Campagnes</Link>
            <Link to="/characters" className="hover:text-amber-400 transition-colors">Personnages</Link>
            <Link to="/compendium" className="hover:text-amber-400 transition-colors">Codex</Link>
            <Link to="/subscriptions" className="hover:text-amber-400 transition-colors">Abonnements</Link>
          </nav>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
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

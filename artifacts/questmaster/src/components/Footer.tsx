import { forwardRef } from "react";
import { Cookie, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/lib/cookieConsent";

const Footer = forwardRef<HTMLElement>((props, ref) => {
  return (
    <footer ref={ref} className="border-t py-8" style={{ borderColor: "hsl(43,75%,50%,0.10)", background: "hsl(228,70%,7%)" }} {...props}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-[1fr_auto_auto] md:items-start">
          <div className="flex items-center gap-3">
            <img src="/aetheria-logo.png" alt="Aetheria" className="h-8 w-8 rounded-full object-cover opacity-90" />
            <div>
              <p className="font-display text-sm font-semibold text-gradient-gold">Aetheria VTT</p>
              <p className="text-[10px] text-muted-foreground">Table Virtuelle Immersive</p>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link to="/campaigns" className="hover:text-primary transition-colors">Campagnes</Link>
            <Link to="/compendium" className="hover:text-primary transition-colors">Codex</Link>
            <Link to="/guide" className="hover:text-primary transition-colors">Guide</Link>
            <Link to="/subscriptions" className="hover:text-primary transition-colors">Abonnements</Link>
          </nav>
          <div><p className="mb-2 font-display text-xs font-semibold text-primary">Juridique</p><nav className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <Link to="/mentions-legales" className="hover:text-primary">Mentions légales</Link><Link to="/cgu" className="hover:text-primary">CGU</Link><Link to="/cgv" className="hover:text-primary">CGV</Link><Link to="/confidentialite" className="hover:text-primary">Confidentialité</Link><Link to="/cookies" className="hover:text-primary">Cookies</Link><Link to="/credits-licences" className="hover:text-primary">Crédits & licences</Link><Link to="/retractation" className="hover:text-primary">Rétractation</Link><Link to="/politique-remboursement" className="hover:text-primary">Remboursements</Link>
          </nav><Button variant="ghost" size="sm" className="mt-2 h-auto px-0 text-xs text-muted-foreground hover:text-primary" onClick={openCookieSettings}><Cookie className="h-3 w-3" />Paramètres des cookies</Button></div>
        </div>
        <p className="mt-7 flex items-center justify-center gap-1.5 border-t border-border/30 pt-5 text-xs text-muted-foreground/50"><Sparkles className="h-3 w-3" />Univers Aetheria</p>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";

export default Footer;

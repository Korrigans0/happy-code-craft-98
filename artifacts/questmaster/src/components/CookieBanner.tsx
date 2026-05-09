import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "aetheria.cookie-consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage indisponible (mode privé Safari) : on n'affiche rien
    }
    return undefined;
  }, []);

  const persist = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Préférences de cookies"
      className="fixed bottom-0 left-0 right-0 z-[60] mx-auto mb-[max(0.5rem,env(safe-area-inset-bottom))] w-[calc(100%-1rem)] max-w-2xl rounded-xl border border-border/40 bg-card/95 p-4 shadow-2xl backdrop-blur-xl animate-fade-in md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm text-foreground">
            Nous utilisons uniquement des cookies <strong>essentiels</strong> (session,
            préférences) pour faire fonctionner Aetheria VTT. Aucun traceur publicitaire,
            conformément au RGPD.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="gold" onClick={() => persist("accepted")}>
              J'ai compris
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => persist("rejected")}
              className="text-muted-foreground"
            >
              Refuser le non-essentiel
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Fermer"
          onClick={() => persist("rejected")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;

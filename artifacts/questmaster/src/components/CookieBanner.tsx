import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { openCookieSettings, readCookieConsent, saveCookieConsent } from "@/lib/cookieConsent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!readCookieConsent()) {
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage indisponible (mode privé Safari) : on n'affiche rien
    }
    return undefined;
  }, []);

  const persist = (preferences: boolean) => {
    saveCookieConsent(preferences);
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
            Nous utilisons des stockages nécessaires au fonctionnement et, avec votre accord,
            des préférences sur cet appareil. Aucun traceur statistique ou publicitaire n’est activé.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="gold" onClick={() => persist(true)}>
              Accepter
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => persist(false)}
              className="border border-border text-foreground"
            >
              Refuser
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setVisible(false); openCookieSettings(); }}>Personnaliser</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;

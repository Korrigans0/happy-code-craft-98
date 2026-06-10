import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "mobile_banner_shown";

const MobileBanner = () => {
  const isMobile = useIsMobile();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== "1") {
        setShowBanner(true);
      }
    } catch {
      setShowBanner(true);
    }
  }, [isMobile]);

  if (!isMobile || !showBanner) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center pb-8 px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <Smartphone className="h-6 w-6 text-amber-400" />
          <h3 className="font-display font-bold text-foreground">
            Version Mobile
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          La version mobile d'Aetheria VTT est optimisée pour :
        </p>
        <ul className="space-y-1.5 text-sm mb-5">
          <li className="flex items-center gap-2 text-muted-foreground">
            <span className="text-green-400">✓</span>
            Joueurs — déplacer vos tokens, lancer des dés, discuter
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <span className="text-green-400">✓</span>
            MJ — modifications rapides des paramètres
          </li>
          <li className="flex items-center gap-2 text-amber-400/70">
            <span>⚠</span>
            Murs, lumières et outils avancés sur desktop uniquement
          </li>
        </ul>
        <Button
          className="w-full font-bold"
          style={{
            background: "linear-gradient(135deg, hsl(43,75%,50%) 0%, hsl(35,85%,40%) 100%)",
            color: "hsl(215,70%,8%)",
          }}
          onClick={() => {
            try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* noop */ }
            setShowBanner(false);
          }}
        >
          Compris, on joue !
        </Button>
      </div>
    </div>
  );
};

export default MobileBanner;

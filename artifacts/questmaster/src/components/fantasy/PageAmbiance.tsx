import MagicParticles from "./MagicParticles";
import FloatingRunes from "./FloatingRunes";
import MistOverlay from "./MistOverlay";
import SideDecorations from "./SideDecorations";
import heroBg from "@/assets/hero-fantasy-bg.jpg";

interface PageAmbianceProps {
  /** Image opacity 0..1 (default 0.18). */
  imageOpacity?: number;
  /** Hide side decorations (default false). */
  noSides?: boolean;
  /** Hide runes (default false). */
  noRunes?: boolean;
}

/**
 * Décor fantasy partagé : fond image + brume + particules + runes + décors latéraux.
 * À placer en premier enfant d'un conteneur `relative` couvrant la page.
 */
const PageAmbiance = ({ imageOpacity = 0.18, noSides = false, noRunes = false }: PageAmbianceProps) => (
  <>
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={heroBg}
        alt=""
        className="h-full w-full object-cover"
        style={{ opacity: imageOpacity }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(215, 70%, 6%, 0.55) 0%, hsl(215, 75%, 5%, 0.85) 60%, hsl(215, 80%, 4%, 0.98) 100%)",
        }}
      />
      <MistOverlay />
      {!noSides && <SideDecorations />}
      <MagicParticles />
      {!noRunes && <FloatingRunes />}
    </div>
  </>
);

export default PageAmbiance;

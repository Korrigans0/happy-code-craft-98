// ============================================================
// FANTASY TOOL ICONS — Aetheria VTT (v3, illustrées)
// Icônes peintes (style dark fantasy game-asset) pour la barre
// d'outils de la table de campagne. Chaque icône est une image
// PNG transparente exportée depuis la planche d'icônes.
// Les rares outils sans illustration restent en SVG `currentColor`.
// ============================================================

import { SVGProps, ImgHTMLAttributes } from "react";

import moveIcon from "@/assets/vtt-icons/move.png";
import pingIcon from "@/assets/vtt-icons/ping.png";
import pencilIcon from "@/assets/vtt-icons/pencil.png";
import eraserIcon from "@/assets/vtt-icons/eraser.png";
import rectIcon from "@/assets/vtt-icons/rect.png";
import circleIcon from "@/assets/vtt-icons/circle.png";
import textIcon from "@/assets/vtt-icons/text.png";
import coneIcon from "@/assets/vtt-icons/cone.png";
import zoneIcon from "@/assets/vtt-icons/zone.png";
import fogIcon from "@/assets/vtt-icons/fog.png";
import wallIcon from "@/assets/vtt-icons/wall.png";
import wallBreakIcon from "@/assets/vtt-icons/wallbreak.png";
import windowIcon from "@/assets/vtt-icons/window.png";
import doorIcon from "@/assets/vtt-icons/door.png";
import terrainIcon from "@/assets/vtt-icons/terrain.png";
import lightIcon from "@/assets/vtt-icons/light.png";
import lightOffIcon from "@/assets/vtt-icons/lightoff.png";
import flareIcon from "@/assets/vtt-icons/flare.png";

type Props = SVGProps<SVGSVGElement> & { className?: string };
type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { className?: string };

/** Fabrique un composant icône image compatible avec l'API des anciennes icônes SVG. */
const makeIcon = (src: string, alt: string) => {
  const Icon = ({ className, ...rest }: ImgProps) => (
    <img
      src={src}
      alt={alt}
      aria-hidden="true"
      draggable={false}
      loading="lazy"
      width={128}
      height={128}
      className={`${className ?? "h-4 w-4"} object-contain select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]`}
      {...rest}
    />
  );
  Icon.displayName = alt;
  return Icon;
};

/* ── Navigation & annotations ──────────────────────────────── */
export const FIMove = makeIcon(moveIcon, "Navigation");
export const FIPing = makeIcon(pingIcon, "Ping");
export const FIQuill = makeIcon(pencilIcon, "Crayon");
export const FIEraser = makeIcon(eraserIcon, "Gomme");
export const FIRect = makeIcon(rectIcon, "Carré");
export const FICircle = makeIcon(circleIcon, "Cercle");
export const FIText = makeIcon(textIcon, "Texte");

/* ── Zones d'effet ─────────────────────────────────────────── */
export const FICone = makeIcon(coneIcon, "Zone d'effet en cône");
export const FIZone = makeIcon(zoneIcon, "Zone d'effet circulaire");

/* ── Outils MJ ─────────────────────────────────────────────── */
export const FIEye = makeIcon(fogIcon, "Révéler le brouillard");
export const FIHelm = makeIcon(flareIcon, "Outils MJ");

/* ── Murs & ouvertures ─────────────────────────────────────── */
export const FIWall = makeIcon(wallIcon, "Mur");
export const FIWindow = makeIcon(windowIcon, "Fenêtre");
export const FIDoor = makeIcon(doorIcon, "Porte");
export const FIBriars = makeIcon(terrainIcon, "Terrain difficile");
export const FIWallBreak = makeIcon(wallBreakIcon, "Effacer le mur");

/* ── Lumières ──────────────────────────────────────────────── */
export const FITorch = makeIcon(lightIcon, "Lumière");
export const FITorchOff = makeIcon(lightOffIcon, "Retirer la lumière");

/* ── Mesure (reste vectorielle) ────────────────────────────── */
export const FIMeasure = ({ className, ...rest }: Props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "h-4 w-4"}
    {...rest}
  >
    <path d="M3.5 16.5L16.5 3.5l4 4-13 13z" fill="currentColor" fillOpacity={0.18} />
    <path d="M3.5 16.5L16.5 3.5l4 4-13 13z" />
    <path d="M7 13l1.5 1.5M10 10l1.5 1.5M13 7l1.5 1.5" opacity="0.65" />
  </svg>
);

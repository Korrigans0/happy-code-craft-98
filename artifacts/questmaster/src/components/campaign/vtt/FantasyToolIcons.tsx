// ============================================================
// FANTASY TOOL ICONS — Aetheria VTT
// Icônes SVG sur-mesure en style dark fantasy pour la barre d'outils.
// Toutes utilisent `currentColor` pour rester compatibles avec les
// états actifs / hover existants (bg-primary text-primary-foreground).
// ============================================================

import { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { className?: string };

const base = (extra?: string) =>
  `h-4 w-4 ${extra ?? ""}`.trim();

const Svg = ({ className, children, ...rest }: Props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? base()}
    {...rest}
  >
    {children}
  </svg>
);

/* ── Navigation ────────────────────────────────────────────── */

// Boussole / curseur arcanique
export const FIMove = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
    <path d="M12 7l2.5 7L12 12 9.5 14z" fill="currentColor" stroke="none" />
  </Svg>
);

// Phare / balise
export const FIPing = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3l2.2 5 5.3.5-4 3.7 1.2 5.3L12 14.8 7.3 17.5l1.2-5.3-4-3.7L9.8 8z" />
    <circle cx="12" cy="11" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

/* ── Dessin ────────────────────────────────────────────────── */

// Plume d'oie
export const FIQuill = (p: Props) => (
  <Svg {...p}>
    <path d="M20 4c-3 .5-6 2-9 5s-4.5 6-5 9" />
    <path d="M20 4l-2 8-5 5-7 1 1-3 4-1 4-4z" />
    <path d="M6 18l-2 2" />
  </Svg>
);

// Chiffon / gomme à enluminure
export const FIEraser = (p: Props) => (
  <Svg {...p}>
    <path d="M4 14l8-8 6 6-8 8z" />
    <path d="M9 9l6 6" />
    <path d="M4 14l4 4h8" />
  </Svg>
);

// Pierre runique carrée
export const FIRect = (p: Props) => (
  <Svg {...p}>
    <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" />
    <path d="M8 8l8 8M8 16l8-8" opacity="0.45" />
  </Svg>
);

// Cercle runique
export const FICircle = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="4" opacity="0.5" />
    <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2" opacity="0.6" />
  </Svg>
);

// Lettrine / parchemin
export const FIText = (p: Props) => (
  <Svg {...p}>
    <path d="M5.5 4.5h13" />
    <path d="M12 4.5v15" />
    <path d="M9 19.5h6" />
    <path d="M5.5 4.5l-1 3M18.5 4.5l1 3" opacity="0.6" />
  </Svg>
);

/* ── Mesure ────────────────────────────────────────────────── */

// Chaîne d'arpenteur
export const FIMeasure = (p: Props) => (
  <Svg {...p}>
    <path d="M4 16l12-12 4 4-12 12z" />
    <path d="M7 13l1.5 1.5M10 10l1.5 1.5M13 7l1.5 1.5" />
    <circle cx="5" cy="17" r="1.2" />
    <circle cx="19" cy="3" r="1.2" />
  </Svg>
);

/* ── Zones d'effet ─────────────────────────────────────────── */

// Cône de sort
export const FICone = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3l8 17H4z" />
    <path d="M8 14h8M10 17h4" opacity="0.6" />
    <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

// Sceau magique / zone
export const FIZone = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4l-3 8 3 8 3-8z" opacity="0.5" />
    <path d="M4 12l8-3 8 3-8 3z" opacity="0.5" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </Svg>
);

/* ── Outils MJ ─────────────────────────────────────────────── */

// Heaume (groupe MJ)
export const FIHelm = (p: Props) => (
  <Svg {...p}>
    <path d="M4.5 11c0-4 3.5-7 7.5-7s7.5 3 7.5 7v5l-2 1.5h-11L4.5 16z" />
    <path d="M9 11v3M15 11v3" />
    <path d="M4.5 13h15" opacity="0.5" />
  </Svg>
);

// Œil omniscient (révéler brouillard)
export const FIEye = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 6V4M12 20v-2" opacity="0.5" />
  </Svg>
);

// Mur de pierre
export const FIWall = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="0.8" />
    <path d="M3.5 9.5h17M3.5 14.5h17" />
    <path d="M9 5v4.5M15 9.5V14.5M9 14.5V19M15 5v4.5" />
  </Svg>
);

// Porte cintrée
export const FIDoor = (p: Props) => (
  <Svg {...p}>
    <path d="M5 20V9a7 7 0 0114 0v11" />
    <path d="M5 20h14" />
    <circle cx="15.5" cy="13" r="0.8" fill="currentColor" stroke="none" />
    <path d="M12 4v16" opacity="0.4" />
  </Svg>
);

// Vitrail / fenêtre
export const FIWindow = (p: Props) => (
  <Svg {...p}>
    <path d="M5 20V9a7 7 0 0114 0v11z" />
    <path d="M5 14h14M12 4v16" opacity="0.7" />
  </Svg>
);

// Ronces / terrain difficile
export const FIBriars = (p: Props) => (
  <Svg {...p}>
    <path d="M3 20c3-1 4-4 4-7s-1-5-3-7" />
    <path d="M21 20c-3-1-4-4-4-7s1-5 3-7" />
    <path d="M12 20V8" />
    <path d="M9 12l-2-1M9 16l-2-1M15 12l2-1M15 16l2-1M12 9l-2-2M12 9l2-2" />
  </Svg>
);

// Mur brisé (effacer mur)
export const FIWallBreak = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 19V5h17v14" />
    <path d="M3.5 11l4 2-2 3 4 1-1 3" />
    <path d="M20.5 11l-4 2 2 3-4 1 1 3" />
    <path d="M12 5v6" />
  </Svg>
);

/* ── Lumières ──────────────────────────────────────────────── */

// Torche allumée
export const FITorch = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3c-2 3 2 4 0 7-3-1-3-5 0-7z" />
    <path d="M10 10c-1 1.5-1 3 0 4h4c1-1 1-2.5 0-4" />
    <path d="M11 14v7M13 14v7" />
    <path d="M9 21h6" />
  </Svg>
);

// Torche éteinte
export const FITorchOff = (p: Props) => (
  <Svg {...p}>
    <path d="M10 10c-1 1.5-1 3 0 4h4c1-1 1-2.5 0-4" />
    <path d="M11 14v7M13 14v7" />
    <path d="M9 21h6" />
    <path d="M5 4l14 14" />
    <path d="M12 6c-1 1.5 0 2.5-.5 4" opacity="0.6" />
  </Svg>
);

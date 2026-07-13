// ============================================================
// FANTASY TOOL ICONS — Aetheria VTT (v2, dual-tone)
// SVG sur-mesure, style dark fantasy gravé.
// Toutes les icônes utilisent `currentColor` (stroke) + un accent
// rempli à 0.22 opacité pour donner de la profondeur. Elles restent
// compatibles avec les états actifs/hover de la toolbar (or/ambre).
// ============================================================

import { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { className?: string };

const Svg = ({ className, children, ...rest }: Props) => (
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
    {children}
  </svg>
);

// Petit helper pour le "remplissage tonal"
const F = "currentColor";
const fillAcc = { fill: F, fillOpacity: 0.18, stroke: F } as const;
const fillSoft = { fill: F, fillOpacity: 0.28, stroke: "none" } as const;

/* ── Navigation ────────────────────────────────────────────── */

// Rose des vents arcanique
export const FIMove = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="5" opacity="0.35" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    <path d="M12 5.5l2.2 6.5L12 10.4 9.8 12z" {...fillAcc} />
    <path d="M12 18.5l-2.2-6.5L12 13.6l2.2-1.6z" {...fillAcc} />
    <circle cx="12" cy="12" r="1" {...fillSoft} />
  </Svg>
);

// Balise / phare lumineux
export const FIPing = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 15.6 6.8 18.5l1.4-5.9-4.6-4 6-.5z" {...fillAcc} />
    <circle cx="12" cy="11.5" r="1.4" {...fillSoft} />
    <path d="M12 21v-2.4" opacity="0.5" />
  </Svg>
);

/* ── Dessin ────────────────────────────────────────────────── */

// Plume d'oie encrée
export const FIQuill = (p: Props) => (
  <Svg {...p}>
    <path d="M20 3.5c-3.2.4-6.2 1.9-9 4.7s-4.7 6-5.3 9.1l6.7-.7 4.2-4.2 3.4-4.2z" {...fillAcc} />
    <path d="M20 3.5c-3.2.4-6.2 1.9-9 4.7s-4.7 6-5.3 9.1" />
    <path d="M9 12l3.5 3.5" opacity="0.6" />
    <path d="M6 18l-2.2 2.2" />
    <circle cx="3.4" cy="20.6" r="0.9" {...fillSoft} />
  </Svg>
);

// Gomme parchemin
export const FIEraser = (p: Props) => (
  <Svg {...p}>
    <path d="M13.5 3.5l7 7-9 9-7-7z" {...fillAcc} />
    <path d="M13.5 3.5l7 7-9 9-7-7z" />
    <path d="M8.5 8.5l7 7" opacity="0.55" />
    <path d="M4.5 12.5H15" opacity="0.4" />
  </Svg>
);

// Pierre runique carrée
export const FIRect = (p: Props) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" {...fillAcc} />
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M7.5 7.5l9 9M7.5 16.5l9-9" opacity="0.45" />
    <circle cx="12" cy="12" r="1" {...fillSoft} />
  </Svg>
);

// Cercle runique
export const FICircle = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" {...fillAcc} />
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4.2" opacity="0.55" />
    <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2" opacity="0.6" />
    <circle cx="12" cy="12" r="1" {...fillSoft} />
  </Svg>
);

// Lettrine gravée
export const FIText = (p: Props) => (
  <Svg {...p}>
    <path d="M4 5l1-1.5h14L20 5" opacity="0.6" />
    <path d="M5.5 4.5h13" />
    <path d="M12 4.5v15" />
    <path d="M9 19.5h6" />
    <path d="M10 8l2-2.5L14 8" opacity="0.5" />
  </Svg>
);

/* ── Mesure ────────────────────────────────────────────────── */

// Chaîne d'arpenteur
export const FIMeasure = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 16.5L16.5 3.5l4 4-13 13z" {...fillAcc} />
    <path d="M3.5 16.5L16.5 3.5l4 4-13 13z" />
    <path d="M7 13l1.5 1.5M10 10l1.5 1.5M13 7l1.5 1.5" opacity="0.65" />
    <circle cx="4.5" cy="17.5" r="1.3" {...fillSoft} />
    <circle cx="19.5" cy="2.5" r="1.3" {...fillSoft} />
  </Svg>
);

/* ── Zones d'effet ─────────────────────────────────────────── */

// Cône de sort
export const FICone = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5l8.5 18H3.5z" {...fillAcc} />
    <path d="M12 2.5l8.5 18H3.5z" />
    <path d="M7.5 14h9M9.5 17.5h5" opacity="0.55" />
    <circle cx="12" cy="2.8" r="1.1" {...fillSoft} />
  </Svg>
);

// Sceau magique / zone
export const FIZone = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" {...fillAcc} />
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5l-3.2 8.5L12 20.5l3.2-8.5z" opacity="0.55" />
    <path d="M3.5 12l8.5-3.2L20.5 12 12 15.2z" opacity="0.55" />
    <circle cx="12" cy="12" r="1.5" {...fillSoft} />
  </Svg>
);

/* ── Outils MJ ─────────────────────────────────────────────── */

// Grand heaume
export const FIHelm = (p: Props) => (
  <Svg {...p}>
    <path d="M4 11.5C4 7 7.6 3.5 12 3.5S20 7 20 11.5V16l-2 1.8H6L4 16z" {...fillAcc} />
    <path d="M4 11.5C4 7 7.6 3.5 12 3.5S20 7 20 11.5V16l-2 1.8H6L4 16z" />
    <path d="M4 13h16" opacity="0.55" />
    <path d="M9 13.2v3M15 13.2v3" />
    <path d="M12 3.5V13" opacity="0.5" />
    <path d="M6 17.8l1.5 2M18 17.8l-1.5 2" opacity="0.5" />
  </Svg>
);

// Œil omniscient
export const FIEye = (p: Props) => (
  <Svg {...p}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" {...fillAcc} />
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="3.2" />
    <circle cx="12" cy="12" r="1.3" {...fillSoft} />
    <path d="M12 3.5v1.6M12 20v-1.6M4 5l1.2 1.2M20 5l-1.2 1.2" opacity="0.55" />
  </Svg>
);

// Mur de pierre appareillé
export const FIWall = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="1" {...fillAcc} />
    <rect x="3" y="4.5" width="18" height="15" rx="1" />
    <path d="M3 9.5h18M3 14.5h18" />
    <path d="M8 4.5v5M16 4.5v5M11 9.5v5M6 14.5v5M14 14.5v5" />
  </Svg>
);

// Porte cintrée avec heurtoir
export const FIDoor = (p: Props) => (
  <Svg {...p}>
    <path d="M5 20V9.5A7 7 0 0112 2.5 7 7 0 0119 9.5V20z" {...fillAcc} />
    <path d="M5 20V9.5A7 7 0 0112 2.5 7 7 0 0119 9.5V20" />
    <path d="M4 20h16" />
    <circle cx="15.5" cy="13" r="1" {...fillSoft} />
    <path d="M12 2.5V20" opacity="0.45" />
    <path d="M8 8.5l4-3 4 3" opacity="0.5" />
  </Svg>
);

// Vitrail à losange
export const FIWindow = (p: Props) => (
  <Svg {...p}>
    <path d="M5 20V9.5A7 7 0 0112 2.5 7 7 0 0119 9.5V20z" {...fillAcc} />
    <path d="M5 20V9.5A7 7 0 0112 2.5 7 7 0 0119 9.5V20z" />
    <path d="M12 3v17M5 11.5h14" opacity="0.75" />
    <path d="M12 5l4 6-4 6-4-6z" opacity="0.4" />
  </Svg>
);

// Ronces
export const FIBriars = (p: Props) => (
  <Svg {...p}>
    <path d="M12 21V4" />
    <path d="M3.5 20c3-.7 4.5-3.5 4.5-7s-1.2-5.5-3-7" />
    <path d="M20.5 20c-3-.7-4.5-3.5-4.5-7s1.2-5.5 3-7" />
    <path d="M9 11l-2.2-.8M9 15l-2.2-.8M15 11l2.2-.8M15 15l2.2-.8" />
    <path d="M12 8l-2.2-2M12 8l2.2-2" />
    <circle cx="12" cy="4" r="1" {...fillSoft} />
  </Svg>
);

// Mur brisé
export const FIWallBreak = (p: Props) => (
  <Svg {...p}>
    <path d="M3 5h18v14H3z" {...fillAcc} />
    <path d="M3 5h18v14" />
    <path d="M3 19V5" opacity="0.3" />
    <path d="M3 10.5l4 2-1.8 3 3.5 1-1 3.5" />
    <path d="M21 10.5l-4 2 1.8 3-3.5 1 1 3.5" />
    <path d="M12 5v6" opacity="0.7" />
  </Svg>
);

/* ── Lumières ──────────────────────────────────────────────── */

// Torche flamboyante
export const FITorch = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5c-2.4 2.8 2.2 4-.2 7.2-3-1-3.2-5.4.2-7.2z" {...fillAcc} />
    <path d="M12 2.5c-2.4 2.8 2.2 4-.2 7.2-3-1-3.2-5.4.2-7.2z" />
    <path d="M9.5 9.5c-1.2 1.6-1.2 3.2 0 4.5h5c1.2-1.3 1.2-2.9 0-4.5" />
    <path d="M10.5 14v7M13.5 14v7" />
    <path d="M8.5 21h7" />
    <path d="M11 6.5c-.6 1.2.3 2 0 3" opacity="0.55" />
  </Svg>
);

// Torche éteinte
export const FITorchOff = (p: Props) => (
  <Svg {...p}>
    <path d="M9.5 9.5c-1.2 1.6-1.2 3.2 0 4.5h5c1.2-1.3 1.2-2.9 0-4.5" {...fillAcc} />
    <path d="M9.5 9.5c-1.2 1.6-1.2 3.2 0 4.5h5c1.2-1.3 1.2-2.9 0-4.5" />
    <path d="M10.5 14v7M13.5 14v7" />
    <path d="M8.5 21h7" />
    <path d="M4 3.5l16 17" />
    <path d="M12 5c-.6 1.2.3 2 0 3" opacity="0.5" />
  </Svg>
);

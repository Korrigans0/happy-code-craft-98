// Campaign customization — ambiances & accent color.
//
// The theme is stored in `campaigns.theme` (jsonb) and only affects the
// campaign play area: it never leaks into the rest of the app.

export interface CampaignTheme {
  /** Preset id (see CAMPAIGN_AMBIANCES) */
  ambiance?: string;
  /** Accent hue 0..360 — overrides the ambiance accent when set */
  hue?: number;
  /** Optional short "baseline" shown under the campaign title */
  tagline?: string;
}

export interface AmbiancePreset {
  id: string;
  label: string;
  description: string;
  /** HSL accent (h s% l%) used for --primary / --ring */
  accent: string;
  /** Background gradient applied behind the campaign area */
  background: string;
  /** Default hue used by the color slider */
  hue: number;
}

export const CAMPAIGN_AMBIANCES: AmbiancePreset[] = [
  {
    id: "arcane",
    label: "Arcane",
    description: "Indigo profond et or — l'ambiance signature d'Aetheria.",
    accent: "43 74% 55%",
    hue: 43,
    background:
      "radial-gradient(ellipse at top, hsl(250 60% 12% / 0.9) 0%, hsl(228 75% 5%) 60%, hsl(228 80% 4%) 100%)",
  },
  {
    id: "sylvan",
    label: "Sylvestre",
    description: "Forêts anciennes, brumes vertes et lueurs d'émeraude.",
    accent: "142 55% 48%",
    hue: 142,
    background:
      "radial-gradient(ellipse at top, hsl(160 45% 10% / 0.9) 0%, hsl(170 60% 5%) 60%, hsl(175 65% 4%) 100%)",
  },
  {
    id: "infernal",
    label: "Infernal",
    description: "Braises, cendres et rouges ardents pour les campagnes sombres.",
    accent: "12 80% 55%",
    hue: 12,
    background:
      "radial-gradient(ellipse at top, hsl(0 50% 12% / 0.9) 0%, hsl(350 60% 6%) 60%, hsl(345 65% 4%) 100%)",
  },
  {
    id: "abyssal",
    label: "Abyssal",
    description: "Profondeurs océaniques, cyan glacial et silence.",
    accent: "190 80% 50%",
    hue: 190,
    background:
      "radial-gradient(ellipse at top, hsl(200 60% 11% / 0.9) 0%, hsl(205 70% 5%) 60%, hsl(210 75% 4%) 100%)",
  },
  {
    id: "eldritch",
    label: "Indicible",
    description: "Violets malsains et lueurs blafardes — idéal pour l'horreur.",
    accent: "280 65% 60%",
    hue: 280,
    background:
      "radial-gradient(ellipse at top, hsl(275 45% 12% / 0.9) 0%, hsl(270 55% 6%) 60%, hsl(265 60% 4%) 100%)",
  },
  {
    id: "ashen",
    label: "Cendres",
    description: "Gris de pierre et argent terni, sobre et neutre.",
    accent: "215 20% 65%",
    hue: 215,
    background:
      "radial-gradient(ellipse at top, hsl(220 15% 14% / 0.9) 0%, hsl(220 20% 7%) 60%, hsl(220 25% 5%) 100%)",
  },
];

export const DEFAULT_AMBIANCE = CAMPAIGN_AMBIANCES[0];

export function getAmbiance(id?: string | null): AmbiancePreset {
  return CAMPAIGN_AMBIANCES.find((a) => a.id === id) ?? DEFAULT_AMBIANCE;
}

/** Normalizes whatever is stored in the jsonb column into a safe theme object. */
export function parseTheme(raw: unknown): CampaignTheme {
  if (!raw || typeof raw !== "object") return {};
  const t = raw as Record<string, unknown>;
  const hue = typeof t.hue === "number" && t.hue >= 0 && t.hue <= 360 ? t.hue : undefined;
  return {
    ambiance: typeof t.ambiance === "string" ? t.ambiance : undefined,
    hue,
    tagline: typeof t.tagline === "string" ? t.tagline.slice(0, 120) : undefined,
  };
}

/**
 * CSS custom properties to apply on the campaign container.
 * Only tokens are overridden — no hardcoded component colors.
 */
export function themeStyle(theme: CampaignTheme): React.CSSProperties {
  const preset = getAmbiance(theme.ambiance);
  const hue = theme.hue ?? preset.hue;
  const [, s, l] = preset.accent.split(" ");
  const accent = `${hue} ${s} ${l}`;
  return {
    ["--primary" as string]: accent,
    ["--ring" as string]: accent,
    backgroundImage: preset.background,
  } as React.CSSProperties;
}

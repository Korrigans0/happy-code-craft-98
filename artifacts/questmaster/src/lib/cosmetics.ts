// Cosmetics — personnalisation visuelle par utilisateur.
//
// Catalogue purement déclaratif : skins de dés, cadres de tokens, thèmes
// d'interface et packs de bruitages. Les valeurs sont exposées en variables
// CSS sur <html> pour que n'importe quel composant puisse s'y accrocher.

export interface CosmeticOption {
  id: string;
  label: string;
  description: string;
  /** Couleurs HSL (sans hsl()) appliquées en variables CSS */
  vars?: Record<string, string>;
  /** Aperçu : dégradé CSS */
  preview: string;
}

export const DICE_SKINS: CosmeticOption[] = [
  { id: "gold", label: "Or ancien", description: "Le style Aetheria par défaut.", preview: "linear-gradient(135deg,hsl(43 74% 55%),hsl(35 60% 35%))", vars: { "--dice-skin": "43 74% 55%", "--dice-skin-edge": "35 60% 35%" } },
  { id: "arcane", label: "Violet arcanique", description: "Éclat magique et runes vives.", preview: "linear-gradient(135deg,hsl(268 70% 62%),hsl(250 60% 32%))", vars: { "--dice-skin": "268 70% 62%", "--dice-skin-edge": "250 60% 32%" } },
  { id: "blood", label: "Serment de sang", description: "Rouge sombre pour tables brutales.", preview: "linear-gradient(135deg,hsl(0 65% 50%),hsl(0 50% 25%))", vars: { "--dice-skin": "0 65% 50%", "--dice-skin-edge": "0 50% 25%" } },
  { id: "frost", label: "Givre éternel", description: "Bleu glacier translucide.", preview: "linear-gradient(135deg,hsl(196 80% 60%),hsl(210 60% 30%))", vars: { "--dice-skin": "196 80% 60%", "--dice-skin-edge": "210 60% 30%" } },
  { id: "verdant", label: "Sylve profonde", description: "Vert mousse des bois anciens.", preview: "linear-gradient(135deg,hsl(140 45% 48%),hsl(150 40% 22%))", vars: { "--dice-skin": "140 45% 48%", "--dice-skin-edge": "150 40% 22%" } },
  { id: "obsidian", label: "Obsidienne", description: "Noir mat et reflets froids.", preview: "linear-gradient(135deg,hsl(220 12% 32%),hsl(220 15% 12%))", vars: { "--dice-skin": "220 12% 32%", "--dice-skin-edge": "220 15% 12%" } },
];

export const TOKEN_FRAMES: CosmeticOption[] = [
  { id: "classic", label: "Cercle doré", description: "Anneau fin, lisible sur toutes les cartes.", preview: "radial-gradient(circle,transparent 55%,hsl(43 74% 55%) 60%)", vars: { "--token-frame": "43 74% 55%", "--token-frame-width": "2px" } },
  { id: "heavy", label: "Fer forgé", description: "Anneau épais, style guerrier.", preview: "radial-gradient(circle,transparent 50%,hsl(30 20% 45%) 56%)", vars: { "--token-frame": "30 20% 45%", "--token-frame-width": "4px" } },
  { id: "arcane", label: "Halo arcanique", description: "Cercle violet lumineux.", preview: "radial-gradient(circle,transparent 55%,hsl(268 70% 62%) 60%)", vars: { "--token-frame": "268 70% 62%", "--token-frame-width": "3px" } },
  { id: "none", label: "Sans cadre", description: "Portrait brut, sans anneau.", preview: "radial-gradient(circle,transparent 60%,transparent 61%)", vars: { "--token-frame": "0 0% 0%", "--token-frame-width": "0px" } },
];

export const UI_THEMES: CosmeticOption[] = [
  { id: "aetheria", label: "Aetheria", description: "Indigo profond et or.", preview: "linear-gradient(135deg,hsl(240 40% 12%),hsl(43 74% 55%))", vars: { "--accent-hue": "43" } },
  { id: "abyss", label: "Abysse", description: "Bleu nuit et écume pâle.", preview: "linear-gradient(135deg,hsl(215 50% 10%),hsl(196 80% 60%))", vars: { "--accent-hue": "196" } },
  { id: "ember", label: "Braise", description: "Ambre chaud sur cendres.", preview: "linear-gradient(135deg,hsl(20 40% 10%),hsl(20 85% 55%))", vars: { "--accent-hue": "20" } },
  { id: "grimoire", label: "Grimoire", description: "Pourpre et parchemin.", preview: "linear-gradient(135deg,hsl(280 35% 12%),hsl(268 70% 62%))", vars: { "--accent-hue": "268" } },
];

export const SFX_PACKS: CosmeticOption[] = [
  { id: "default", label: "Tables classiques", description: "Bruitages standards d'Aetheria.", preview: "linear-gradient(135deg,hsl(43 40% 30%),hsl(43 74% 55%))" },
  { id: "wood", label: "Bois & cuir", description: "Dés sur table de bois, feutré.", preview: "linear-gradient(135deg,hsl(28 40% 25%),hsl(28 60% 45%))" },
  { id: "crystal", label: "Cristal", description: "Sonorités claires et magiques.", preview: "linear-gradient(135deg,hsl(196 40% 25%),hsl(196 80% 60%))" },
  { id: "silent", label: "Silencieux", description: "Aucun bruitage cosmétique.", preview: "linear-gradient(135deg,hsl(220 10% 20%),hsl(220 10% 35%))" },
];

export const COSMETIC_GROUPS = [
  { key: "dice_skin" as const, label: "Skin de dés", options: DICE_SKINS },
  { key: "token_frame" as const, label: "Cadre de token", options: TOKEN_FRAMES },
  { key: "ui_theme" as const, label: "Thème d'interface", options: UI_THEMES },
  { key: "sfx_pack" as const, label: "Pack de bruitages", options: SFX_PACKS },
];

export interface Cosmetics {
  dice_skin: string;
  token_frame: string;
  ui_theme: string;
  sfx_pack: string;
}

export const DEFAULT_COSMETICS: Cosmetics = {
  dice_skin: "gold",
  token_frame: "classic",
  ui_theme: "aetheria",
  sfx_pack: "default",
};

export const COSMETICS_STORAGE_KEY = "aetheria.cosmetics";

export function readLocalCosmetics(): Cosmetics {
  try {
    const raw = localStorage.getItem(COSMETICS_STORAGE_KEY);
    if (!raw) return DEFAULT_COSMETICS;
    return { ...DEFAULT_COSMETICS, ...(JSON.parse(raw) as Partial<Cosmetics>) };
  } catch {
    return DEFAULT_COSMETICS;
  }
}

/** Applique les variables CSS des cosmétiques sur <html>. */
export function applyCosmetics(c: Cosmetics) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const group of COSMETIC_GROUPS) {
    const opt = group.options.find((o) => o.id === (c as unknown as Record<string, string>)[group.key]);
    if (!opt?.vars) continue;
    for (const [k, v] of Object.entries(opt.vars)) root.style.setProperty(k, v);
  }
  root.dataset.diceSkin = c.dice_skin;
  root.dataset.tokenFrame = c.token_frame;
  root.dataset.uiTheme = c.ui_theme;
  root.dataset.sfxPack = c.sfx_pack;
}

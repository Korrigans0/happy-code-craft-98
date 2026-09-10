// Glyphes V0.2 — Moteur de règles pur (aucune dépendance UI ni réseau).
// Les valeurs et règles sont centralisées ici : l'interface ne fait que lire.
//
// Modules :
//   dice            → caractéristique = taille de dé, aptitude = nombre de dés
//   difficulty      → types de difficulté (TD) et rangs
//   checks          → résolution des épreuves simples et complexes
//   character       → caractéristiques, sens, aptitudes, valeurs dérivées
//   equipment       → armes, armures, boucliers, esquive, objets de qualité
//   combat          → attaques, réactions, esquive, blessures
//   actions         → points d'action, déplacement, charge, désengagement
//   heroic-actions  → héroïsme et actions héroïques
//   confrontations  → enjeux, rounds, ordre de jeu, issues

export * from "./dice";
export * from "./difficulty";
export * from "./checks";
export * from "./character";
export * from "./equipment";
export * from "./combat";
export * from "./actions";
export * from "./heroic-actions";
export * from "./confrontations";

/** Identifiant du système dans le registre multi-systèmes. */
export const GLYPHES_SYSTEM_ID = "Glyphes";

export function isGlyphesSystem(system?: string | null): boolean {
  return (system ?? "").toLowerCase() === "glyphes";
}

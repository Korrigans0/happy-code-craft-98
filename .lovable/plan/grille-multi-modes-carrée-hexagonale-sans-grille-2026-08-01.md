# Grille multi-modes : carrée, hexagonale, sans grille

Objectif : permettre au MJ de choisir, scène par scène, entre grille carrée, grille hexagonale (pointy-top / flat-top) et mode libre, sans casser l'existant.

## Constat sur le code actuel

- Une seule constante `GRID_SIZE = 40` et `M_PER_SQUARE = 1.5` pilotent tout : snap (`snapValue`), placement des tokens, mesures, gabarits (cône/zone), rayons de lumière et de vision.
- La grille est dessinée **dans le calque `drawings`** (elle disparaît si ce calque est masqué, et elle partage la couche des dessins/gomme). C'est le bug à corriger : la grille doit avoir sa propre couche non éditable.
- Les scènes (`VTTScene`) stockent tokens, dessins, murs, carte — mais aucune configuration de grille.

## Architecture proposée

### 1. Un module unique de géométrie : `src/lib/vtt/grid.ts`

Toute la logique de coordonnées y est centralisée, aucune duplication dans les composants.

```text
GridConfig {
  type: "square" | "hex" | "none"
  orientation: "pointy" | "flat"   // hex seulement
  size: number                      // px (carré = côté, hex = rayon)
  scale: number                     // échelle libre 10–400 % déjà existante
  unitsPerCell: number              // 1.5 par défaut
  unitLabel: "m" | "ft"
  pixelsPerUnit: number             // mode libre uniquement
  showLines: boolean                // masquer les lignes sans désactiver le snap
  snapEnabled: boolean
}
```

API exposée (mêmes signatures pour les 3 modes, le composant appelant ignore le type) :

- `snapPoint(config, x, y)` → position accrochée (centre de case / centre d'hexagone / identité en mode libre)
- `cellCenter(config, x, y)` et `cellAt(config, x, y)`
- `distance(config, a, b)` → en unités de jeu : carré = règle actuelle, hex = conversion pixel → axial → **cubique** puis `(|dq|+|dr|+|ds|)/2`, libre = distance euclidienne / `pixelsPerUnit`
- `formatDistance(config, pixels)` → libellé (`« 7,5 m (5 cases) »`, `« 4 hex »`, `« 12,3 m »`)
- `radiusToPixels` / `pixelsToUnits` pour lumières, vision, auras et gabarits
- `iterateVisibleCells(config, viewport)` → générateur utilisé par le rendu (aucune allocation superflue)

Conversions hexagonales : formules standard axiales (Red Blob Games) avec arrondi cubique (`hexRound`), gérant les deux orientations via une matrice d'orientation unique — un seul chemin de code, pas de branche `if (pointy)` disséminée.

### 2. Couche de rendu dédiée : `GridLayer`

- Extraction du bloc de dessin actuel dans une fonction pure `drawGrid(ctx, config, viewport, colors)` gérant les 3 types (le mode `none` ne dessine rien).
- Ajout d'un calque `grid` dans `layers.ts`, **verrouillé** : non listé comme cible de dessin, ignoré par la gomme et le fog, non supprimable. Le rendu de la grille n'est plus conditionné par la visibilité du calque `drawings`.
- Ordre de rendu : carte → **grille** → décor/objets → jetons → effets → lumières → murs → brouillard → UI MJ.
- `showLines: false` masque uniquement le tracé, le snap reste actif.

### 3. Réglages de scène

- `VTTScene` reçoit `grid?: GridConfig` (absent = grille carrée par défaut → rétro-compatibilité totale des scènes existantes).
- Nouveau panneau « Grille » dans les paramètres de scène du `GMPanel` : type, orientation hex, taille/échelle, unité (m/ft), unités par case, pixels par unité (mode libre), affichage des lignes, snap.
- Sauvegarde via le flux `scenes` / `tabletop_state` déjà en place (aucune migration nécessaire, le JSONB `scenes` accueille le champ).

### 4. Migration entre modes

À chaque changement de type sur une scène : les tokens sont repositionnés via `snapPoint` du nouveau mode (carré/hex), ou conservés tels quels en passant en mode libre. Traitement en une passe sur le tableau de tokens, avec avertissement au MJ avant application.

### 5. Branchements existants à réviser

- `snapValue`, ajout/duplication/déplacement de tokens, déplacement clavier (flèches)
- Mesure du combat et de l'outil règle → `distance(config, …)`
- Gabarits `renderCone` / `renderZone` / cercle → rayons calculés en unités via le module, avec surlignage des hexagones couverts en mode hex
- Rayons de lumière, vision, auras → `radiusToPixels`

## Détails techniques

- Les hexagones sont dessinés par colonnes/rangées visibles seulement (culling identique à l'existant), tracé en un seul `Path2D` par niveau de trait pour éviter les surcoûts.
- Aucune dépendance ajoutée ; tout en TypeScript pur et testable (fonctions pures dans `grid.ts`).
- Les valeurs par défaut reproduisent exactement le comportement actuel (`square`, 40 px, 1,5 m/case), donc aucune campagne existante ne change de rendu.

## Étapes de livraison

1. `src/lib/vtt/grid.ts` + types `GridConfig` dans `vtt/types.ts`
2. Calque `grid` verrouillé + `drawGrid` (3 modes) et retrait de la dépendance au calque `drawings`
3. Panneau de réglages de grille par scène + persistance + migration des tokens
4. Bascule de tous les appels de snap / mesure / gabarits / lumières sur le module

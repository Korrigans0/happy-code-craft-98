# Lumières dynamiques

## Objectif

Ajouter un système de **sources de lumière** qui éclairent la carte autour d'un point (token ou point fixe), avec **occlusion par les murs dynamiques** (les murs `solid` bloquent la lumière, les `door` ouvertes la laissent passer, `window` la laisse passer).

## Comportement utilisateur

- Le MJ ajoute une lumière depuis la barre d'outils (nouvel outil "Lumière" 🔦) :
  - **Clic sur le canvas** → lumière fixe (torche posée au sol)
  - **Clic sur un token** → lumière attachée au token (suit ses déplacements)
- Chaque lumière a : couleur, rayon clair (m), rayon faible (m), intensité, animée oui/non.
- Presets rapides : Torche (4.5m/9m, orange), Lanterne (9m/18m, jaune), Bougie (1.5m/3m), Lumière du jour (30m, blanc), Vision nocturne (token-only, gris).
- Suppression : clic droit sur la lumière, ou panneau latéral "Lumières".

## Rendu

- Nouveau **layer "lighting"** composite, dessiné au-dessus du fog mais sous les pings.
- Pour chaque lumière :
  1. Calcul du polygone de visibilité (raycasting depuis la source vers chaque extrémité de mur ± epsilon)
  2. Dégradé radial (clair → faible → noir) clippé sur ce polygone
- Composition globale : assombrissement de la scène (toggle "Nuit" MJ) puis `lighter` pour additionner les lumières.
- Cache du polygone tant que ni la source ni les murs ne bougent.

## Persistance & sync

- Nouvelle colonne `lights jsonb` sur `tabletop_state` (default `'[]'`).
- Sauvegarde via le même `saveStateDebounced` que les murs/tokens.
- Realtime via le canal existant.

## Technique

```text
src/components/campaign/vtt/types.ts        + type LightSource, Tool "light"
src/hooks/useLights.ts                       (nouveau, calqué sur useWalls)
src/lib/visibility-polygon.ts                (raycasting murs → polygone)
src/components/campaign/CampaignTabletop.tsx + outil, rendu, panneau
supabase migration                            + colonne lights, grant
```

- Raycasting : pour chaque sommet de mur, lancer 3 rayons (angle, angle±0.0001) ; intersecter avec tous les segments murs ; trier par angle ; construire le polygone.
- Portes : si `door.isOpen === true` → segment ignoré. `window` → toujours ignoré pour la lumière.
- Perf : limite ~12 lumières actives, recalcul uniquement si la source ou un mur change (hash murs + position).

## Permissions

- Création / suppression / édition : **MJ uniquement**.
- Tous les membres voient le résultat ; les joueurs peuvent activer "vue joueur" (masque ce qui est hors lumière + hors fog révélé).

## Hors scope (pour plus tard)

- Ombres douces / pénombres animées avancées
- Vision spécifique par joueur (chaque token voit sa propre carte)
- Effets météo (pluie, brouillard volumétrique)

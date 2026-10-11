# Prototype « Tout pour vos aventures »

## Accès et comparaison

Ouvrir l’accueil avec `?experience=aventures#aventures-experimentales`. Les boutons « Version actuelle » et « Version immersive » permettent de comparer sans changer de route. Sans ce paramètre, la section originale reste affichée. Aucune publication automatique.

## Fichiers

- `src/components/FeaturesSection.tsx` : activation facultative et chargement différé ; présentation actuelle conservée.
- `src/components/experimental/adventure-destinations.ts` : textes et liens partagés entre les deux versions.
- `src/components/experimental/AdventureScene.tsx` : scène, artefacts, navigation et comparaison.
- `src/components/experimental/useAdventureScene.ts` : progression au défilement, sélection et préférence de mouvements réduits.
- `src/components/experimental/AdventureScene.css` : styles isolés, couleurs sémantiques locales, lévitation et adaptations mobile.
- `src/assets/experimental/` : six illustrations originales générées, dont cinq artefacts transparents.
- `AGENTS.md`, `roadmap.md` : isolation documentée et suivi ciblé.

## Technologies et limites

React, TypeScript, CSS avec perspective et transformations, requestAnimationFrame et composants Button existants. Aucune dépendance installée ; aucune scène WebGL ni modèle 3D. Le cristal, les brumes et les lumières de fond sont illustrés, pas des volumes calculés. Les artefacts flottent et réagissent à la souris ; le défilement change la destination et l’éclairage de sélection. Sur mobile, une destination est présentée à la fois, avec des commandes tactiles directes. Les appareils déclarant au plus 2 Go de mémoire et la préférence de mouvements réduits utilisent une scène fixe et les mêmes commandes, sans particules ni lévitation. Cette détection matérielle n’est pas disponible dans tous les navigateurs. Les performances sur téléphones physiques restent à mesurer.

## Vérifications

Playwright Chromium : images chargées, cinq liens inchangés, sélection des cinq destinations, comparaison dans les deux sens, navigation effective vers le Codex, absence de débordement horizontal à 360 × 630, scène ordinateur à 1280 × 1800, mode de mouvements réduits et accueil original sans paramètre. Aucune erreur JavaScript observée. Compilation automatique : build OK. Aucun contrôle TypeScript autonome lancé. Captures finales inspectées ; petite amélioration supplémentaire des espacements mobiles appliquée ensuite.

Authentification, données, abonnements, permissions et routes existantes non modifiés. Pas de test de paiements ou multijoueur : hors périmètre de ce prototype visuel.
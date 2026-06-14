## Objectif

Refonte profonde du tabletop et ajout d'un vrai système de stockage MJ avec quotas par abonnement, sans casser les fonctionnalités existantes (murs, lumières, portes, brouillard, scènes, synchro).

Vu la taille, je propose de livrer en **4 phases** validées séparément. Chaque phase est utilisable en l'état.

---

## Phase 1 — Stockage MJ & Bibliothèque média

**Backend (migration)**
- Nouveau bucket Storage `gm-media` (privé, RLS).
- Table `media_assets` :
  - `owner_id`, `campaign_id` (nullable), `name`, `file_type` (`map|token|portrait|npc|creature|object|decor|document`), `storage_path`, `thumbnail_path`, `mime`, `size_bytes`, `width`, `height`, `checksum` (sha256, anti-doublon), `created_at`, `updated_at`.
  - RLS : owner full, membres de campagne en lecture si `campaign_id` correspond.
- Table `subscription_tiers` (lecture seule) + colonne `tier` sur `profiles` (`free|gm_premium|premium_plus`).
- Vue / RPC `get_storage_usage(user_id)` qui retourne `used_bytes`, `quota_bytes`, `file_count`.
- Quotas par défaut :
  - Free : 200 Mo, max 50 fichiers, compression forcée
  - GM Premium : 5 Go
  - Premium+ : 25 Go

**Frontend**
- Page `/library` → ajouter un onglet **Médias** (à côté des onglets Monstres/Sorts/Objets existants).
- Composant `MediaLibrary` : grille, filtres par type, recherche, rename, delete, barre de quota.
- Composant `MediaPickerDialog` réutilisable (carte, token, portrait).
- Hook `useMediaUpload` :
  - vérifie le quota avant upload (toast clair + CTA upgrade si dépassé)
  - compresse côté client (canvas → WebP, max 4096 px côté long pour cartes, 512 px pour tokens)
  - génère une miniature 256 px
  - calcule un sha256 → si déjà présent chez ce MJ, réutilise l'asset existant
  - upload original optimisé + thumb dans Storage
  - insert dans `media_assets`

**Intégrations existantes**
- VTT : bouton "Importer carte" et "Importer token" passent par `MediaPickerDialog` au lieu d'une URL brute. URL externe reste possible en mode avancé.
- Avatars personnages : option "Choisir depuis ma bibliothèque".

---

## Phase 2 — Refonte des calques

**Données**
- Étendre `tabletop_state` avec un champ `layers` (jsonb) listant les 9 calques fixes :
  ```
  background, decor, objects, tokens, effects, lights, walls, fog, gm_ui
  ```
  Chacun : `{ visible, locked, pjVisible, opacity, order }`.
- Chaque token / drawing / objet porte un champ `layer` (déjà partiellement présent dans `TokenItem.layer`).
- Migration de données : les objets sans `layer` sont assignés en fonction de leur type (token → `tokens`, drawing → `objects`, etc.).

**Frontend VTT**
- Nouveau composant `LayersPanel` (côté MJ uniquement) :
  - liste des 9 calques avec icônes
  - toggle visible / verrouillé / visible PJ
  - slider opacité
  - clic = calque actif (les nouveaux objets se créent dedans)
  - "isoler" (montre uniquement ce calque)
- Le rendu canvas itère désormais sur les calques dans l'ordre.
- Côté PJ : on filtre les calques où `pjVisible=false` ou `gm_ui`.
- Clic / drag impossible sur un calque locked.

---

## Phase 3 — Objets de table & édition pro

**Données**
- Nouvelle table `tabletop_objects` (ou stockée dans `tabletop_state.objects` jsonb selon perf) :
  - `id, scene_id, layer, name, image_asset_id, x, y, width, height, rotation, locked, gm_only, description, type` (`decor|chest|trap|secret_door|marker|interactive|note`).

**Frontend**
- Nouvel outil VTT "Objet" → ouvre `MediaPickerDialog` puis pose l'objet.
- Sélection multiple (shift+clic, lasso).
- Copier (Ctrl+C) / Coller (Ctrl+V) / Supprimer groupé.
- Snap-to-grid togglable.
- Poignées : redimensionner + rotation.
- Boutons "avant/arrière" dans le menu contextuel.
- Groupement (clé `groupId` partagée).
- Panneau "Propriétés" pour l'objet sélectionné (nom, calque, verrou, visibilité PJ, description).

---

## Phase 4 — Performance & polish

- Lazy-load des images via `loading="lazy"` + IntersectionObserver pour les médias hors écran du canvas.
- Cache des miniatures (URL signée 1h).
- Throttle de la synchro tabletop (debounce 200 ms sur les modifs continues : drag, resize).
- Rendu : ne redessiner que les calques marqués dirty.
- Mobile : `LayersPanel` masqué pour PJ, barre d'outils MJ repliable.

---

## Détails techniques

- Compression : `canvas.toBlob('image/webp', 0.85)` avec fallback PNG si pas de support (rare).
- Anti-doublon : sha256 du blob compressé (pas de l'original) → champ `checksum` unique par `(owner_id, checksum)`.
- Quota : vérifié côté DB via trigger `BEFORE INSERT` sur `media_assets` qui lit `profiles.tier` et la somme `size_bytes` → exception si dépassement, traduite en toast côté client.
- RLS storage : policy par préfixe `{owner_id}/...`.
- Aucune suppression des champs / tables existants. `TokenItem.imageUrl` reste compatible (peut référencer l'URL signée d'un media_asset ou une URL externe).

---

## Ordre de livraison proposé

1. **Phase 1** (stockage + bibliothèque + quotas)
2. **Phase 2** (calques)
3. **Phase 3** (objets de table & édition)
4. **Phase 4** (perf & mobile)

Confirme l'ordre (ou dis si tu veux regrouper) et je démarre Phase 1.

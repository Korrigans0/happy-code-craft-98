# Aetheria TaleSpire — Phase 1 (audit) et Phase 2 (architecture)

## 1. Audit — ce qui existe déjà

**La fiche Glyphes est réutilisable telle quelle.**
- `GlyphesPdfSheet.tsx` (802 lignes) : la vraie fiche (PDF interactif, tous les champs, portrait, export). Elle reçoit un personnage et renvoie les changements via `onSave(patch)` : elle ne parle pas elle-même à la base. Il suffit de lui brancher une autre sauvegarde.
- `SheetRouter.tsx` choisit la fiche selon le système : même aiguillage réutilisable pour Aetheria/D&D plus tard.
- Règles et calculs dans `lib/game-systems/glyphes/` (≈3 000 lignes, testées) : `character.ts` (sens, dés, aptitudes), `heroic-actions.ts`, `checks.ts`, `dice.ts`, `sheetSync.ts` (cases Blessures/Héroïsme), `syncState.ts` (révisions et compare-and-set), `portrait.ts`.
- Sauvegarde actuelle : `lib/api.ts` (mise à jour directe de la fiche) + `useGlyphesSheetSync.ts` (compteurs liés aux jetons).
- API v0.2.0 : `list/get/create/update_character` avec `expected_version` et `updated_since`.

**Dépendances lourdes de la fiche** : pdf.js + pdf-lib + le PDF de fiche + composants d'interface du site. Elles fonctionnent dans un navigateur Chromium, donc dans un Symbiote.

**Limites d'un Symbiote TaleSpire (à confirmer par un essai réel)**
- C'est une page web (HTML/JS) dans un panneau de TaleSpire : le panneau est déplaçable/redimensionnable par TaleSpire lui-même ; les « plusieurs fiches » se feront en onglets à l'intérieur.
- Une redirection OAuth classique dans ce navigateur intégré est fragile → le **code de liaison** sera la méthode principale ; OAuth via ouverture du navigateur système en second.
- Stockage local propre au Symbiote (pas les cookies du site).

**Manques côté serveur (évolutions nécessaires)**
1. **MJ qui modifie la fiche d'un joueur** : aujourd'hui interdit par la base (seul le propriétaire écrit). Il faut une règle serveur ciblée : le MJ d'une campagne peut modifier la fiche liée à un membre de *sa* campagne. Touche aussi le site (comportement nouveau) → à valider.
2. **Code de liaison** : nouvelle table de codes courts (usage unique, 10 min, hashés) + fonction serveur qui l'échange contre une session propre au Symbiote, révocable depuis le site.
3. Lecture des fiches de campagne pour le MJ : déjà possible.

## 2. Architecture retenue

Le Symbiote est construit **dans ce même projet** comme une seconde page autonome, qui importe directement la vraie fiche et les règles : zéro duplication, toute correction de la fiche profite aux deux.

```text
talespire/                      (paquet Symbiote : manifest.json + build)
src/talespire/
  main.tsx                      point d'entrée du Symbiote
  core/                         Aetheria Core : client API MCP, stockage, événements
  auth/                         code de liaison + OAuth (jamais de clé secrète)
  characters/                   Character Manager : liste, onglets, cache
  sync/                         file d'attente hors ligne, expected_version, conflits, interrogation
  permissions/                  droits renvoyés par le serveur (can_edit, rôle MJ)
  systems/
    registry.ts                 aiguillage par système
    glyphes/GlyphesAdapter.tsx  monte GlyphesPdfSheet, onSave → file de synchro
    aetheria/ dnd/              emplacements futurs
  ui/                           panneau, onglets, thème Aetheria
```

Réutilisés sans modification : `GlyphesPdfSheet`, `lib/game-systems/glyphes/*`, `lib/systems`, thème et polices du site.

Côté serveur : outils MCP existants + `exchange_link_code` + règle MJ (point 1).

## 3. Ordre de développement après validation
1. Squelette + panneau + onglets (testé dans l'aperçu navigateur).
2. Code de liaison (page « Lier TaleSpire » dans le profil) puis OAuth.
3. Liste des personnages + fiche Glyphes en lecture.
4. Écriture et synchro (file hors ligne, conflits).
5. Droits MJ, tests compte joueur + compte MJ.
6. Paquet Symbiote ; l'essai dans TaleSpire même devra être fait par toi (je n'ai pas TaleSpire).

## Décisions à valider
- Accorder au MJ l'écriture sur les fiches de ses joueurs (aussi sur le site).
- Code de liaison comme méthode principale.

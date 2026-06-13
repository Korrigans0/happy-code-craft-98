## Objectif

Ouvrir Aetheria VTT au **multi-système** : conserver Aetheria/WA comme système principal, et ajouter D&D 5e, Pathfinder 2e, L'Appel de Cthulhu (et architecture extensible). Le système est choisi **par campagne** et **par personnage**, et l'UI (fiche, jets, combat, compendium) s'adapte automatiquement.

> ⚠️ Note : cela contredit la règle mémoire actuelle « Exclusively Aetheria & WA ». Je mettrai à jour `mem://index.md` après validation.

## Périmètre

### Systèmes livrés en v1
1. **Aetheria** (existant — système phare, par défaut)
2. **Worlds Awakening** (existant — partenaire)
3. **D&D 5e** (nouveau)
4. **Pathfinder 2e** (nouveau)
5. **L'Appel de Cthulhu 7e** (nouveau)
6. **Personnalisé / Homebrew** (stats & règles libres définies par le MJ)

### Ce qui change selon le système
- Caractéristiques (FOR/DEX/CON… vs STR/DEX/CON… vs FOR/CON/TAI/DEX/APP/INT/POU/ÉDU)
- Mode de stats : **modificateur** (Aetheria/WA) vs **score** (5e/PF2) vs **pourcentage** (CoC)
- Race/Classe/Sous-classe (libellés et listes)
- PV, CA/Défense, Initiative, jets de sauvegarde
- Monnaie (NX, PO, $/£)
- Dés de jet par défaut (d20+mod, 2d10, d100…)
- Compendium filtré par système

### Ce qui ne change pas
- Tabletop / tokens / brouillard / dessins / chat / dés 3D
- Auth, campagnes, RLS, permissions
- Identité visuelle dark fantasy

## Architecture technique

### 1. Registre de systèmes (`src/lib/systems/`)
```text
src/lib/systems/
├── index.ts              # registre + getSystem(id)
├── types.ts              # SystemDefinition, StatDef, RollMode…
├── aetheria.ts           # (ré-export aetheria-data)
├── worlds-awakening.ts   # (constantes WA existantes)
├── dnd5e.ts              # nouveau
├── pathfinder2e.ts       # nouveau
├── cthulhu7e.ts          # nouveau
└── custom.ts             # mode homebrew
```

Chaque `SystemDefinition` expose :
- `id`, `label`, `icon`, `description`
- `stats: StatDef[]` (clé, label, mode: "modifier" | "score" | "percentage", default, min/max)
- `races[]`, `classes[]`, `subclassesByClass{}`
- `currency`, `speedUnit`, `hitPointsFormula`
- `defenseStats[]` (ex: AC, Def PHY/MAG, Esquive)
- `defaultRoll(stat)` (formule de jet)
- `hasSpellcasting`, `hasTenues`, `hasSanity`
- `rendererHints` (quelles sections afficher dans la fiche)

### 2. Base de données
- `campaigns.game_system` (text) — déjà présent, juste élargir les valeurs autorisées (pas d'enum stricte côté DB).
- `characters.system` (text, défaut `"Aetheria"`) — **nouveau champ**, migration nécessaire.
- `characters.system_data` (jsonb, défaut `'{}'`) — **nouveau** : stocke les champs propres au système (sanity, prof bonus 5e, etc.) sans casser le schéma actuel.

Migration :
```sql
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS system text NOT NULL DEFAULT 'Aetheria',
  ADD COLUMN IF NOT EXISTS system_data jsonb NOT NULL DEFAULT '{}'::jsonb;
```

### 3. Fiche de personnage adaptative
- `CharacterSheet` devient un **routeur** : selon `character.system`, rend `<AetheriaSheet>`, `<Dnd5eSheet>`, `<Pf2eSheet>`, `<CthulhuSheet>` ou `<CustomSheet>`.
- Sections communes extraites (`SheetHeader`, `SheetNotes`, `SheetInventory`) — réutilisées par tous.
- Stats rendues via composant générique piloté par `StatDef`.

### 4. Création de personnage
- `CharacterForm` : étape 0 = **choix du système** (présélectionné depuis la campagne si fourni en query param).
- Les étapes suivantes (race/classe/stats) lisent `getSystem(systemId)` pour leurs listes.

### 5. Sélection du système au niveau campagne
- `Campaigns.tsx` : le champ `Système de jeu` propose les 6 options (sélecteur avec icônes).
- Quand un joueur rejoint et crée un PJ pour cette campagne, le système est pré-rempli.

### 6. Jets de dés
- `rollStat(character, statKey)` lit le `SystemDefinition.defaultRoll`.
- Aetheria/WA → `1d20 + mod`
- 5e → `1d20 + floor((score-10)/2) + prof?`
- PF2 → `1d20 + mod + prof`
- CoC → `1d100` vs valeur (% sous le score)

### 7. Combat tracker
- Initiative formule depuis le système (`initiativeFormula`).
- Colonnes HP/AC/Def adaptées au système actif de la campagne.

### 8. Compendium
- Filtre `system` ajouté. Le contenu Aetheria/WA existant reste taggé `Aetheria`/`Worlds Awakening`. Les SRD 5e/PF2 ne sont **pas** importés en v1 (licences) — les MJ ajoutent leur propre contenu via le GM custom content.

## UI

- Badge système (chip doré) visible sur :
  - Cartes de campagne
  - Cartes de personnage
  - En-tête de fiche
  - En-tête CampaignPlay
- Page d'accueil : mention « Multi-système : Aetheria, D&D 5e, Pathfinder, Cthulhu… » dans le Hero.
- Sélecteur système avec aperçu (icône + 1 phrase descriptive) dans création campagne / personnage.

## Plan d'exécution (commits logiques)

1. **Migration DB** : `characters.system` + `characters.system_data`.
2. **Registre systèmes** : créer `src/lib/systems/*` avec les 6 définitions. Refactor `game-systems.ts` pour ré-exporter le registre (compat ascendante).
3. **Fiche adaptative** : router + sheets 5e / PF2 / CoC / Custom (versions essentielles : stats, PV, défense, compétences, inventaire texte, notes). Aetheria/WA inchangés.
4. **Formulaire création** : étape choix du système + listes dynamiques.
5. **Sélecteur campagne** : élargir options + propager système au PJ créé pour la campagne.
6. **Jets & combat** : brancher `defaultRoll` et `initiativeFormula`.
7. **UI badges & Hero** : afficher le système partout + mention sur la home.
8. **Mémoire** : mettre à jour `mem://index.md` (lever la contrainte « Aetheria/WA exclusivement ») et ajouter `mem://technical/architecture/multi-system-registry`.

## Hors périmètre v1

- Import SRD officiel (5e/PF2) — questions de licence.
- Conversion automatique d'un PJ d'un système à un autre.
- Sheets ultra-détaillées avec automatisation complète des sorts/feats 5e/PF2 (v1 = champs structurés + texte libre).
- Système custom : éditeur visuel des stats (v1 = JSON simple côté MJ).

Confirme et je commence par la migration DB + le registre, puis je livre les sheets par paliers.
# Refonte multi-systèmes — Fiches, Campagnes & Codex

## 🔴 TÂCHE PRIORITAIRE — Refonte barre d'outils VTT

Problèmes identifiés :
- **Doublons murs / portes** : `wall`, `wallDoor`, `wallDelete` dans la barre principale **+** sélecteur de type (solid / door / window / terrain) dans `WallsToolbar`. Les deux concepts se chevauchent.
- **Fenêtre inaccessible** : type `window` existe dans `WallsToolbar` mais n'est jamais activable directement depuis la barre principale → le MJ ne peut pas en placer simplement.
- **Terrain** : même problème, type orphelin.

Refonte à prévoir :
1. Une **seule** entrée "Murs dynamiques" dans la barre principale (popover) avec **4 boutons types** : Mur solide / Porte / Fenêtre / Terrain — chacun sélectionne directement le bon outil + bon type.
2. Bouton "Effacer mur" séparé, ou clic droit sur mur uniquement.
3. Supprimer le sélecteur de type dupliqué dans `WallsToolbar` (ne garder que undo/redo, fluidité, contrôles portes globaux, compteur).
4. Même logique à appliquer à **Lumières** (vérifier doublons).
5. Raccourcis clavier : `W` mur, `D` porte, `F` fenêtre, `T` terrain.

Fichiers : `CampaignTabletop.tsx` (tools array ~L2740), `WallsToolbar.tsx`.

---

Objectif : transformer Aetheria VTT en plateforme type Foundry/Roll20 où chaque système (Aetheria, D&D 5e, Pathfinder 2e, Worlds Awakening, Homebrew) possède sa **propre fiche, ses propres règles et son propre codex**, tout en partageant le tabletop.

Vu l'ampleur (architecture + 5 fiches + codex cloisonné + restrictions), je propose une **livraison en 4 phases**. Vous validez/ajustez avant que je code.

---

## Phase 1 — Architecture modulaire (fondations)

Étendre `src/lib/systems/` pour qu'un système expose **tout** : stats, compétences, ressources, calculs, capacités UI.

```text
src/lib/systems/
├── types.ts              # SystemDefinition étendu
├── index.ts              # registre + getSystem()
├── aetheria/
│   ├── definition.ts     # SystemDefinition
│   ├── calculations.ts   # HP, def PHY/MAG, mod, etc.
│   ├── skills.ts
│   └── data.ts           # races, classes, tenues
├── dnd5e/
│   ├── definition.ts     # 6 stats score-based, prof bonus
│   ├── calculations.ts   # mod = (score-10)/2, prof, CA, DC sorts
│   ├── skills.ts         # 18 skills SRD
│   └── data.ts           # classes, races, backgrounds SRD
├── pathfinder2e/
│   ├── definition.ts     # 4 prof tiers, ability boosts
│   ├── calculations.ts   # mod + prof + level
│   └── ...
├── worlds-awakening/     # déjà partiellement présent
├── cthulhu7e/            # gardé (déjà présent)
└── homebrew/
    ├── definition.ts     # squelette générique
    └── schema.ts         # champs custom JSON
```

Nouveaux champs `SystemDefinition` :
- `skills: SkillDef[]` (avec stat liée)
- `resources: ResourceDef[]` (HP, Mana, PE, Sanity, etc.)
- `calculations: { hp, defenses, attackBonus, saveDC, initiative }` — fonctions pures
- `inventorySchema`, `spellSchema`, `featureSchema`
- `sheetComponent: string` (clé pour résoudre la fiche React)

## Phase 2 — Fiches dédiées par système

Composant routeur `CharacterSheet` qui résout vers :
- `AetheriaSheet` (existant, à brancher sur `definition`)
- `Dnd5eSheet` (nouveau) : 6 caracs score-based, jets de sauvegarde, 18 compétences, CA, slots de sorts par niveau, inventaire, traits/idéaux/liens/défauts
- `Pathfinder2eSheet` (nouveau) : ability boosts, proficiency tiers (U/T/E/M/L), AC, saves, skills, feats
- `WorldsAwakeningSheet` (existant Aetheria-like, à isoler)
- `HomebrewSheet` (nouveau) : éditeur de champs (groupes de stats/ressources/compétences personnalisés stockés en `system_data` jsonb)

Sections partagées : `<SheetHeader>`, `<SheetNotes>`, `<SheetInventory>`, `<SheetAvatar>`.

Toutes les fiches :
- autosave debounce 800 ms sur `characters` + `system_data`
- responsive (tabs sur mobile, colonnes sur desktop)
- synchronisation token ↔ fiche (HP/conditions déjà branchés)

## Phase 3 — Restrictions de campagne

Migration `campaigns` :
- `system` text NOT NULL (déjà partiel) — devient source de vérité
- `allow_homebrew_characters` boolean default false

Règle d'invitation/jointure (front + RLS) :
- Un PJ ne peut associer à une campagne qu'un personnage dont `character.system === campaign.system`
- **Exception** : `character.system === 'Homebrew'` autorisé si `campaign.allow_homebrew_characters = true`
- Sinon : toast d'erreur clair + filtre dans la liste de sélection

UI `Campaigns.tsx` :
- Sélecteur 5 systèmes lors de la création
- Toggle "Autoriser les personnages Homebrew" (paramètres campagne)
- Badge système sur chaque CampaignCard

## Phase 4 — Codex cloisonné par système

Migration : ajouter `system` text à `monsters`, `spells`, `magic_items` (+ `aetheria_creatures`/`wa_creatures` déjà tagués implicitement).

Nouveau modèle :
- Chaque entrée Codex a un `system` (ou "Homebrew")
- Champ `scope` : `official` | `custom_campaign` | `custom_personal`
- `owner_user_id`, `campaign_id` (nullable) pour le contenu MJ

Page `Compendium.tsx` :
- Onglet par système (Aetheria / D&D 5e / Pathfinder / WA / Homebrew / Personnalisé)
- En contexte campagne : auto-filtré sur `campaign.system` + Homebrew du MJ
- Recherche & sélecteurs (tabletop "Ajouter créature") ne montrent QUE le système courant + customs MJ

Création MJ (créatures, PNJ, objets, sorts, classes, races) :
- Bouton "Créer" partout dans le Codex
- Choix de portée : **Cette campagne** / **Toutes mes campagnes** / **Codex Homebrew personnel**
- RLS : MJ voit les siens + officiels du système courant

Intégration tabletop : `TokenAddDialog` filtre les créatures par `campaign.system` ∪ customs MJ.

---

## Détails techniques

- **Stockage spécifique** : champs hors schéma commun stockés dans `characters.system_data` (jsonb). Les colonnes existantes restent compatibles Aetheria/WA.
- **Calculs** : fonctions pures par système, jamais d'`if (system === 'dnd5e')` dans les composants.
- **Migration douce** : personnages existants → `system = 'Aetheria'` (déjà fait), aucune perte.
- **Homebrew** : 100% configurable, sert de template pour systèmes communautaires futurs.
- **RLS** : policies sur monsters/spells/magic_items étendues avec `scope` + `owner_user_id`.

---

## Questions avant de coder

1. **Périmètre Phase 2** : je livre les **5 fiches en une fois** (gros) ou je commence par **D&D 5e + Homebrew** (les plus demandés) et j'enchaîne Pathfinder ensuite ?
2. **Contenu officiel SRD** (sorts/monstres D&D 5e, Pathfinder) : j'importe un seed SRD libre de droits dès maintenant, ou je laisse le codex vide par défaut et le MJ remplit via Homebrew/import ?
3. **Personnages existants en campagne** : si une campagne est marquée D&D 5e et contient des PJ Aetheria, je les **migre en Homebrew** automatiquement, je les **bloque** (le MJ doit régler), ou je **grandfather** (tolérés mais marqués "système incompatible") ?
4. **Ordre de livraison** : OK pour Phase 1 → 2 → 3 → 4 (architecture d'abord, restrictions en dernier) ou vous voulez les restrictions de campagne (Phase 3) avant les nouvelles fiches ?

Répondez à ces 4 points et j'attaque la Phase 1 dans la foulée.

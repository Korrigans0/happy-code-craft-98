# Refonte multi-systèmes — État au tour courant

## ✅ Réponses Phase 2 enregistrées
1. Ordre : commencé par **D&D 5e**, on enchaîne le reste (PF2e, CoC, Homebrew, Aetheria/WA).
2. **SRD libre de droits importé** par défaut.
3. PJ incompatible → **bloqué**, le MJ doit régler la situation.
4. **Ordre de livraison** confirmé : Phase 1 → 2 → 3 → 4.

---

## ✅ État réel des phases

### Phase 1 — Architecture modulaire ✅
- `src/lib/systems/` : `aetheria`, `dnd5e`, `pathfinder2e`, `cthulhu7e`, `worlds-awakening`, `custom` + `types.ts` + `index.ts`.
- `getSystem()` + `sheetComponent` clé pour le routeur.

### Phase 2 — Fiches dédiées ✅
- `SheetRouter` → `AetheriaCharacterSheet`, `Dnd5eSheet`, `Pathfinder2eSheet`, `Cthulhu7eSheet`, `HomebrewSheet`, `GenericSystemSheet`.
- Autosave 800 ms, sync token ↔ fiche.

### Phase 3 — Restrictions de campagne ✅
- `system` + `allow_homebrew_characters` sur `campaigns`.
- `canUseCharacterInCampaign` + `filterCompatibleCharacters` utilisés dans `CampaignMembers` (jointure et liste de sélection).
- Sélecteur 5 systèmes + badge sur `CampaignCard`.

### Phase 4 — Codex cloisonné ✅
- Colonnes `system` / `scope` / `campaign_id` / `is_public` sur `monsters`, `spells`, `magic_items`.
- Indexes `idx_*_system`, `idx_*_scope`, `idx_*_public`.
- RLS : `official` lisible par tous, `custom_personal` par owner, `custom_campaign` par membres.
- `CreateMonsterDialog` / `CreateSpellDialog` / `CreateItemDialog` avec `scope` (par défaut `custom_personal`).
- Filtrage Codex / GMPanel / TokenAddDialog par `campaign.system` ∪ Homebrew si autorisé.

### ✅ Seed SRD officiel chargé
- D&D 5e : **115 monstres, 209 sorts, 194 objets**.
- Pathfinder 2e : 20 monstres, 15 sorts, 15 objets.
- Call of Cthulhu : 15 monstres, 12 sorts, 15 objets.

---

## ⏭️ Chantiers restants (à valider)

A. **Mobile bestiaire Aetheria** : drag long-press tactile sur token, boutons « Ajouter » toujours visibles sur écran <640 px.
B. **Étoffer SRD PF2e + CoC** : passer chacun à ~50 entrées par catégorie (PF2e est sous-représenté).
C. **UI scope MJ avancé** : ajouter un sélecteur visible « Cette campagne / Toutes mes campagnes / Personnel » dans les 3 dialogs de création (actuellement bloqué sur `custom_personal`).
D. **Page Bibliothèque MJ** : vue dédiée pour gérer/éditer/supprimer le contenu créé par le MJ avec filtres scope.
E. **Migration de masse** : outil MJ pour réassigner d'anciens monstres custom au bon `system`.

Dis-moi par lequel commencer (A à E) ou si tu veux que je file directement sur A + C qui sont les plus visibles côté UX.

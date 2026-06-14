# Refonte multi-systèmes — État au tour courant

## ✅ Phases livrées

### Phase 1 — Architecture modulaire
`src/lib/systems/` (Aetheria, WA, D&D 5e, PF2e, Cthulhu 7e, Personnalisé) + `getSystem()` + `sheetComponent`.

### Phase 2 — Fiches dédiées
`SheetRouter` → Aetheria / Dnd5e / PF2e / Cthulhu7e / Homebrew / Generic. Autosave 800 ms.

### Phase 3 — Restrictions de campagne
`system` + `allow_homebrew_characters` sur `campaigns`, `canUseCharacterInCampaign`, filtrage PJ.

### Phase 4 — Codex cloisonné
`system` / `scope` / `campaign_id` / `is_public` + RLS sur monsters/spells/magic_items.

### A — Mobile bestiaire ✅
Boutons "Ajouter" toujours visibles <640 px (32×32 px) sur les 4 sections du GMPanel.

### C — Scope explicite à la création ✅
`Select` "Personnel / Communauté" dans CreateMonster/Spell/ItemDialog (remplace l'ancien Switch).

### D — Bibliothèque MJ ✅
Page `/library` dédiée :
- Onglets Créatures / Sorts / Objets, filtres système + visibilité + recherche.
- Badges scope (Personnel / Communauté / Campagne / Officiel) + badge système.
- Suppression avec confirmation.
- Lien ajouté dans le `Header`.

### B — SRD étoffé ✅
- Pathfinder 2e : 55 monstres, 53 sorts, 50 objets.
- Call of Cthulhu : 50 monstres, 50 sorts, 51 objets.
- D&D 5e : 115 / 209 / 194 (déjà solide).

### E — Migration de masse ✅
Sélection multiple + sélecteur "Réassigner à…" sur chaque onglet de la Bibliothèque MJ : applique en masse un nouveau `system` aux entrées choisies (via `updateMonster/Spell/Item`).

---

## Idées d'itérations futures

- Édition complète depuis la Bibliothèque (réutiliser les dialogs en mode "edit").
- Export / import JSON pour partager des packs Homebrew.
- Stats publiques par système (top créateurs communauté).
- Génération IA d'un monstre à partir d'un prompt (déjà câblable via Lovable AI Gateway).

## Objectif
Deux améliorations majeures du tabletop :
1. Intégration tokens ↔ initiative
2. Modificateur manuel dans tous les lanceurs de dés

---

## 1. Tokens → Initiative

### Fichiers touchés
- `artifacts/questmaster/src/components/campaign/CampaignCombat.tsx`
- `artifacts/questmaster/src/components/campaign/vtt/TurnOrderBar.tsx` (lecture seule, déjà OK)
- `artifacts/questmaster/src/components/campaign/CampaignTabletop.tsx` (exposer la sélection courante via prop ou contexte léger)
- `artifacts/questmaster/src/pages/CampaignPlay.tsx` (passer tokens + selection à CampaignCombat)

### Logique
- `CampaignPlay` détient déjà l'état partagé du tabletop (`tabletopState`). On lit `tokens` et on remonte `selectedTokenId` depuis `CampaignTabletop` via callback `onSelectionChange`.
- Nouveau prop `CampaignCombat`: `tokens: TokenItem[]`, `selectedTokenId: string | null`.
- Trois boutons MJ dans le bouton "Ajouter" et dans la barre d'action combat :
  - **Ajouter la sélection** → crée 1 participant depuis le token sélectionné
  - **Ajouter tous les tokens** → boucle sur tous les tokens visibles non-déjà-présents
  - **Lancer les initiatives auto** → bouton existant `autoRollInitiative` renommé/clarifié + applique aussi à participants liés à fiches futures (laisse hook pour `character_id`)
- Mapping token → participant :
  - `name` ← `token.name || token.label`
  - `current_hp/max_hp` ← `token.hp ?? 10`, `token.maxHp ?? 10`
  - `armor_class` ← `token.ac ?? 10`
  - `is_player` ← `token.creatureType === "character"`
  - `notes` (JSON) ← `{ token_id, image_url, color }` pour resync nom/image
- Anti-doublon : on stocke `token_id` dans `notes` (JSON string) → vérification avant insert.
- Sync nom : un `useEffect` dans `CampaignCombat` détecte les renames côté tokens et patch le participant correspondant (debounce 500 ms).
- Suppression d'un token sur le plateau : le participant reste, mais on retire le lien (l'initiative ne casse pas).
- Temps réel : déjà assuré via `refetchInterval: 3000` + invalidations React Query.

### TurnOrderBar
- Le composant existant lit `participants` déjà. Pour afficher l'avatar du token, on étend `Participant` avec un champ optionnel `image_url` extrait du `notes` JSON côté CampaignCombat avant passage au bar.

---

## 2. Modificateur manuel dans les lanceurs de dés

### Fichiers touchés
- `artifacts/questmaster/src/components/campaign/CampaignCombat.tsx` (lanceur intégré ligne ~174)
- `artifacts/questmaster/src/pages/DiceRoller.tsx`
- `artifacts/questmaster/src/components/campaign/DiceRoller3D.tsx` (si présent)
- Nouveau composant partagé : `artifacts/questmaster/src/components/campaign/vtt/DiceModifierInput.tsx`

### Composant `DiceModifierInput`
- Input `type="text"` filtré regex `^-?\d*$` (max ±999)
- Boutons rapides `+1 +2 +5 -1 -2 -5` et `Reset`
- Affichage live : `{count}d{sides} {±mod}` + résultat preview optionnel
- Émet `onChange(mod: number)` à chaque keystroke validé
- Tailwind sémantique, hauteur compacte (h-9), responsive

### Intégration
- Remplacer les blocs +/- existants par `<DiceModifierInput value={mod} onChange={setMod} />`
- Le lancer `rollDice(sides, count, mod)` reçoit ce modificateur unique
- Formule affichée dans le toast : `${count}d${sides}${mod >= 0 ? '+' : ''}${mod} = total`
- Compatible d4/d6/d8/d10/d12/d20 et lancers multiples (champ `count` reste)

---

## Détails techniques
- Pas de migration DB nécessaire (on stocke le lien token via le champ `notes` JSON déjà présent sur `combat_participants`).
- Pas de nouvelles deps. Tout en HSL semantic tokens.
- Realtime : on s'appuie sur le polling existant pour rester simple, pas d'ajout de canal Supabase.
- Validation zod inutile ici (input numérique simple), regex suffit côté UI.

---

## Ordre d'exécution
1. Créer `DiceModifierInput.tsx`
2. Modifier `CampaignCombat.tsx` (dice + token integration + sync hook)
3. Modifier `CampaignTabletop.tsx` pour exposer `selectedTokenId` via prop callback
4. Modifier `CampaignPlay.tsx` pour relier tokens + selection
5. Mettre à jour `DiceRoller.tsx` (page dédiée)
6. Vérifier build
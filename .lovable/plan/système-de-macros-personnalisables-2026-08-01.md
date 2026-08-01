# Système de macros personnalisables

Barre de macros pour MJ et joueurs : jets de dés automatisés, variables de fiche résolues à l'exécution, catégories, partage de table et macros par défaut selon le système.

## 1. Variables de fiche disponibles

Résolution dynamique à chaque exécution depuis la fiche liée (`characters.system_data` + colonnes de base). Syntaxe `{VAR}`.

### Communes à tous les systèmes
`{NIV}` niveau, `{PV}` / `{PVMAX}`, `{NOM}`, `{CA}` défense principale, `{INIT}` initiative, `{VIT}` vitesse.

### Aetheria / Worlds Awakening (modificateurs directs)
`{FOR}` `{DEX}` `{CON}` `{INT}` `{SAG}` `{CHA}` — plus `{DEFPHY}`, `{DEFMAG}`, `{PE}` / `{PEMAX}`, `{ATQ}` (bonus d'attaque calculé), `{DDSORT}`.

### Glyphes — Nouvel Empire (mode score, pools de dés)
`{PUI}` `{SOU}` `{CON}` `{FOI}` `{ESP}` `{SOC}` — plus `{CORPS}`, `{AME}`, `{HEROISME}`, `{TEMPETE}`, `{BLESSURE}`, `{RESILIENCE}`, `{ESQUIVE}`.
Un helper `{POOL:ESP}` génère la notation de pool (N dés de taille liée à la caractéristique) via les règles Glyphes déjà en place.

### D&D 5e / Pathfinder 2e
Scores `{STR}` `{DEX}` `{CON}` `{INT}` `{WIS}` `{CHA}` et modificateurs `{MOD_STR}`... plus `{MAIT}` (bonus de maîtrise), `{DDSORT}`, `{ATQSORT}`.

### Cthulhu 7e (pourcentages)
`{FOR}` `{DEX}` `{POU}` … valeur en %, plus `{SAN}`, `{DEMI:FOR}`, `{CINQ:FOR}`.

### Personnalisé (Homebrew)
Toute clé définie dans le template du MJ est exposée telle quelle en majuscules.

Les variables inconnues sont remplacées par `0` et signalées dans un avertissement à l'édition (aperçu live de la formule résolue).

## 2. Schéma de table

Table `public.macros` :

| champ | type | rôle |
|---|---|---|
| id | uuid PK | |
| owner_user_id | uuid | propriétaire |
| campaign_id | uuid nullable | macro de campagne ou globale |
| character_id | uuid nullable | fiche liée pour les variables |
| system | text | système du template (Aetheria, Glyphes…) |
| name | text | nom affiché |
| category | text | dossier ("Attaques", "Sorts"…) |
| icon | text nullable | nom d'icône |
| color | text nullable | teinte |
| actions | jsonb | liste ordonnée d'étapes : `{type:"roll", label, formula}` ou `{type:"text", content}` |
| is_shared | bool | macro de table partagée (MJ) |
| is_private_roll | bool | chuchotement MJ |
| sort_order | int | glisser-déposer |
| created_at / updated_at | timestamptz | trigger updated_at |

Accès : chaque utilisateur gère (voir, créer, modifier, supprimer) ses propres macros ; les membres d'une campagne peuvent lire les macros partagées de cette campagne ; seul le propriétaire MJ peut les modifier. Grants `authenticated` + `service_role`, RLS activée.

## 3. Code

- `src/lib/macros/variables.ts` — table de correspondance variables → valeur, par système, dérivée du registre `src/lib/systems`.
- `src/lib/macros/engine.ts` — substitution des `{VAR}`, parsing `xdy+z` (réutilise le moteur de dés du chat, extrait en fonction pure `rollFormula`).
- `src/lib/macros/defaults.ts` — macros par défaut par système (attaque de base, sauvegarde, épreuve Glyphes…), appliquées à la création d'un personnage.
- `src/hooks/useMacros.ts` — CRUD, réordonnancement, temps réel.
- `src/components/campaign/macros/MacroBar.tsx` — barre permanente (bas d'écran desktop, panneau latéral mobile) avec onglets de catégories.
- `MacroEditorDialog.tsx` — création/édition/duplication, aperçu de la formule résolue, choix icône/couleur, privé/partagé.
- Intégration dans `CampaignPlay` / `CampaignTabletop`, envoi des résultats dans `campaign_messages` (`message_type: "dice_roll"` ou `"whisper"`), un seul message regroupant toutes les étapes.
- Glisser-déposer via `@dnd-kit` (déjà utilisable) pour l'ordre et le changement de catégorie.

## 4. Page tutoriel

Mise à jour de `src/pages/Guide.tsx` avec des sections ajoutées dans l'ordre des dernières fonctionnalités : bibliothèque média et quotas, calques et scènes, PDF partagés, audio de campagne, grille multi-modes (carrée / hexagonale / libre), système Glyphes et épreuves, puis macros.

## Détails techniques

Le moteur de dés actuel vit dans `CampaignChat.tsx` ; il sera extrait tel quel vers `src/lib/macros/engine.ts` et réutilisé par le chat pour éviter deux implémentations. Les variables sont résolues au clic à partir de la fiche fraîchement lue (React Query), jamais figées en base.

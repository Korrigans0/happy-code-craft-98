# Personnages pré-tirés — extension des systèmes existants

## Constat de l'analyse (à connaître avant validation)
- **Personnages** : table `characters` (`system` + `system_data`), fiche unique `CharacterForm` / `SheetRouter`. Réutilisées telles quelles.
- **Attribution** : `campaign_members.character_id` (sélecteur dans `CampaignMembers`). Réutilisé pour l'attribution du pré-tiré.
- **Boutique** : `content_packages` + `package_items` + RPC `install_content_package` (copie vers `homebrew_content` = bibliothèque). Réutilisés, nouveau `kind = 'pregen_character'`.
- **Bibliothèque** : page `Library` + `homebrew_content`. On y ajoute un onglet « Personnages pré-tirés ».
- **Propositions** : l'interface existe, mais dans la version en ligne elle est **inactive** (la fonction renvoie une liste vide, aucune table côté serveur). Je n'y touche pas ; les pré-tirés fonctionnent indépendamment. Réactiver les propositions serait un chantier séparé.

## Modèle de données (ajouts minimaux)
Colonnes ajoutées à `characters` (pas de nouvelle table personnage) :
- `kind` : `'standard'` (défaut, tous les persos existants) ou `'pregen'`
- `pregen_campaign_id` : campagne à laquelle le modèle appartient
- `pregen_available` (bool, défaut faux), `pregen_allow_multiple` (bool, défaut faux)
- `source_character_id` : modèle d'origine d'une instance joueur
- `source_package_id` : paquet Boutique d'origine (traçabilité)

Relation : `Modèle pré-tiré (kind=pregen)` → `campagne` → `Instance joueur (kind=standard, source_character_id=modèle)`. Qui a choisi quel modèle se déduit des instances : pas de table d'attribution en double.

## Sécurité côté serveur
- RLS `characters` : un pré-tiré n'est modifiable/supprimable que par le MJ de sa campagne (`is_campaign_gm`). Les joueurs membres ne lisent que les pré-tirés `pregen_available = true`. Les personnages standards gardent leurs règles actuelles.
- Les pré-tirés ne comptent pas dans le quota de personnages du MJ (trigger `enforce_character_quota` ajusté) ; l'instance joueur, elle, compte pour le joueur.
- Fonctions sécurisées (connexion obligatoire, vérifications internes) :
  - `claim_pregen_character(_pregen_id)` : vérifie membre joueur, disponible, non déjà pris (sauf usage multiple), verrou anti double-choix ; copie la fiche → nouvelle instance au joueur ; met à jour `campaign_members.character_id`.
  - `gm_assign_pregen(_pregen_id, _user_id)` : même copie, déclenchée par le MJ pour un joueur membre.
  - `gm_unassign_pregen(_pregen_id, _user_id)` : retire le lien membre ; l'instance du joueur n'est jamais supprimée.
  - `duplicate_pregen(_pregen_id)` : copie du modèle dans la même campagne.
  - `publish_pregen_to_shop(_pregen_id, title, description, tags)` : crée un paquet Boutique avec un instantané de la fiche (le modèle n'est pas lié à la publication).
  - `add_library_pregen_to_campaign(_homebrew_id, _campaign_id)` : MJ seulement, système de campagne identique ; crée un nouveau modèle pré-tiré indépendant.
- `install_content_package` conserve son fonctionnement : le pré-tiré est copié dans la bibliothèque, jamais comme personnage actif.

## Interface (composants existants réutilisés)
1. **Campagne → onglet Joueurs**, nouvelle section « Personnages pré-tirés » :
   - MJ : bouton « + Créer un personnage pré-tiré » qui ouvre le `CharacterForm` existant (système verrouillé sur celui de la campagne), enregistré comme « Pré-tiré pour cette campagne ».
   - Cartes au design actuel (portrait, nom, classe — race — niveau, badge Disponible/Non disponible, « Attribué à : … »).
   - Actions : Voir, Modifier, Dupliquer, Rendre disponible / Masquer, Autoriser l'usage multiple, Attribuer à un joueur, Retirer l'attribution, Publier dans la Boutique / Garder privé, Supprimer (avec confirmation).
   - Joueur : « Personnages pré-tirés disponibles », aperçu (portrait, nom, race, classe, sous-classe, niveau, description, principales caractéristiques), bouton « Choisir ce personnage », confirmation « Voulez-vous choisir « Arkan », Mage niveau 5, pour cette campagne ? ». Pré-tirés déjà pris : grisés.
2. **Boutique** : catégorie/filtre « Personnages pré-tirés » dans les filtres existants, plus filtres Système, Race, Classe, Niveau, Créateur. Pas de prix : la Boutique actuelle est gratuite, donc badge « Gratuit » seulement. Bouton existant « Ajouter à ma bibliothèque ». Le créateur garde la publication/le retrait existants ; retirer un paquet ne supprime aucune copie.
3. **Bibliothèque** : onglet « Personnages pré-tirés » avec « Ajouter à une campagne », qui propose uniquement les campagnes du même système où l'on est MJ.

## Détails techniques
- Migration : colonnes + index sur `characters`, RLS ajustées, 6 fonctions SECURITY DEFINER (REVOKE anon), trigger de quota adapté.
- Front : `lib/api.ts` (fonctions `pregensApi`), hook `usePregens`, composants `PregenSection`, `PregenCard`, `PregenPreviewDialog`, `PublishPregenDialog`, `AddPregenToCampaignDialog` ; intégration dans `CampaignMembers`, `Marketplace`, `Library`.
- Les listes de personnages du joueur (`Characters`) excluent `kind = 'pregen'`.
- Tests : Playwright pour les parcours MJ et joueur, et requêtes directes sous un compte joueur pour vérifier les refus serveur (modification/suppression du modèle, choix d'un pré-tiré déjà pris, lecture d'un pré-tiré masqué). Les 22 points demandés seront vérifiés et rapportés.

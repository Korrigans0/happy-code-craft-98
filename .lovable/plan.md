# Refonte commerciale des abonnements Aétheria VTT

## État vérifié avant intervention
- La page actuelle affiche quatre offres mais utilise encore les anciens prix 0/2/3/4 €, sans source centralisée.
- Le paiement intégré vient d’être activé en environnement de test ; aucun produit ni tarif n’existe encore.
- Les événements de paiement et d’abonnement sont enregistrés, mais l’application ne possède pas encore le traitement qui synchronise les abonnements.
- La base ne distingue actuellement que `free`, `gm_premium` et `premium_plus`. Les quotas payants annoncés ne sont pas réellement appliqués : hors gratuit, campagnes, personnages et membres sont illimités.
- Le stockage réellement appliqué est 5/10/15 Go ; Premium PJ et le quota Mixte de 30 Go n’existent pas encore.
- La page Compte n’affiche ni abonnement, ni échéance, ni utilisation de stockage.

## 1. Catalogue et source de vérité
- Créer une configuration unique typée pour les quatre offres : Aétheria, Premium PJ, Premium MJ et Premium Mixte.
- Centraliser les intitulés, descriptions, fonctionnalités, quotas, prix des trois périodes et identifiants de paiement lisibles et stables.
- Créer trois produits payants et neuf tarifs récurrents réels en environnement de test :
  - PJ : 2,99 €/mois, 8,49 €/3 mois, 29,90 €/an.
  - MJ : 4,99 €/mois, 14,19 €/3 mois, 49,90 €/an.
  - Mixte : 7,99 €/mois, 22,79 €/3 mois, 79,90 €/an.
- Utiliser de vrais identifiants créés par le catalogue de paiement, jamais des identifiants fictifs. Le gratuit reste hors paiement.
- Calculer les économies et équivalents mensuels depuis cette configuration.

## 2. Modèle sécurisé des abonnements et quotas
- Remplacer le modèle technique incomplet par quatre niveaux effectifs : gratuit, Premium PJ, Premium MJ et Premium Mixte, en migrant les anciens comptes sans perte.
- Ajouter une table d’abonnements avec utilisateur, produit, tarif, période, statut, échéances, résiliation programmée et environnement test/live.
- Autoriser chaque utilisateur à lire uniquement son abonnement ; réserver toute écriture au traitement serveur signé.
- Empêcher explicitement un utilisateur de modifier lui-même son niveau Premium.
- Appliquer côté serveur les quotas réels :
  - Aétheria : 3 campagnes, 3 personnages, 5 joueurs, 5 Go.
  - Premium PJ : 3 campagnes, 20 personnages, 5 joueurs, 10 Go.
  - Premium MJ : 20 campagnes, 3 personnages, 10 joueurs, 15 Go.
  - Premium Mixte : 50 campagnes, 50 personnages, 10 joueurs, 30 Go.
- Conserver les données lors d’une baisse d’offre : bloquer seulement les nouvelles créations/importations dépassant le quota, sans suppression automatique.
- Durcir le suivi du stockage afin que la taille déclarée par le navigateur ne permette pas de contourner les limites.

## 3. Synchronisation des paiements
- Déployer le traitement serveur des événements signés pour création, activation, renouvellement, échec, changement d’offre, résiliation et remboursement.
- Synchroniser le niveau du profil uniquement depuis un abonnement vérifié et correspondant à l’environnement courant.
- Maintenir l’accès jusqu’à la fin de période après résiliation ; ne jamais accorder Premium au seul clic.
- Ajouter la résolution sécurisée des tarifs et l’accès au portail de gestion pour changer d’offre, de période, de moyen de paiement ou résilier.
- Afficher les échecs de paiement sans retirer prématurément les données ni l’accès pendant la période de régularisation gérée par le prestataire.

## 4. Nouvelle page Abonnements
- Recomposer la page existante avec exactement quatre cartes cohérentes, en français, dans l’identité bleu nuit, or, cyan et runique actuelle.
- Ajouter le sélecteur Mensuel / Trimestriel / Annuel, avec prix facturé, cadence, équivalent mensuel et économie calculée.
- Limiter les badges à « RECOMMANDÉ » pour Mixte et « MEILLEURE ÉCONOMIE » pour l’annuel.
- Garder Mixte courte : héritage PJ + MJ, puis uniquement ses avantages supplémentaires.
- Adapter les actions à l’état réel : visiteur → création de compte ; gratuit → passage à Premium ; Premium → offre actuelle et gestion.
- Ajouter la comparaison compacte des 17 critères et les 13 questions fréquentes avec des réponses conformes au fonctionnement livré.
- Garantir l’empilement mobile, l’absence de débordement horizontal et des actions tactiles accessibles.

## 5. Validation avant paiement et espace Compte
- Conserver une confirmation avant paiement indiquant offre, période, prix total, renouvellement, conditions, CGV, CGU et rétractation.
- Garder la case CGV/CGU non précochée et désactiver la validation tant qu’elle n’est pas acceptée.
- N’ouvrir le paiement réel qu’après connexion et confirmation.
- Ajouter dans Compte : offre, période, prix, statut, prochaine échéance, quotas et consommation de stockage.
- Fournir « Gérer mon abonnement », « Changer d’offre » et « Résilier » via le portail sécurisé.
- Avant une baisse d’offre, afficher date d’application, nouveaux quotas et dépassements constatés ; ne rien supprimer automatiquement.

## 6. Cohérence commerciale et juridique
- Retirer les anciens prix 2/3/4 € de l’application active, des textes commerciaux et des pages juridiques.
- Mettre à jour CGV, confidentialité et rétractation avec le prestataire réellement utilisé, les nouvelles périodes et le fonctionnement réel des remboursements.
- Conserver les mentions non vérifiables comme telles et ne pas présenter le mode réel comme actif avant vérification d’identité et validation du site.

## 7. Vérifications
- Vérifier le catalogue des neuf tarifs et leur correspondance exacte avec l’interface.
- Tester les vues visiteur, gratuit, PJ, MJ et Mixte ; les trois périodicités ; les économies ; les quotas ; le stockage ; changement et résiliation.
- Tester un paiement réussi et refusé en mode test, la synchronisation de la base et l’accès maintenu jusqu’à l’échéance.
- Vérifier ordinateur et mobile, absence de débordement, navigation clavier, typecheck, tests du projet et contrôle de sécurité.
- Produire le rapport final demandé avec tarifs, quotas, identifiants créés, événements gérés, modifications et éventuels blocages de mise en ligne.

## Limite de mise en ligne
La commercialisation réelle restera explicitement non activée tant que la vérification d’identité, la validation des pages publiques et le passage en mode réel ne sont pas terminés. L’aperçu permettra néanmoins de tester tout le parcours sans argent réel.

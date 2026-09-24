# Pages juridiques et crédits — version 1.0

## Objectif
Créer sept pages publiques en français, intégrées à l’identité dark fantasy d’Aétheria VTT, et adapter les parcours concernés uniquement à partir des services réellement présents dans le projet.

## Pages publiques
- `/mentions-legales` : éditeur, hébergeur, propriété intellectuelle, responsabilité, données et cookies.
- `/cgu` : 27 articles couvrant comptes, VTT, campagnes, personnages, Codex, contenus utilisateurs, fichiers, Homebrew, modération et responsabilités.
- `/cgv` : offres réellement affichées (0 €, 2 €/mois, 3 €/mois, 4 €/mois), tout en indiquant clairement que les paiements ne sont pas encore activés.
- `/confidentialite` : traitements, bases légales, durées, destinataires, droits et sous-traitants strictement vérifiés dans le code.
- `/cookies` : inventaire réel du stockage navigateur et absence de traceurs statistiques/publicitaires détectés.
- `/credits-licences` : Aétheria, Worlds Awakening, Glyphes et D&D 5e/SRD 5.1 sous CC BY 4.0, avec attributions et non-affiliation.
- `/retractation` : informations légales et formulaire validé permettant d’envoyer une demande.

Chaque page affichera « Version : 1.0 » et « Dernière mise à jour : septembre 2026 », avec une structure commune lisible et facile à maintenir.

## Parcours et demandes
- Ajouter un formulaire public distinct pour signaler un contenu juridique, séparé du signalement de bug.
- Ajouter un formulaire pour exercer les droits RGPD.
- Ajouter dans le compte une demande de suppression avec confirmation explicite et explication des conséquences.
- Ne pas simuler une suppression immédiate ni une résiliation tant que ces traitements ne sont pas réellement disponibles côté service.
- Préparer le parcours d’abonnement avec résumé de l’offre et case CGU/CGV non précochée ; aucun paiement ne sera déclenché puisque le projet indique qu’il n’est pas encore actif.

## Cookies
- Remplacer le bandeau actuel par trois actions équilibrées : Accepter, Refuser, Personnaliser.
- Conserver uniquement les catégories réellement identifiées : nécessaires et préférences ; statistiques et marketing restent désactivées car aucun traceur correspondant n’est détecté.
- Rendre « Paramètres des cookies » accessible en permanence depuis le pied de page.
- Permettre le retrait ou la modification du choix à tout moment.

## Navigation et présentation
- Ajouter les sept routes sans connexion requise.
- Recomposer le pied de page avec une section « Juridique » et tous les liens demandés.
- Réutiliser les composants, couleurs, typographies, ambiance et règles mobiles existants.
- Ajouter des titres et descriptions propres à chaque page via le système SEO existant.

## Vérification
- Vérifier les routes et liens sur ordinateur et mobile.
- Tester acceptation, refus et personnalisation des cookies.
- Tester les formulaires de rétractation, droits RGPD et signalement juridique.
- Tester le résumé d’abonnement, la case CGU/CGV et l’absence de paiement réel.
- Vérifier qu’aucun système retiré n’apparaît dans les nouvelles pages.
- Exécuter le contrôle TypeScript et les tests du projet, puis vérifier les parcours essentiels dans le navigateur.

## Points explicitement laissés à validation professionnelle
- Les durées légales exactes de conservation selon les obligations comptables et contentieuses.
- Le régime de TVA applicable à la micro-entreprise.
- Les modalités finales de paiement, renouvellement, facturation, résiliation et remboursement avant activation commerciale.
- La portée documentaire des autorisations Worlds Awakening et Glyphes.
- Le texte final des clauses de rétractation selon la date réelle d’activation des abonnements.

# Roadmap

## Performances et sauvegardes en partie (Glyphes)
- [x] Sortir les images de carte de l'état partagé (8 Mo → 3 Ko pour « Désastre Industriel »), copie de sauvegarde conservée
- [x] Corriger le blocage de toutes les sauvegardes après un changement de scène
- [x] Sauvegardes de jetons fusionnées sans écrasement entre joueurs, nouvel essai en cas de coupure, rechargement fiable
- [x] Alléger les vérifications répétées (fiches liées, portraits, combat Glyphes, confrontation)
- [x] Tests : fusion simultanée, coupure réseau, deux onglets, endurance, import de carte
- [ ] Publier, puis faire une session test réelle à plusieurs joueurs

## Dés 3D partagés sur la table
- [x] Rejouer les lancers 3D des autres joueurs sur la carte avec leurs vrais résultats (option désactivable)

## Préservation des cases Glyphes
- [x] Initialiser depuis les fiches et synchroniser uniquement les modifications volontaires
- [x] Tester les états anciens, les déplacements, les remises à zéro et les sauvegardes concurrentes
- [x] Vérifier le parcours connecté et résoudre le signalement confirmé

## Défilement des actions héroïques Glyphes
- [x] Donner à la liste une zone de défilement à la molette sans déplacer ou zoomer la carte
- [x] Vérifier l’accès à la dernière action dans le panneau connecté : liste de 1065 px défilant dans une zone de 192 px

## Portrait Glyphes
- [x] Réutiliser l’import et le recadrage d’avatar pour la fiche PDF
- [x] Afficher le portrait dans la case du PDF et l’intégrer à l’export
- [x] Synchroniser les jetons liés et vérifier import, sauvegarde, réouverture et export en session connectée ; rendu PDF inspecté sans débordement
- [x] Vérifier le portrait sur un jeton créé via le Bestiaire et la mise à jour entrante ; ajouter un rafraîchissement de secours lorsque le temps réel ne transmet pas la modification

## Fiche Glyphes plein écran avec zoom
- [x] Ouvrir la fiche en plein écran et supprimer le bouton de fermeture en doublon
- [x] Ajuster la page PDF à la largeur disponible sur ordinateur et téléphone
- [x] Ajouter zoom / dézoom (boutons, molette et pincement, raccourcis clavier) avec ajustement à la largeur
- [x] Rendre le texte net à tous les niveaux de zoom et garder les champs alignés
- [x] Vérifier dans le navigateur : 100 %, 125 %, 156 %, 228 % et retour à 100 % sur les deux tailles d'écran
- [ ] Publier pour rendre la fiche et le zoom visibles sur aetheriavtt.com



## Affichage des blessures sous les jetons Glyphes
- [x] Remplacer la barre de points de vie par les blessures « 0 / 3 » sous un jeton Glyphes
- [x] Conserver la barre de points de vie pour les autres systèmes
- [x] Ramener les états de combat enregistrés avant la règle à 3 blessures maximum
- [x] Vérifier dans le navigateur : 2/3 puis 0/3 sur la campagne Glyphes, 10/10 conservé sur Worlds Awakening
- [ ] Publier pour rendre la correction visible sur aetheriavtt.com


## Double-clic sur les jetons Glyphes
- [x] Remplacer la détection chronométrée par le double-clic natif et conserver l’accès aux fiches lorsque le déplacement est verrouillé
- [x] Afficher les erreurs de chargement au lieu d’une fiche vide
- [x] Ouvrir directement la fiche existante du personnage lié, sans ancien panneau intermédiaire
- [x] Conserver les permissions, la synchronisation et le comportement des autres systèmes
- [x] Vérifier le double-clic réel dans la campagne Glyphes connectée : la fenêtre s’ouvre et signale la fiche absente
- [ ] Vérifier le chargement du PDF depuis ce jeton : bloqué, le personnage lié a été supprimé (absence confirmée côté serveur)

## Section aventures de l'accueil (demande actuelle)
- [x] Remplacer la présentation actuelle par la scène immersive sur la page d'accueil
- [x] Ajouter un fondu continu des couleurs en haut et en bas de la scène
- [x] Conserver un retour à la version classique et vérifier ordinateur, mobile et liens
- [x] Publier le site pour rendre la section et le fichier Google accessibles en ligne

## Prototype visuel aventures (demande précédente)
- [x] Agrandir les artefacts et ajouter le transfert magique réversible, puis vérifier ordinateur et mobile
- [x] Identifier la section et isoler une variante sans changer les routes ni le fonctionnement
- [x] Créer les artefacts, la scène, le défilement et les commandes tactiles
- [x] Vérifier comparaison, liens, desktop, mobile, réduction des mouvements et erreurs de compilation
- [x] Fournir le bilan ciblé du prototype

- [x] Auditer les traitements, services, cookies, abonnements et parcours réels
- [x] Créer les pages juridiques publiques version 1.0
- [x] Intégrer consentement cookies, demandes juridiques et liens du footer
- [x] Mettre en conformité le parcours abonnement et les actions de compte existantes
- [ ] Vérifier routes, liens, mobile, textes, systèmes exclus, typecheck et parcours essentiels

## Refonte abonnements commerciale
- [ ] Auditer offres, quotas serveur, stockage, paiements et webhooks existants
- [ ] Centraliser les 4 offres, prix, périodes, quotas et fonctionnalités
- [ ] Refaire la page abonnements et sa comparaison, FAQ et états utilisateur
- [ ] Préparer gestion, changement et résiliation sans faux paiement
- [ ] Aligner les quotas serveur et l’affichage du stockage
- [ ] Vérifier mobile, calculs, sécurité, parcours utilisateur et compilation
- [ ] Produire le rapport final avec éléments de paiement manquants
- [x] Épreuves Glyphes partagées dans le chat de campagne (temps réel, historique, sans doublon)

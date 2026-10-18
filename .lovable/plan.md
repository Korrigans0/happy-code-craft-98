# Préserver les cases des fiches Glyphes

## Défaut confirmé

Un jeton sans état de combat démarre avec zéro blessure et zéro héroïsme. Son premier déplacement ou changement de tour enregistre ces valeurs, puis la synchronisation les écrit sur la fiche existante. Un test du code actuel reproduit le passage de **3 points d’héroïsme et 1 blessure à zéro**. Les anciens états de combat peuvent provoquer le même écrasement au chargement.

La correction nécessite de distinguer les valeurs chargées des modifications volontaires. Désactiver la synchronisation empêcherait l’effacement, mais supprimerait une fonctionnalité attendue ; cette solution n’est pas retenue.

## Correction proposée

1. **Initialiser les compteurs depuis la fiche liée** avant de permettre les modifications de ses blessures, de son héroïsme et de sa résilience. Conserver les points d’action et le déplacement de la session ; ne jamais donner autorité à des zéros par défaut ou à un ancien état de combat sur ces compteurs.
2. **Synchroniser uniquement les compteurs réellement modifiés.** Un déplacement, une dépense de PA ou un nouveau tour ne doit pas réécrire les cases Blessures/Héroïsme. Une modification volontaire, y compris un retour à zéro, doit toujours être enregistrée.
3. **Conserver la liaison dans les deux sens.** Les modifications de fiche alimentent tous ses jetons liés ; les modifications autorisées sur la table alimentent la fiche. Les mises à jour reçues ne doivent pas provoquer de boucle ni être interprétées comme une nouvelle action locale.
4. **Protéger les lectures et sauvegardes asynchrones.** Une lecture tardive ne doit pas annuler une action récente ; une sauvegarde refusée ou échouée ne doit pas être considérée comme réussie. Préserver les autres champs de la fiche et les restrictions d’accès existantes.

## Vérifications

- Fiche avec 3 points d’héroïsme et 1 blessure : premier déplacement et nouveau tour sans remise à zéro.
- Ancien état local/serveur à zéro : chargement sans écrasement de la fiche.
- Lecture retardée, modification depuis la fiche, plusieurs jetons liés et réception multijoueur.
- Dépense réelle d’héroïsme et modification réelle des blessures, dont remise volontaire à zéro ; blessures toujours plafonnées à 3.
- Échec de sauvegarde et nouvelle tentative sans perte des modifications.
- Tests de régression conservés dans le projet, puis vérification dans une campagne Glyphes connectée et contrôle des erreurs de compilation.

## Détails techniques

- `useGlyphesCombat` : suivi explicite de l’initialisation et des modifications locales des champs liés à la fiche, distinct des états restaurés ou reçus.
- `useGlyphesSheetSync` et `sheetSync` : écriture ciblée des champs modifiés, validation du système Glyphes et acquittement après sauvegarde réussie uniquement.
- `CampaignTabletop` : réutilisation des lectures de personnages, liaison des jetons et réconciliation des modifications de fiche, avec les permissions actuelles.
- Conserver `GlyphesPdfSheet` et sa réception des cases distantes sauf si les vérifications révèlent une modification nécessaire.
- Ne modifier aucun autre système, aucune politique d’accès ni aucun abonnement. Résoudre le signalement seulement après validation de la correction.
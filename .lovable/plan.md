# Aetheria VTT — Évolution vers une plateforme complète

Analyse faite à partir de l'existant (Campagnes, VTT, Codex, Bibliothèque média, Sessions, Macros, Audio, Profil) et d'une lecture UX de plateformes concurrentes. Aucune identité, texte, mise en page ou code externe n'est repris : uniquement des concepts UX génériques (dashboard, préparation de scène, relations entre contenus, permissions granulaires).

## Ce qui existe déjà (à ne PAS refaire)

- VTT complet : grille carrée/hex/freeform, tokens, PV, conditions, initiative/Épreuve, brouillard, murs, lumières, dessin, ping, mesure, dés 3D + overlay de jets, chat, PDF partagés, audio + SFX, macros, sélection multiple + copier/coller.
- Campagne : membres, invitations (codes sûrs), sessions + e-mails automatiques, notes MJ (`campaign_notes` avec `is_gm_only`), paramètres + bannière, outils MJ.
- Bibliothèque média (`media_assets`, quotas, upload, picker) et Codex multi-systèmes (Aetheria, WA, Glyphes, D&D, PF2e, CoC, COF) avec contenu officiel FR/EN.
- Profil, abonnements, onboarding MJ, RLS complète.

Donc l'effort porte sur : **organisation, liens entre contenus, préparation, permissions fines, historique, profil enrichi**.

---

## PRIORITÉ 1 — Maintenant

### 1.1 Tableau de bord MJ (`/dashboard`)
Nouvelle page (et redirection depuis l'accueil connecté) réunissant, dans le style Aetheria (indigo profond/or, Cinzel Decorative) :
- Prochaine session (compte à rebours) + bouton « Reprendre la partie ».
- Cartes campagnes (bannière, système, nb joueurs, dernière activité).
- Mes personnages, joueurs de mes campagnes (avatars), assets récents.
- Fil « Dernières modifications » (voir 1.4).
- Raccourcis : VTT, Codex, Bibliothèque, Notes MJ, Dés.
Chargement en squelettes, responsive mobile-first.

### 1.2 Codex de campagne (entités + relations)
Nouvelle table `campaign_entities` : `kind` (npc, faction, lieu, quête, objet, monstre, événement, note, aide de jeu), `system`, `campaign_id`, `name`, `summary`, `content` jsonb, `tags[]`, `image_url`, `visibility`, `gm_notes`.
Table `entity_links` (source, cible, type de relation, bidirectionnelle).
- Onglet « Codex » dans la campagne : recherche, filtres par type/tags, vue liste + fiche.
- Bloc « Relations » cliquable sur chaque fiche (PNJ → Faction → Lieu → Quête → Objet).
- Filtrage strict par `system` de la campagne (+ homebrew si activé).
- Zone « Notes privées du MJ » sur chaque fiche, jamais envoyée aux joueurs (filtrage RLS colonne/vue, pas seulement UI).

### 1.3 Permissions de contenu
Champ `visibility` : `gm_only` | `selected_players` | `campaign` | `public`, plus table `entity_permissions` (user_id, niveau : lecture / utilisation / modification / duplication / administration).
Politiques RLS + fonctions SECURITY DEFINER dédiées ; l'UI reflète seulement ce que le serveur autorise.

### 1.4 Historique des modifications
Extension de `campaign_audit_log` : journalisation des créations/éditions/suppressions d'entités, tokens, sessions, avec `before`/`after` jsonb. Affichage dans le dashboard et un onglet « Historique » de campagne. Restauration d'une version précédente pour les entités du Codex.

### 1.5 UX générale
- Palette de commandes (Ctrl/Cmd+K) : navigation, recherche globale campagnes/personnages/entités.
- Barre d'outils VTT réorganisée en groupes repliables (Navigation / Dessin & mesure / Vision & lumière / Session) pour désencombrer, sans retirer un seul outil.
- États de chargement, messages d'erreur et toasts harmonisés ; focus visible, `aria-label` sur les boutons icônes.

---

## PRIORITÉ 2 — Ensuite

### 2.1 Espace de préparation de campagne
Onglet « Préparation » : arborescence Chapitres → Scènes → Événements/Rencontres, avec drag & drop (réordonner, déplacer une entité dans une scène). Tables `campaign_chapters` et `campaign_scenes_plan` reliées aux entités et aux scènes VTT existantes.

### 2.2 Prévisualisation et lancement de session
Préparer une scène (carte, tokens, murs, lumières, brouillard, musique, PNJ, notes) en mode brouillon invisible des joueurs, puis bouton « Lancer la session » qui publie la scène et ouvre la session.

### 2.3 Séparation Campagne / Session
Campagne = monde permanent (entités, progression, Codex, inventaires). Session = état temporaire (initiative, positions, jets, chat, événements). À la clôture, archivage d'un instantané consultable dans l'historique de la campagne.

### 2.4 Bibliothèque d'assets enrichie
Dossiers, tags, recherche, aperçu, drag & drop vers la table de jeu, et indicateur « utilisé dans » (scène, entité, token).

### 2.5 Fiches multi-vues
Un composant unique par entité avec 4 rendus partageant la même source : token, carte compacte, fiche complète, encart intégré (quête, Codex). Aucune duplication de données.

### 2.6 Profils et achievements
Profil Aetheria : avatar, présentation, campagnes publiques, personnages, créations, statistiques (sessions jouées, campagnes menées), badges. Table `achievements` + `user_achievements`, déblocage serveur, récompenses cosmétiques.

---

## PRIORITÉ 3 — Roadmap

- **Assistant IA MJ** (Lovable AI) : génération de PNJ, monstres, objets, quêtes, rencontres, dialogues, contrainte au système de la campagne via le registre `src/lib/systems` (aucun mélange de systèmes), insertion directe dans le Codex.
- **Création de contenu** : éditeurs de races, classes, compétences, sorts, objets, monstres, effets et règles sans toucher au code, adossés au registre de systèmes.
- **Personnalisation** : thèmes, cadres de tokens/portraits, skins et effets de dés, effets sonores.
- **Marketplace** : tables `content_packages`, `package_items`, `package_ownership` préparées dès la Priorité 2 (contenu déjà versionné, permissions et visibilité déjà en place), publication et distribution plus tard.

---

## Notes techniques

- Aucune fonctionnalité existante supprimée ; les tables actuelles (`campaign_notes`, `media_assets`, `tabletop_state`, `campaign_sessions`) sont conservées et référencées par les nouvelles.
- Toute nouvelle table `public` : `CREATE TABLE` → `GRANT` → `ENABLE RLS` → policies, accès validé par `is_campaign_gm` / `is_campaign_member`.
- Isolation des systèmes garantie par la colonne `system` et le registre `src/lib/systems` ; ajout futur de systèmes sans migration de code applicatif.
- Réutilisation de `useRealtimeChannel` pour la synchro des nouveautés de session ; pas de polling.
- UI en français, code en anglais, mobile-first.

## Périmètre proposé pour la première itération de code

Priorité 1 complète : dashboard, entités + relations + Codex de campagne, permissions/RLS, historique, recherche globale et réorganisation de la barre d'outils VTT.

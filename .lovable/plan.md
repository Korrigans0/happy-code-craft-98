# Ajout du système "Glyphes" à Aetheria VTT

## Vue d'ensemble

Glyphes est un nouveau système modulaire avec 3 époques (Nouvelle Empire, Présent, Futur). Seul "Nouvelle Empire" a du contenu, les 2 autres sont des placeholders.

Important : avant de coder, je dois **parser les 7 PDFs fournis** pour extraire le contenu exact des règles (Module Cœur + Nouvel Empire + bestiaires + fiche). Sans ça, je vais inventer des règles fausses.

## Architecture

### 1. Registre système (intégration multi-système)
- Nouveau fichier `src/lib/systems/glyphes.ts` — SystemDefinition pour Glyphes Nouvelle Empire (caractéristiques PUI/SOU/CON/FOI/ESP/SOC, races, etc.)
- Enregistrer dans `src/lib/systems/index.ts` aux côtés d'Aetheria, D&D, etc.
- Cela ajoute automatiquement Glyphes au sélecteur de système lors de la création de campagne.

### 2. Pages publiques (hub + contenu)
Le site a déjà une page `/partners` et `/guide`. Je ne vois pas de page "Systèmes" dédiée à parcourir. Je vais créer :

```
/systems                → liste tous les systèmes (Aetheria, WA, D&D5e, PF2e, CoC, Glyphes, Custom)
/systems/glyphes        → hub Glyphes avec 3 tuiles d'époques
/systems/glyphes/nouvel-empire   → contenu complet (sections 1-23)
/systems/glyphes/present         → placeholder "en développement"
/systems/glyphes/futur           → placeholder "en développement"
```

Routes ajoutées dans `App.tsx`.

### 3. Page "Nouvelle Empire" — structure

Sidebar fixe (desktop) / accordéon mobile avec les 23 sections demandées. Composants :

- `src/pages/systems/glyphes/NouvelEmpire.tsx` — layout + sommaire
- `src/components/systems/glyphes/sections/` — un fichier par section (23 fichiers)
- `src/lib/systems/glyphes/data.ts` — toutes les données structurées extraites des PDFs (difficultés, magnitudes, états, dons, races, aptitudes, équipement, factions, atlas)

Style dark fantasy cohérent avec le reste du site (Cinzel/Lora, palette bleu-noir/or). Tableaux shadcn pour les données, Accordion pour dons/races/aptitudes, Cards pour factions/régions.

## Détails techniques

- **Parser PDFs** via `document--parse_document` sur les 7 fichiers user-uploads avant d'écrire le code.
- **Réutiliser composants UI existants** : `Card`, `Table`, `Accordion`, `Tabs`, `Badge` de shadcn.
- **Pas de duplication** : créer un composant `<RulesSection>` réutilisable (titre + contenu).
- **i18n FR** : tout le contenu en français (cohérent avec le projet).
- **Mobile** : sidebar → Sheet (drawer) sur < md.
- **SEO** : title + meta sur chaque page (`/systems/glyphes` etc.).

## Ce qui n'est PAS inclus dans ce premier livrable

- Fiche de personnage Glyphes jouable dans le VTT (formulaire + sheet) — Étape 2 séparée, gros chantier (intégration `CharacterForm`, calculs, sheet component).
- Import du bestiaire Glyphes dans le compendium.
- Compendium dédié Glyphes.

Je livre d'abord les pages de présentation + l'enregistrement du système dans le registre. Une fois validé, on enchaînera fiche jouable + bestiaire dans des passes séparées.

## Plan d'exécution

1. Parser les 7 PDFs → extraction du contenu réel
2. Créer `data.ts` avec toutes les données structurées
3. Créer le SystemDefinition `glyphes.ts` + l'enregistrer
4. Créer les 3 routes + page hub `/systems/glyphes`
5. Créer la page Nouvelle Empire avec sidebar + 23 sections
6. Créer les 2 placeholders Présent/Futur
7. Lien depuis la home / nav si pertinent
8. Build + typecheck

Estimation : très gros volume de contenu (les PDFs font probablement 50+ pages combinées). Le code reste raisonnable car presque tout est du contenu déclaratif dans `data.ts` + sections de rendu.

## Question avant de commencer

Confirmez-vous :
- (a) Je livre **uniquement les pages de présentation/règles** dans ce passage, et on traite la **fiche jouable + bestiaire VTT** dans un passage suivant ? Ou vous voulez que je tente tout d'un coup (risque : superficiel partout) ?
- (b) Le lien "Systèmes" doit-il apparaître dans la nav principale, ou seulement accessible depuis le Guide / l'accueil ?
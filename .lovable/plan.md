# Refonte visuelle Aetheria VTT — Dark Fantasy premium

Objectif : transformer l'apparence du site (page d'accueil, navigation, cartes, ambiance) pour évoquer un véritable monde fantasy vivant, tout en conservant toutes les fonctionnalités existantes (VTT, campagnes, codex, auth, etc.). Ajout d'une nouvelle page **Abonnements**.

## Périmètre

Pages touchées : `Index` (Hero, Features, GameSystems, Campaigns), `Header`, `Footer`, `MobileBottomNav`, design tokens globaux (`index.css`, `tailwind.config.ts`).

Pages non touchées (fonctionnel intact) : `CampaignPlay`, `Campaigns`, `Characters`, `Compendium`, `DiceRoller`, `Auth`, `Profile`, etc.

## 1. Direction artistique & tokens

- Palette HSL enrichie dans `index.css` :
  - `--background` bleu-nuit très profond (~`220 50% 5%`)
  - `--primary` or lumineux (`43 90% 58%`)
  - Nouveaux tokens : `--magic-violet` (`270 70% 55%`), `--magic-cyan` (`190 90% 60%`), `--magic-emerald` (`155 65% 45%`), `--magic-deep` (`230 65% 12%`)
  - Gradients : `--gradient-fantasy` (bleu nuit → violet), `--gradient-gold-rune`, `--gradient-portal` (cyan→violet)
  - Shadows : `--shadow-magic`, `--shadow-rune-glow`
- Polices conservées (Cinzel / Lora).
- Nouveaux keyframes globaux : `float-slow`, `rune-pulse`, `sparkle`, `mist-drift`, `portal-spin`.

## 2. Composants d'ambiance réutilisables

Nouveau dossier `src/components/fantasy/` :

- `MagicParticles.tsx` — canvas léger (50–80 particules dorées/cyan flottantes, désactivé sur mobile via `useIsMobile`).
- `FloatingRunes.tsx` — runes SVG positionnées en absolute, animées `rune-pulse`.
- `MistOverlay.tsx` — gradient radial animé (brouillard).
- `SideDecorations.tsx` — branches/orchidées/cristaux SVG sur les bords (cachés < md).
- `D20Float.tsx` — D20 SVG flottant décoratif.

Performance : tout est `pointer-events-none`, `will-change` limité, particules réduites/désactivées sur mobile.

## 3. Hero Section (refonte totale)

- Suppression du gros logo central (logo reste uniquement dans le Header).
- Fond : image fantasy générée (ruines elfiques + portail magique + cristaux + cascade lointaine + brume).
- Overlay sombre + vignette pour lisibilité.
- Décorations latérales SVG (orchidées lumineuses + cristaux flottants + fées) en absolute, cachées sur mobile.
- Titre `AETHERIA VTT` en Cinzel doré avec halo + sous-titre.
- 2 CTA : « Créer mon aventure » (or) / « Rejoindre une partie » (outline rune).
- 4 mini-badges : MJ & PJ réunis, WA intégré, VTT immersif, Cloud sécurisé.
- Particules magiques + mist overlay.

## 4. Cartes de fonctionnalités

Refonte `FeaturesSection` : 6 cartes (Campagnes, Personnages, Codex, Dés, Table virtuelle, Univers), chacune avec :
- Bordure dégradée (or/violet/cyan/émeraude variable selon catégorie)
- Effet verre (`backdrop-blur` + `bg-card/40`)
- Lueur au survol (`shadow-magic`)
- Icône Lucide unique + petite illustration runique en fond
- Couleur d'accent par catégorie

## 5. Header & Navigation

- Ajout d'un lien **Abonnements** entre Codex et Partenaires.
- Légère refonte : fond verre, séparateurs runiques discrets.

`MobileBottomNav` : remplacer un item (Dés ou Partenaires) — on garde 6 items en ajoutant Abonnements via icône `Crown`. → Remplacement de « Partenaires » par « Premium » dans la barre mobile (Partenaires reste accessible via le footer).

## 6. Nouvelle page Abonnements

`src/pages/Subscriptions.tsx` + route `/subscriptions` dans `App.tsx`.

4 plans en cartes premium (verre + bordure dorée pour le plan recommandé) :

| Plan | Prix | Highlights |
|---|---|---|
| Gratuit | 0 € | 3 campagnes, 3 persos, 5 joueurs, 1 To, brouillard, vision, codex |
| Premium PJ | 2 €/mois | 20 persos, inventaire avancé, portraits HD, historique, effets |
| Premium MJ | 3 €/mois | 20 campagnes, 10 joueurs, 5 To, lumières/murs dynamiques avancés |
| Premium Mixte ⭐ | 4 €/mois | 50/50, 10 To, badge Fondateur, monde illimité |

CTA non fonctionnels (toast « Bientôt disponible ») — pas d'intégration paiement dans cette itération (à confirmer plus tard).

Ambiance : particules + runes + mist, fond fantasy.

## 7. Footer & sections existantes

- `GameSystemsSection` et `CampaignsSection` : adaptation au nouveau langage visuel (cartes verre, accents colorés) sans changer le contenu.
- Footer : légère touche dorée + runique.

## 8. Génération d'assets

Images générées (premium quality où utile) :
- `src/assets/hero-fantasy-bg.jpg` — scène ruines elfiques + portail
- `src/assets/card-campaigns.jpg`, `card-characters.jpg`, `card-codex.jpg`, `card-dice.jpg`, `card-vtt.jpg`, `card-universe.jpg` — illustrations carrées
- `src/assets/side-orchids-left.png` (transparent), `side-orchids-right.png` (transparent)

## 9. Responsive & performance

- Décorations latérales : `hidden md:block`.
- Particules : nombre divisé par 3 sur mobile, `prefers-reduced-motion` respecté.
- Images `loading="lazy"` sauf hero.
- Aucune dépendance ajoutée.

## 10. Hors périmètre (intact)

- Fonctionnalités VTT, plateau, murs/portes, tokens, auth, base de données, edge functions.
- Aucune migration SQL.

## Détails techniques

- Tous les couleurs via tokens HSL (jamais de hex en dur dans les composants).
- Composants ambiance : `pointer-events-none`, `aria-hidden`.
- Le canvas particules s'arrête quand l'onglet est masqué (`document.hidden`).
- Route `/subscriptions` ajoutée AVANT la route catch-all `*`.
- `MobileBanner` et `CookieBanner` conservés tels quels.

---

Confirme que je peux : (1) remplacer « Partenaires » par « Premium » dans la barre mobile, (2) laisser les boutons d'abonnement non-fonctionnels pour cette itération (paiement à brancher plus tard), (3) générer ~8 images pour l'ambiance.

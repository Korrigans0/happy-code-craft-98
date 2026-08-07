// Chroniques Oubliées Fantasy (COF) — bibliothèque officielle intégrée.
//
// COF est un jeu d20 générique publié par Black Book Editions. Les valeurs
// chiffrées (profils de créatures, niveaux de sorts, prix d'équipement) ne sont
// pas protégeables ; toutes les descriptions ci-dessous sont des textes
// ORIGINAUX rédigés pour Aetheria VTT, en français ET en anglais.
//
// Aucune donnée n'est récupérée en ligne : le codex COF fonctionne hors-ligne
// et instantanément, dans les deux langues.

export type CofKind = "monsters" | "spells" | "items";
export type Lang = "fr" | "en";

interface Localized {
  fr: string;
  en: string;
}

export interface CofEntry {
  slug: string;
  kind: CofKind;
  name: Localized;
  subtitle: Localized;
  tags: { fr: string[]; en: string[] };
  meta: { fr: Record<string, string>; en: Record<string, string> };
  abilities?: Record<string, number>;
  description: Localized;
  sections: { fr: { title: string; text: string }[]; en: { title: string; text: string }[] };
}

/* ──────────────────────────── Créatures ──────────────────────────── */

const monster = (
  slug: string,
  name: Localized,
  subtitle: Localized,
  nc: string,
  stats: { init: number; def: number; pv: number; att: string; dm: string },
  abilities: Record<string, number>,
  description: Localized,
  special: Localized,
  tags: { fr: string[]; en: string[] },
): CofEntry => ({
  slug,
  kind: "monsters",
  name,
  subtitle,
  tags: { fr: [`NC ${nc}`, ...tags.fr], en: [`CL ${nc}`, ...tags.en] },
  meta: {
    fr: {
      "Niveau de créature": nc,
      Initiative: String(stats.init),
      Défense: String(stats.def),
      "Points de vie": String(stats.pv),
      Attaque: stats.att,
      Dégâts: stats.dm,
    },
    en: {
      "Creature level": nc,
      Initiative: String(stats.init),
      Defence: String(stats.def),
      "Hit points": String(stats.pv),
      Attack: stats.att,
      Damage: stats.dm,
    },
  },
  abilities,
  description,
  sections: {
    fr: special.fr ? [{ title: "Capacités spéciales", text: special.fr }] : [],
    en: special.en ? [{ title: "Special abilities", text: special.en }] : [],
  },
});

const MONSTERS: CofEntry[] = [
  monster("gobelin", { fr: "Gobelin", en: "Goblin" },
    { fr: "Humanoïde de petite taille, chaotique", en: "Small humanoid, chaotic" }, "1/2",
    { init: 12, def: 12, pv: 6, att: "Dague +2", dm: "1d4+1" },
    { FOR: 8, DEX: 14, CON: 10, INT: 8, SAG: 8, CHA: 6 },
    { fr: "Petit pillard hargneux qui chasse en meute et fuit dès que le rapport de force s'inverse. Le gobelin compte sur le nombre, les pièges grossiers et une cruauté opportuniste.",
      en: "A spiteful little raider that hunts in packs and flees the instant the odds turn. Goblins rely on numbers, crude traps and opportunistic cruelty." },
    { fr: "**Meute.** +1 à l'attaque par allié gobelin adjacent à la même cible (maximum +3).\n\n**Fuite.** Réduit de moitié à 0 PV les gobelins survivants fuient au prochain tour.",
      en: "**Pack.** +1 to attack per adjacent goblin ally engaging the same target (max +3).\n\n**Rout.** When half the group is down, surviving goblins flee on their next turn." },
    { fr: ["Humanoïde", "Petite taille"], en: ["Humanoid", "Small"] }),

  monster("orque", { fr: "Orque", en: "Orc" },
    { fr: "Humanoïde de taille moyenne, belliqueux", en: "Medium humanoid, warlike" }, "2",
    { init: 11, def: 14, pv: 20, att: "Hache d'armes +5", dm: "1d10+3" },
    { FOR: 16, DEX: 12, CON: 15, INT: 8, SAG: 10, CHA: 8 },
    { fr: "Guerrier endurci des clans des collines, entraîné à charger le premier et à ne jamais rompre la ligne tant que le chef tient debout.",
      en: "A hardened warrior of the hill clans, drilled to charge first and hold the line as long as the chieftain still stands." },
    { fr: "**Charge brutale.** S'il se déplace d'au moins 10 m avant d'attaquer, l'orque inflige 1d6 dégâts supplémentaires.\n\n**Rage sanglante.** Sous 5 PV, +2 en attaque et −2 en Défense.",
      en: "**Brutal charge.** If it moves at least 10 m before attacking, the orc deals 1d6 extra damage.\n\n**Blood rage.** Below 5 HP, +2 to attack and −2 to Defence." },
    { fr: ["Humanoïde", "Clan"], en: ["Humanoid", "Clan"] }),

  monster("loup", { fr: "Loup", en: "Wolf" },
    { fr: "Bête de taille moyenne", en: "Medium beast" }, "1",
    { init: 14, def: 13, pv: 12, att: "Morsure +3", dm: "1d6+1" },
    { FOR: 12, DEX: 15, CON: 12, INT: 2, SAG: 12, CHA: 6 },
    { fr: "Prédateur de meute qui isole les traînards, harcèle les flancs et n'engage jamais un adversaire de face lorsqu'il peut mordre son dos.",
      en: "A pack predator that cuts off stragglers, harries the flanks and never engages head-on when it can bite a back." },
    { fr: "**Croc-en-jambe.** Sur une attaque réussie, la cible doit réussir un test de FOR difficulté 12 ou tomber à terre.\n\n**Odorat.** Perception doublée pour pister une proie blessée.",
      en: "**Trip.** On a successful hit, the target must pass a STR check (difficulty 12) or be knocked prone.\n\n**Scent.** Doubled Perception when tracking wounded prey." },
    { fr: ["Bête", "Meute"], en: ["Beast", "Pack"] }),

  monster("squelette", { fr: "Squelette", en: "Skeleton" },
    { fr: "Mort-vivant de taille moyenne", en: "Medium undead" }, "1",
    { init: 10, def: 12, pv: 9, att: "Épée rouillée +3", dm: "1d8" },
    { FOR: 12, DEX: 12, CON: 0, INT: 2, SAG: 8, CHA: 4 },
    { fr: "Ossements assemblés par une volonté nécromantique. Il ne ressent ni douleur ni peur et poursuit son ordre jusqu'à ce que sa structure cède.",
      en: "Bones bound by a necromantic will. It feels neither pain nor fear and pursues its order until its frame collapses." },
    { fr: "**Ossature.** Résistance aux dégâts perforants et tranchants (dégâts réduits de moitié), vulnérabilité aux dégâts contondants (dégâts doublés).\n\n**Mort-vivant.** Immunisé à la peur, au poison, au sommeil et à la charme.",
      en: "**Bone frame.** Resistant to piercing and slashing damage (halved), vulnerable to bludgeoning damage (doubled).\n\n**Undead.** Immune to fear, poison, sleep and charm." },
    { fr: ["Mort-vivant"], en: ["Undead"] }),

  monster("zombie", { fr: "Zombie", en: "Zombie" },
    { fr: "Mort-vivant de taille moyenne", en: "Medium undead" }, "1",
    { init: 6, def: 11, pv: 16, att: "Griffes +3", dm: "1d6+2" },
    { FOR: 14, DEX: 6, CON: 0, INT: 2, SAG: 6, CHA: 4 },
    { fr: "Cadavre relevé, lent mais impossible à décourager. Il absorbe les coups et étreint sa victime jusqu'à l'étouffement.",
      en: "A risen corpse, slow but impossible to discourage. It soaks up blows and clutches its victim until she suffocates." },
    { fr: "**Increvable.** À 0 PV, jet de d6 : sur 6 le zombie se relève avec 1 PV.\n\n**Lent.** Agit toujours en dernier dans le tour.",
      en: "**Unkillable.** At 0 HP, roll d6: on a 6 the zombie rises again with 1 HP.\n\n**Slow.** Always acts last in the round." },
    { fr: ["Mort-vivant"], en: ["Undead"] }),

  monster("araignee-geante", { fr: "Araignée géante", en: "Giant spider" },
    { fr: "Bête de grande taille", en: "Large beast" }, "2",
    { init: 13, def: 14, pv: 18, att: "Morsure venimeuse +4", dm: "1d6+1 + poison" },
    { FOR: 13, DEX: 16, CON: 13, INT: 2, SAG: 11, CHA: 4 },
    { fr: "Chasseuse embusquée des cavernes et des futaies sombres, elle tisse des rideaux de soie pour immobiliser sa proie avant de l'empoisonner.",
      en: "An ambush hunter of caves and dark woods, weaving silk curtains to pin its prey before poisoning it." },
    { fr: "**Poison.** La cible mordue doit réussir un test de CON difficulté 13 ou subir 1d6 dégâts supplémentaires par tour pendant 3 tours.\n\n**Toile.** Action : immobilise une cible à 10 m (test de FOR difficulté 14 pour se libérer).",
      en: "**Poison.** A bitten target must pass a CON check (difficulty 13) or take 1d6 extra damage per round for 3 rounds.\n\n**Web.** Action: immobilises a target within 10 m (STR check, difficulty 14, to break free)." },
    { fr: ["Bête", "Venimeux"], en: ["Beast", "Venomous"] }),

  monster("ogre", { fr: "Ogre", en: "Ogre" },
    { fr: "Géant de grande taille", en: "Large giant" }, "4",
    { init: 9, def: 14, pv: 42, att: "Gourdin +7", dm: "2d6+5" },
    { FOR: 19, DEX: 8, CON: 17, INT: 6, SAG: 8, CHA: 6 },
    { fr: "Colosse affamé qui règne par la seule menace de sa masse. Un ogre ne négocie que lorsqu'on lui propose plus de viande qu'il n'en obtiendrait en frappant.",
      en: "A famished colossus that rules by the sheer threat of its bulk. An ogre only negotiates when offered more meat than it would get by swinging." },
    { fr: "**Balayage.** Une fois par combat, attaque toutes les cibles adjacentes.\n\n**Peau épaisse.** Réduction de 2 aux dégâts physiques.",
      en: "**Sweep.** Once per fight, attacks every adjacent target.\n\n**Thick hide.** Physical damage reduced by 2." },
    { fr: ["Géant"], en: ["Giant"] }),

  monster("troll", { fr: "Troll", en: "Troll" },
    { fr: "Géant de grande taille, régénérant", en: "Large giant, regenerating" }, "6",
    { init: 11, def: 15, pv: 60, att: "Griffes +9 (×2)", dm: "1d10+6" },
    { FOR: 20, DEX: 12, CON: 20, INT: 6, SAG: 9, CHA: 7 },
    { fr: "Prédateur increvable dont la chair se recoud toute seule. Seuls le feu et l'acide interrompent durablement sa régénération.",
      en: "An unkillable predator whose flesh stitches itself back together. Only fire and acid lastingly halt its regeneration." },
    { fr: "**Régénération.** Récupère 5 PV au début de chacun de ses tours, sauf si le dernier dégât subi était du feu ou de l'acide.\n\n**Double attaque.** Deux attaques de griffes par tour.",
      en: "**Regeneration.** Recovers 5 HP at the start of each of its turns, unless the last damage taken was fire or acid.\n\n**Double attack.** Two claw attacks per round." },
    { fr: ["Géant", "Régénération"], en: ["Giant", "Regeneration"] }),

  monster("gargouille", { fr: "Gargouille", en: "Gargoyle" },
    { fr: "Élémentaire de taille moyenne", en: "Medium elemental" }, "3",
    { init: 12, def: 16, pv: 30, att: "Griffes +6", dm: "1d8+3" },
    { FOR: 15, DEX: 14, CON: 16, INT: 6, SAG: 11, CHA: 7 },
    { fr: "Statue animée perchée sur les corniches, indiscernable de la pierre tant qu'elle ne bouge pas. Elle fond sur les intrus par surprise.",
      en: "An animated statue perched on the cornices, indistinguishable from stone until it moves. It drops on intruders by surprise." },
    { fr: "**Immobilité trompeuse.** Test de Perception difficulté 17 pour la repérer avant qu'elle n'attaque.\n\n**Vol.** Déplacement en vol 18 m.\n\n**Corps de pierre.** Réduction de 3 aux dégâts non magiques.",
      en: "**False appearance.** Perception check (difficulty 17) to spot it before it strikes.\n\n**Flight.** Flying speed 18 m.\n\n**Stone body.** Non-magical damage reduced by 3." },
    { fr: ["Élémentaire", "Volant"], en: ["Elemental", "Flying"] }),

  monster("golem-de-pierre", { fr: "Golem de pierre", en: "Stone golem" },
    { fr: "Construct de grande taille", en: "Large construct" }, "8",
    { init: 7, def: 19, pv: 90, att: "Poing +11", dm: "2d10+7" },
    { FOR: 22, DEX: 8, CON: 20, INT: 3, SAG: 11, CHA: 1 },
    { fr: "Sentinelle taillée dans un bloc unique, animée par une formule gravée dans sa poitrine. Elle applique son ordre à la lettre, sans nuance ni pitié.",
      en: "A sentinel carved from a single block, animated by a formula etched on its chest. It applies its order to the letter, without nuance or mercy." },
    { fr: "**Immunité à la magie.** Les sorts de niveau 3 ou moins n'ont aucun effet sur lui.\n\n**Inarrêtable.** Immunisé à la peur, au poison, aux états et à l'épuisement.",
      en: "**Magic immunity.** Spells of level 3 or lower have no effect on it.\n\n**Unstoppable.** Immune to fear, poison, conditions and exhaustion." },
    { fr: ["Construct"], en: ["Construct"] }),

  monster("dragon-rouge-jeune", { fr: "Jeune dragon rouge", en: "Young red dragon" },
    { fr: "Dragon de grande taille, chaotique mauvais", en: "Large dragon, chaotic evil" }, "10",
    { init: 13, def: 20, pv: 130, att: "Morsure +13", dm: "2d10+8" },
    { FOR: 23, DEX: 12, CON: 21, INT: 16, SAG: 13, CHA: 19 },
    { fr: "Jeune tyran ailé qui a déjà bâti son trésor sur la cendre de deux villages. Orgueilleux, il parle avant de brûler — et brûle presque toujours.",
      en: "A young winged tyrant who has already built his hoard on the ashes of two villages. Proud, he speaks before burning — and almost always burns." },
    { fr: "**Souffle de feu.** Cône de 12 m, 6d8 dégâts de feu, test de DEX difficulté 17 pour moitié. Rechargement sur 5-6 (d6).\n\n**Présence terrifiante.** Test de SAG difficulté 16 ou effrayé pendant 1d4 tours.\n\n**Vol.** 24 m.",
      en: "**Fire breath.** 12 m cone, 6d8 fire damage, DEX check (difficulty 17) for half. Recharges on 5-6 (d6).\n\n**Frightful presence.** WIS check (difficulty 16) or frightened for 1d4 rounds.\n\n**Flight.** 24 m." },
    { fr: ["Dragon", "Feu", "Volant"], en: ["Dragon", "Fire", "Flying"] }),

  monster("bandit", { fr: "Bandit de grand chemin", en: "Highway bandit" },
    { fr: "Humanoïde de taille moyenne", en: "Medium humanoid" }, "1",
    { init: 12, def: 13, pv: 11, att: "Épée courte +3 / Arbalète +4", dm: "1d6+1" },
    { FOR: 12, DEX: 14, CON: 12, INT: 10, SAG: 10, CHA: 11 },
    { fr: "Détrousseur organisé qui préfère l'embuscade au duel. Il ne tue que si la bourse résiste plus longtemps que sa patience.",
      en: "An organised robber who prefers ambush to duel. He only kills if the purse resists longer than his patience." },
    { fr: "**Embuscade.** +1d6 dégâts contre une cible surprise.\n\n**Repli.** Peut se désengager sans provoquer d'attaque d'opportunité.",
      en: "**Ambush.** +1d6 damage against a surprised target.\n\n**Withdraw.** May disengage without provoking an opportunity attack." },
    { fr: ["Humanoïde", "Brigand"], en: ["Humanoid", "Brigand"] }),

  monster("garde", { fr: "Garde de la cité", en: "City guard" },
    { fr: "Humanoïde de taille moyenne, loyal", en: "Medium humanoid, lawful" }, "1",
    { init: 11, def: 15, pv: 13, att: "Lance +3", dm: "1d8+1" },
    { FOR: 13, DEX: 12, CON: 13, INT: 10, SAG: 11, CHA: 10 },
    { fr: "Milicien discipliné, formé à contenir une foule plutôt qu'à tuer. En groupe, il forme un mur de boucliers étonnamment efficace.",
      en: "A disciplined militiaman, trained to contain a crowd rather than kill. In numbers, they form a surprisingly effective shield wall." },
    { fr: "**Mur de boucliers.** +2 en Défense tant qu'un autre garde est adjacent.\n\n**Sommation.** Peut tenter une intimidation (CHA difficulté 12) au lieu d'attaquer.",
      en: "**Shield wall.** +2 Defence while another guard is adjacent.\n\n**Warning.** May attempt an intimidation (CHA, difficulty 12) instead of attacking." },
    { fr: ["Humanoïde", "Soldat"], en: ["Humanoid", "Soldier"] }),

  monster("elementaire-de-feu", { fr: "Élémentaire de feu", en: "Fire elemental" },
    { fr: "Élémentaire de grande taille", en: "Large elemental" }, "5",
    { init: 15, def: 16, pv: 48, att: "Contact brûlant +8", dm: "2d6+4 feu" },
    { FOR: 12, DEX: 18, CON: 16, INT: 6, SAG: 10, CHA: 7 },
    { fr: "Tourbillon de flammes vivantes, incapable de rester immobile. Tout ce qu'il touche s'embrase, y compris le sol sur lequel il glisse.",
      en: "A whirl of living flame, unable to stay still. Everything it touches ignites, including the floor it glides over." },
    { fr: "**Embrasement.** La cible touchée prend feu : 1d6 dégâts par tour jusqu'à une action pour éteindre.\n\n**Forme de flamme.** Traverse les espaces étroits ; immunisé au feu, vulnérable à l'eau (dégâts doublés).",
      en: "**Ignite.** A struck target catches fire: 1d6 damage per round until an action is spent to douse it.\n\n**Flame form.** Slips through narrow gaps; immune to fire, vulnerable to water (doubled damage)." },
    { fr: ["Élémentaire", "Feu"], en: ["Elemental", "Fire"] }),

  monster("spectre", { fr: "Spectre", en: "Spectre" },
    { fr: "Mort-vivant incorporel", en: "Incorporeal undead" }, "4",
    { init: 14, def: 15, pv: 26, att: "Toucher glacé +7", dm: "2d6 nécrotique" },
    { FOR: 1, DEX: 16, CON: 11, INT: 10, SAG: 14, CHA: 15 },
    { fr: "Âme retenue par un serment brisé. Elle traverse les murs et draine la chaleur vitale de ceux qui piétinent le lieu de sa mort.",
      en: "A soul held back by a broken oath. It passes through walls and drains the living warmth of those who trespass where it died." },
    { fr: "**Incorporel.** Traverse murs et créatures ; immunisé aux armes non magiques.\n\n**Drain vital.** Le maximum de PV de la cible est réduit de la moitié des dégâts subis jusqu'au prochain repos long.",
      en: "**Incorporeal.** Passes through walls and creatures; immune to non-magical weapons.\n\n**Life drain.** The target's HP maximum drops by half the damage taken until the next long rest." },
    { fr: ["Mort-vivant", "Incorporel"], en: ["Undead", "Incorporeal"] }),

  monster("harpie", { fr: "Harpie", en: "Harpy" },
    { fr: "Monstruosité de taille moyenne", en: "Medium monstrosity" }, "3",
    { init: 13, def: 13, pv: 24, att: "Serres +5", dm: "1d8+2" },
    { FOR: 12, DEX: 15, CON: 12, INT: 7, SAG: 10, CHA: 15 },
    { fr: "Charognarde ailée dont le chant attire les voyageurs jusqu'aux falaises. Elle ne se bat sérieusement que sur une proie déjà brisée.",
      en: "A winged scavenger whose song lures travellers to the cliffs. She only fights in earnest over already-broken prey." },
    { fr: "**Chant envoûtant.** Toutes les créatures à 30 m doivent réussir un test de SAG difficulté 14 ou marcher vers la harpie pendant 1d4 tours.\n\n**Vol.** 18 m.",
      en: "**Luring song.** Every creature within 30 m must pass a WIS check (difficulty 14) or walk toward the harpy for 1d4 rounds.\n\n**Flight.** 18 m." },
    { fr: ["Monstruosité", "Volant"], en: ["Monstrosity", "Flying"] }),

  monster("basilic", { fr: "Basilic", en: "Basilisk" },
    { fr: "Monstruosité de taille moyenne", en: "Medium monstrosity" }, "5",
    { init: 8, def: 16, pv: 52, att: "Morsure +8", dm: "2d6+4" },
    { FOR: 16, DEX: 8, CON: 17, INT: 2, SAG: 8, CHA: 7 },
    { fr: "Reptile lourd dont le regard fige la chair en pierre. Sa tanière est un jardin de statues surprises en pleine fuite.",
      en: "A heavy reptile whose gaze turns flesh to stone. Its lair is a garden of statues caught mid-flight." },
    { fr: "**Regard pétrifiant.** Une créature qui croise son regard fait un test de CON difficulté 16 ; échec : paralysée, second échec au tour suivant : pétrifiée.\n\n**Contre-mesure.** Combattre les yeux fermés impose −4 en attaque mais annule le regard.",
      en: "**Petrifying gaze.** A creature meeting its gaze makes a CON check (difficulty 16); on a failure it is paralysed, on a second failure next round it is petrified.\n\n**Counter.** Fighting with eyes shut imposes −4 to attack but negates the gaze." },
    { fr: ["Monstruosité", "Pétrification"], en: ["Monstrosity", "Petrification"] }),

  monster("kobold", { fr: "Kobold", en: "Kobold" },
    { fr: "Humanoïde de petite taille", en: "Small humanoid" }, "1/4",
    { init: 13, def: 12, pv: 5, att: "Lance +2 / Fronde +3", dm: "1d4" },
    { FOR: 7, DEX: 15, CON: 9, INT: 8, SAG: 7, CHA: 8 },
    { fr: "Mineur reptilien obsédé par les pièges. Individuellement risible, il devient mortel dans un tunnel qu'il a préparé.",
      en: "A trap-obsessed reptilian miner. Laughable alone, deadly in a tunnel he has prepared." },
    { fr: "**Tactique de groupe.** Avantage à l'attaque si un allié est adjacent à la cible.\n\n**Sensible à la lumière.** −2 en attaque en plein soleil.",
      en: "**Pack tactics.** Advantage on attacks if an ally is adjacent to the target.\n\n**Light sensitivity.** −2 to attack in bright sunlight." },
    { fr: ["Humanoïde", "Petite taille"], en: ["Humanoid", "Small"] }),

  monster("mort-vivant-goule", { fr: "Goule", en: "Ghoul" },
    { fr: "Mort-vivant de taille moyenne", en: "Medium undead" }, "2",
    { init: 14, def: 13, pv: 22, att: "Griffes +5", dm: "1d6+2" },
    { FOR: 13, DEX: 15, CON: 10, INT: 7, SAG: 10, CHA: 6 },
    { fr: "Dévoreuse de charogne au geste nerveux, capable de courir à quatre pattes sur les parois d'une crypte.",
      en: "A twitchy carrion-eater able to run on all fours along crypt walls." },
    { fr: "**Paralysie.** Test de CON difficulté 13 sur une griffure réussie, sinon paralysé 1d4 tours.\n\n**Appétit.** Attaque en priorité les créatures à terre ou paralysées.",
      en: "**Paralysis.** CON check (difficulty 13) on a successful claw, otherwise paralysed for 1d4 rounds.\n\n**Appetite.** Prioritises prone or paralysed creatures." },
    { fr: ["Mort-vivant"], en: ["Undead"] }),

  monster("chef-de-guerre-gobelin", { fr: "Chef de guerre gobelin", en: "Goblin warlord" },
    { fr: "Humanoïde de petite taille, meneur", en: "Small humanoid, leader" }, "3",
    { init: 13, def: 15, pv: 28, att: "Cimeterre +6", dm: "1d8+3" },
    { FOR: 12, DEX: 16, CON: 14, INT: 11, SAG: 10, CHA: 13 },
    { fr: "Gobelin plus vieux, plus balafré et bien plus retors que les siens : il gagne ses batailles avant qu'elles ne commencent.",
      en: "An older, more scarred and far more devious goblin: he wins his battles before they begin." },
    { fr: "**Ordre.** Action : un allié à 18 m attaque immédiatement.\n\n**Bouclier vivant.** Peut transférer une attaque subie à un gobelin adjacent.",
      en: "**Command.** Action: an ally within 18 m attacks immediately.\n\n**Living shield.** May transfer a hit taken to an adjacent goblin." },
    { fr: ["Humanoïde", "Meneur"], en: ["Humanoid", "Leader"] }),
];

/* ─────────────────────────────── Sorts ─────────────────────────────── */

const spell = (
  slug: string,
  name: Localized,
  level: number,
  voie: Localized,
  timing: Localized,
  range: Localized,
  duration: Localized,
  save: Localized,
  description: Localized,
): CofEntry => ({
  slug,
  kind: "spells",
  name,
  subtitle: { fr: `Niveau ${level} — ${voie.fr}`, en: `Level ${level} — ${voie.en}` },
  tags: { fr: [`Niv. ${level}`, voie.fr], en: [`Lvl ${level}`, voie.en] },
  meta: {
    fr: { Niveau: String(level), Voie: voie.fr, Incantation: timing.fr, Portée: range.fr, Durée: duration.fr, Sauvegarde: save.fr },
    en: { Level: String(level), Path: voie.en, "Casting time": timing.en, Range: range.en, Duration: duration.en, "Saving throw": save.en },
  },
  description,
  sections: { fr: [], en: [] },
});

const A = { fr: "Action d'attaque", en: "Attack action" };
const AL = { fr: "Action limitée", en: "Limited action" };
const NONE = { fr: "Aucune", en: "None" };
const INSTANT = { fr: "Instantanée", en: "Instantaneous" };

const SPELLS: CofEntry[] = [
  spell("trait-magique", { fr: "Trait magique", en: "Magic bolt" }, 1,
    { fr: "Voie de la magie élémentaire", en: "Path of elemental magic" }, A,
    { fr: "30 m", en: "30 m" }, INSTANT, NONE,
    { fr: "Un dard de force pure jaillit de la main du lanceur et frappe automatiquement une cible visible : 1d6 + mod. d'INT dégâts. Le trait ignore les couverts partiels mais pas les abris complets.",
      en: "A dart of pure force leaps from the caster's hand and automatically strikes a visible target: 1d6 + INT mod damage. The bolt ignores partial cover but not full cover." }),

  spell("boule-de-feu", { fr: "Boule de feu", en: "Fireball" }, 3,
    { fr: "Voie du feu", en: "Path of fire" }, A,
    { fr: "45 m", en: "45 m" }, INSTANT,
    { fr: "DEX difficulté 10 + niveau du lanceur (dégâts réduits de moitié)", en: "DEX vs difficulty 10 + caster level (half damage)" },
    { fr: "Une bille incandescente file jusqu'au point désigné et détone en une sphère de 6 m de rayon : 1d6 dégâts de feu par niveau du lanceur (maximum 10d6). Les matières inflammables non portées s'enflamment.",
      en: "A glowing bead streaks to the chosen point and detonates in a 6 m radius sphere: 1d6 fire damage per caster level (max 10d6). Unattended flammable material catches fire." }),

  spell("soin-des-blessures", { fr: "Soin des blessures", en: "Cure wounds" }, 1,
    { fr: "Voie du soin", en: "Path of healing" }, A,
    { fr: "Contact", en: "Touch" }, INSTANT, NONE,
    { fr: "Le lanceur referme chairs et fractures d'un allié touché : celui-ci récupère 1d8 + mod. de SAG points de vie. Sans effet sur les morts-vivants et les constructs.",
      en: "The caster knits flesh and bone on a touched ally, restoring 1d8 + WIS mod hit points. No effect on undead and constructs." }),

  spell("bouclier-de-force", { fr: "Bouclier de force", en: "Force shield" }, 1,
    { fr: "Voie de la protection", en: "Path of protection" }, AL,
    { fr: "Personnelle", en: "Self" }, { fr: "10 minutes", en: "10 minutes" }, NONE,
    { fr: "Un disque translucide accompagne le bras du lanceur : +4 en Défense et immunité au trait magique tant que la concentration tient.",
      en: "A translucent disc follows the caster's arm: +4 Defence and immunity to magic bolt while concentration holds." }),

  spell("lumiere", { fr: "Lumière", en: "Light" }, 0,
    { fr: "Voie de la magie mineure", en: "Path of minor magic" }, AL,
    { fr: "Contact", en: "Touch" }, { fr: "1 heure", en: "1 hour" }, NONE,
    { fr: "Un objet touché émet une lumière vive dans un rayon de 6 m et une pénombre sur 6 m de plus. Un second lancer éteint la lumière.",
      en: "A touched object sheds bright light in a 6 m radius and dim light for 6 m beyond. Casting it again snuffs the light." }),

  spell("detection-de-la-magie", { fr: "Détection de la magie", en: "Detect magic" }, 1,
    { fr: "Voie de la connaissance", en: "Path of knowledge" }, AL,
    { fr: "Personnelle (rayon 9 m)", en: "Self (9 m radius)" }, { fr: "10 minutes", en: "10 minutes" }, NONE,
    { fr: "Le lanceur perçoit les auras magiques à travers les cloisons fines. Un tour de concentration sur une aura révèle sa voie d'origine.",
      en: "The caster senses magical auras through thin partitions. One round of concentration on an aura reveals its originating path." }),

  spell("terreur", { fr: "Terreur", en: "Terror" }, 2,
    { fr: "Voie de l'ombre", en: "Path of shadow" }, A,
    { fr: "18 m", en: "18 m" }, { fr: "1d6 tours", en: "1d6 rounds" },
    { fr: "SAG difficulté 10 + niveau du lanceur", en: "WIS vs difficulty 10 + caster level" },
    { fr: "Une vision d'horreur intime submerge une cible : en cas d'échec, elle fuit à sa vitesse maximale et ne peut ni attaquer ni lancer de sort.",
      en: "A vision of intimate horror floods a target: on a failure it flees at full speed and can neither attack nor cast." }),

  spell("invisibilite", { fr: "Invisibilité", en: "Invisibility" }, 3,
    { fr: "Voie de l'illusion", en: "Path of illusion" }, AL,
    { fr: "Contact", en: "Touch" }, { fr: "10 minutes", en: "10 minutes" }, NONE,
    { fr: "La cible devient invisible, ainsi que ce qu'elle porte. L'effet prend fin dès qu'elle attaque ou lance un sort offensif.",
      en: "The target and everything it carries turn invisible. The effect ends as soon as it attacks or casts an offensive spell." }),

  spell("mur-de-pierre", { fr: "Mur de pierre", en: "Wall of stone" }, 4,
    { fr: "Voie de la terre", en: "Path of earth" }, A,
    { fr: "30 m", en: "30 m" }, { fr: "1 heure", en: "1 hour" }, NONE,
    { fr: "Une paroi de granit de 9 m de long, 3 m de haut et 30 cm d'épaisseur surgit du sol. Elle possède 30 PV par section de 3 m et bloque la ligne de vue.",
      en: "A granite wall 9 m long, 3 m high and 30 cm thick erupts from the ground. Each 3 m section has 30 HP and blocks line of sight." }),

  spell("eclair", { fr: "Éclair", en: "Lightning bolt" }, 3,
    { fr: "Voie de l'air", en: "Path of air" }, A,
    { fr: "Ligne de 30 m", en: "30 m line" }, INSTANT,
    { fr: "DEX difficulté 10 + niveau du lanceur (dégâts réduits de moitié)", en: "DEX vs difficulty 10 + caster level (half damage)" },
    { fr: "Un arc électrique traverse tout ce qui se trouve sur une ligne de 30 m : 1d6 dégâts électriques par niveau du lanceur (maximum 10d6). L'éclair ricoche une fois sur une surface métallique.",
      en: "An electric arc crosses everything on a 30 m line: 1d6 lightning damage per caster level (max 10d6). The bolt ricochets once off a metal surface." }),

  spell("benediction", { fr: "Bénédiction", en: "Blessing" }, 2,
    { fr: "Voie de la foi", en: "Path of faith" }, AL,
    { fr: "18 m", en: "18 m" }, { fr: "1 minute", en: "1 minute" }, NONE,
    { fr: "Jusqu'à trois alliés visibles ajoutent +1d4 à leurs jets d'attaque et à leurs tests de résistance à la peur tant que le lanceur se concentre.",
      en: "Up to three visible allies add +1d4 to their attack rolls and fear resistance checks while the caster concentrates." }),

  spell("marche-sur-leau", { fr: "Marche sur l'eau", en: "Water walk" }, 2,
    { fr: "Voie de l'eau", en: "Path of water" }, AL,
    { fr: "Contact", en: "Touch" }, { fr: "1 heure", en: "1 hour" }, NONE,
    { fr: "Jusqu'à quatre créatures touchées marchent sur toute surface liquide comme sur un sol ferme, y compris la lave figée en surface (sans protection contre la chaleur).",
      en: "Up to four touched creatures walk on any liquid surface as on solid ground, including surface-cooled lava (with no protection from the heat)." }),

  spell("charme", { fr: "Charme-personne", en: "Charm person" }, 2,
    { fr: "Voie de l'enchantement", en: "Path of enchantment" }, A,
    { fr: "9 m", en: "9 m" }, { fr: "1 heure", en: "1 hour" },
    { fr: "SAG difficulté 10 + niveau du lanceur", en: "WIS vs difficulty 10 + caster level" },
    { fr: "La cible considère le lanceur comme un allié de confiance. Elle ne lui obéit pas aveuglément et sort du charme si on lui nuit.",
      en: "The target regards the caster as a trusted ally. It does not blindly obey and the charm breaks if it is harmed." }),

  spell("ranimation", { fr: "Ranimation", en: "Revive" }, 5,
    { fr: "Voie du soin", en: "Path of healing" }, { fr: "1 minute", en: "1 minute" },
    { fr: "Contact", en: "Touch" }, INSTANT, NONE,
    { fr: "Ramène à la vie une créature morte depuis moins d'une minute, avec 1 PV. Le lanceur subit un niveau de fatigue permanent jusqu'au prochain repos long.",
      en: "Returns to life a creature dead for less than a minute, at 1 HP. The caster suffers a level of fatigue until the next long rest." }),

  spell("nuee-dinsectes", { fr: "Nuée d'insectes", en: "Insect swarm" }, 3,
    { fr: "Voie de la nature", en: "Path of nature" }, A,
    { fr: "24 m", en: "24 m" }, { fr: "1d6 tours", en: "1d6 rounds" },
    { fr: "CON difficulté 10 + niveau du lanceur", en: "CON vs difficulty 10 + caster level" },
    { fr: "Une nuée bourdonnante emplit une sphère de 6 m : 1d6 dégâts par tour, visibilité réduite à 1,5 m et concentration impossible à l'intérieur.",
      en: "A buzzing swarm fills a 6 m sphere: 1d6 damage per round, visibility reduced to 1.5 m and concentration impossible inside." }),

  spell("vol", { fr: "Vol", en: "Fly" }, 4,
    { fr: "Voie de l'air", en: "Path of air" }, AL,
    { fr: "Contact", en: "Touch" }, { fr: "10 minutes", en: "10 minutes" }, NONE,
    { fr: "La cible se déplace en vol à 18 m par tour. Si le sort prend fin en altitude, elle descend de 18 m par tour pendant 1 tour avant de chuter.",
      en: "The target gains a flying speed of 18 m. If the spell ends aloft, it descends 18 m per round for one round before falling." }),

  spell("dissipation", { fr: "Dissipation de la magie", en: "Dispel magic" }, 3,
    { fr: "Voie de la connaissance", en: "Path of knowledge" }, A,
    { fr: "36 m", en: "36 m" }, INSTANT, NONE,
    { fr: "Met fin automatiquement à un effet magique de niveau égal ou inférieur à celui du lanceur ; au-delà, test d'INT difficulté 10 + niveau du sort ciblé.",
      en: "Automatically ends a magical effect of level equal to or below the caster's; beyond that, an INT check vs difficulty 10 + the target spell's level." }),

  spell("armure-de-mage", { fr: "Armure du mage", en: "Mage armour" }, 1,
    { fr: "Voie de la protection", en: "Path of protection" }, AL,
    { fr: "Contact", en: "Touch" }, { fr: "8 heures", en: "8 hours" }, NONE,
    { fr: "Une pellicule de force enveloppe une cible sans armure : sa Défense devient 13 + mod. de DEX. Le sort se dissipe si elle enfile une armure.",
      en: "A film of force wraps an unarmoured target: its Defence becomes 13 + DEX mod. The spell ends if it dons armour." }),

  spell("main-du-sorcier", { fr: "Main du sorcier", en: "Sorcerer's hand" }, 0,
    { fr: "Voie de la magie mineure", en: "Path of minor magic" }, AL,
    { fr: "9 m", en: "9 m" }, { fr: "1 minute", en: "1 minute" }, NONE,
    { fr: "Une main spectrale manipule à distance un objet de moins de 5 kg : ouvrir une porte, tirer un levier, fouiller une bourse. Elle ne peut pas attaquer.",
      en: "A spectral hand remotely manipulates an object under 5 kg: opening a door, pulling a lever, rifling a purse. It cannot attack." }),

  spell("appel-de-la-foudre", { fr: "Appel de la foudre", en: "Call lightning" }, 5,
    { fr: "Voie de la nature", en: "Path of nature" }, A,
    { fr: "90 m", en: "90 m" }, { fr: "10 minutes", en: "10 minutes" },
    { fr: "DEX difficulté 10 + niveau du lanceur (dégâts réduits de moitié)", en: "DEX vs difficulty 10 + caster level (half damage)" },
    { fr: "Un nuage d'orage se forme au-dessus du champ de bataille. Chaque tour, le lanceur peut frapper un point visible : 4d10 dégâts électriques dans un rayon de 1,5 m (5d10 en cas d'orage réel).",
      en: "A storm cloud forms over the battlefield. Each round the caster may strike a visible point: 4d10 lightning damage in a 1.5 m radius (5d10 during a real storm)." }),
];

/* ────────────────────────────── Objets ─────────────────────────────── */

const item = (
  slug: string,
  name: Localized,
  type: Localized,
  rarity: Localized,
  price: string,
  attunement: boolean,
  description: Localized,
): CofEntry => ({
  slug,
  kind: "items",
  name,
  subtitle: { fr: `${type.fr}, ${rarity.fr}`, en: `${type.en}, ${rarity.en}` },
  tags: {
    fr: [type.fr, rarity.fr, ...(attunement ? ["Harmonisation"] : [])],
    en: [type.en, rarity.en, ...(attunement ? ["Attunement"] : [])],
  },
  meta: {
    fr: { Type: type.fr, Rareté: rarity.fr, Prix: price, Harmonisation: attunement ? "Oui" : "Non" },
    en: { Type: type.en, Rarity: rarity.en, Price: price, Attunement: attunement ? "Yes" : "No" },
  },
  description,
  sections: { fr: [], en: [] },
});

const R_COMMON = { fr: "commun", en: "common" };
const R_UNCOMMON = { fr: "peu commun", en: "uncommon" };
const R_RARE = { fr: "rare", en: "rare" };
const R_VERY_RARE = { fr: "très rare", en: "very rare" };
const T_WEAPON = { fr: "Arme", en: "Weapon" };
const T_ARMOR = { fr: "Armure", en: "Armour" };
const T_WONDROUS = { fr: "Objet merveilleux", en: "Wondrous item" };
const T_POTION = { fr: "Potion", en: "Potion" };
const T_RING = { fr: "Anneau", en: "Ring" };

const ITEMS: CofEntry[] = [
  item("epee-longue", { fr: "Épée longue", en: "Longsword" }, T_WEAPON, R_COMMON, "15 po", false,
    { fr: "Arme de guerre à une main, 1d8 dégâts tranchants. Peut être maniée à deux mains pour 1d10. Standard des compagnies franches et des gardes de caravane.",
      en: "One-handed martial weapon, 1d8 slashing. Can be wielded two-handed for 1d10. The standard of free companies and caravan guards." }),

  item("arc-long", { fr: "Arc long", en: "Longbow" }, T_WEAPON, R_COMMON, "50 po", false,
    { fr: "Arme à distance, 1d8 dégâts perforants, portée 45/180 m. Nécessite une FOR de 12 minimum pour être bandé sans malus.",
      en: "Ranged weapon, 1d8 piercing, range 45/180 m. Requires STR 12 to draw without penalty." }),

  item("cotte-de-mailles", { fr: "Cotte de mailles", en: "Chain mail" }, T_ARMOR, R_COMMON, "75 po", false,
    { fr: "Armure lourde : Défense 16, −2 aux tests de DEX discrets. Se répare au marteau et à la pince, à peu près n'importe où.",
      en: "Heavy armour: Defence 16, −2 to stealthy DEX checks. Repairable with hammer and pliers, just about anywhere." }),

  item("epee-de-flamme", { fr: "Épée de flamme", en: "Flame sword" }, T_WEAPON, R_RARE, "2 500 po", true,
    { fr: "Une lame qui s'embrase sur commande : +1 à l'attaque et aux dégâts, plus 1d6 dégâts de feu. Éclaire comme une torche et n'est jamais entravée par le froid.",
      en: "A blade that ignites on command: +1 to attack and damage, plus 1d6 fire damage. Sheds torchlight and is never hampered by cold." }),

  item("potion-de-soin", { fr: "Potion de soins", en: "Healing potion" }, T_POTION, R_COMMON, "50 po", false,
    { fr: "Rend 2d4+2 points de vie en une action. Goût de fer et de miel ; l'effet est immédiat mais ne réduit pas la fatigue.",
      en: "Restores 2d4+2 hit points as an action. Tastes of iron and honey; the effect is immediate but does not reduce fatigue." }),

  item("potion-de-force-de-geant", { fr: "Potion de force de géant", en: "Potion of giant strength" }, T_POTION, R_UNCOMMON, "300 po", false,
    { fr: "Pendant 10 minutes, la FOR du buveur passe à 19 si elle était inférieure. Les crampes qui suivent imposent −1 en FOR pendant une heure.",
      en: "For 10 minutes the drinker's STR becomes 19 if it was lower. The cramps that follow impose −1 STR for an hour." }),

  item("cape-elfique", { fr: "Cape elfique", en: "Elven cloak" }, T_WONDROUS, R_UNCOMMON, "800 po", true,
    { fr: "Sa trame prend la teinte de l'environnement : +5 aux tests de discrétion et les créatures subissent −2 pour repérer le porteur immobile.",
      en: "Its weave takes the colour of the surroundings: +5 to stealth checks, and creatures take −2 to spot a motionless wearer." }),

  item("bottes-de-rapidite", { fr: "Bottes de rapidité", en: "Boots of speed" }, T_WONDROUS, R_RARE, "1 800 po", true,
    { fr: "Une action pour claquer les talons : la vitesse de déplacement double pendant 10 minutes, une fois par jour. Le sol paraît glisser sous les pieds.",
      en: "An action to click the heels: movement speed doubles for 10 minutes, once per day. The ground seems to slide underfoot." }),

  item("anneau-de-protection", { fr: "Anneau de protection", en: "Ring of protection" }, T_RING, R_RARE, "2 000 po", true,
    { fr: "+1 en Défense et +1 à tous les tests de résistance. Un mince halo bleuté trahit son activation lorsqu'il absorbe un coup.",
      en: "+1 Defence and +1 to all resistance checks. A thin blue halo betrays its activation when it soaks a blow." }),

  item("amulette-de-sante", { fr: "Amulette de santé", en: "Amulet of health" }, T_WONDROUS, R_RARE, "2 200 po", true,
    { fr: "La CON du porteur passe à 17 si elle était inférieure, et il devient insensible aux maladies non magiques.",
      en: "The wearer's CON becomes 17 if it was lower, and they become immune to non-magical disease." }),

  item("baton-de-mage", { fr: "Bâton du mage", en: "Mage staff" }, T_WEAPON, R_VERY_RARE, "6 000 po", true,
    { fr: "Arme de contact 1d6, mais surtout +1 à la difficulté des sorts lancés par le porteur et 10 charges pour relancer un sort de niveau 3 ou moins.",
      en: "A 1d6 melee weapon, but above all +1 to the difficulty of spells cast by the bearer and 10 charges to recast a spell of level 3 or lower." }),

  item("bouclier-du-gardien", { fr: "Bouclier du gardien", en: "Guardian shield" }, T_ARMOR, R_UNCOMMON, "900 po", true,
    { fr: "+2 en Défense au lieu de +1, et une fois par combat le porteur peut donner ce bonus à un allié adjacent jusqu'à la fin du tour.",
      en: "+2 Defence instead of +1, and once per fight the bearer may grant that bonus to an adjacent ally until the end of the round." }),

  item("corde-denchevetrement", { fr: "Corde d'enchevêtrement", en: "Rope of entanglement" }, T_WONDROUS, R_RARE, "1 500 po", false,
    { fr: "Sur commande, la corde bondit sur une créature à 6 m : test de FOR difficulté 15 ou immobilisée. Elle possède 20 PV et se répare seule d'un jour à l'autre.",
      en: "On command the rope leaps at a creature within 6 m: STR check (difficulty 15) or restrained. It has 20 HP and mends itself overnight." }),

  item("lanterne-sourde", { fr: "Lanterne sourde", en: "Hooded lantern" }, T_WONDROUS, R_COMMON, "5 po", false,
    { fr: "Éclaire vivement sur 9 m et en pénombre sur 9 m de plus. Le volet permet de réduire le faisceau à un mince cône sans éteindre la flamme.",
      en: "Bright light for 9 m and dim light 9 m beyond. The hood narrows the beam to a thin cone without snuffing the flame." }),

  item("sac-sans-fond", { fr: "Sac sans fond", en: "Bottomless sack" }, T_WONDROUS, R_RARE, "2 000 po", false,
    { fr: "Contient jusqu'à 250 kg dans un espace replié, pour un poids apparent de 7 kg. Retourner le sac déverse tout son contenu au sol.",
      en: "Holds up to 250 kg in a folded space, for an apparent weight of 7 kg. Turning it inside out dumps everything on the ground." }),

  item("pierre-de-vision", { fr: "Pierre de vision nocturne", en: "Darkvision stone" }, T_WONDROUS, R_UNCOMMON, "700 po", true,
    { fr: "Un galet poli qui, serré dans la paume, accorde la vision dans le noir sur 18 m et supprime les malus de combat en pénombre.",
      en: "A polished pebble that, clutched in the palm, grants darkvision out to 18 m and removes dim-light combat penalties." }),

  item("armure-de-cuir-cloute", { fr: "Armure de cuir clouté", en: "Studded leather" }, T_ARMOR, R_COMMON, "45 po", false,
    { fr: "Armure légère : Défense 12 + mod. de DEX, aucun malus de discrétion. Le compromis favori des éclaireurs et des voleurs.",
      en: "Light armour: Defence 12 + DEX mod, no stealth penalty. The favourite compromise of scouts and thieves." }),

  item("fiole-deau-benite", { fr: "Fiole d'eau bénite", en: "Vial of holy water" }, T_POTION, R_COMMON, "25 po", false,
    { fr: "Jetée comme une arme de lancer sur un mort-vivant ou un démon : 2d6 dégâts radiants. Sans effet sur les vivants, hormis une chemise mouillée.",
      en: "Thrown as a ranged weapon at an undead or fiend: 2d6 radiant damage. No effect on the living, beyond a wet shirt." }),

  item("dague-de-lombre", { fr: "Dague de l'ombre", en: "Shadow dagger" }, T_WEAPON, R_RARE, "1 700 po", true,
    { fr: "1d4+1 dégâts, et +2d6 contre une cible qui n'a pas encore agi dans le combat. En pénombre, la lame ne renvoie aucun reflet.",
      en: "1d4+1 damage, and +2d6 against a target that has not yet acted in the fight. In dim light the blade throws no reflection." }),

  item("heaume-de-comprehension", { fr: "Heaume de compréhension", en: "Helm of comprehension" }, T_WONDROUS, R_VERY_RARE, "5 000 po", true,
    { fr: "Le porteur comprend toute langue parlée et lit toute écriture non chiffrée. Il ne peut pas pour autant parler ces langues.",
      en: "The wearer understands any spoken language and reads any non-encrypted script. They still cannot speak those languages." }),
];

export const COF_ENTRIES: CofEntry[] = [...MONSTERS, ...SPELLS, ...ITEMS];

export const COF_SOURCE: Record<Lang, string> = {
  fr: "Compendium COF — Aetheria VTT (contenu original, compatible Chroniques Oubliées Fantasy)",
  en: "COF compendium — Aetheria VTT (original content, Chroniques Oubliées Fantasy compatible)",
};

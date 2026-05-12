import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Copy, Swords, User, Users, Scroll } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ── Banques de noms ─────────────────────────────────────────────────────────

const FIRST_NAMES_FANTASY = [
  "Aldric","Seraphine","Theron","Lyra","Daxus","Mireille","Zephyr","Caelindra",
  "Orin","Vesna","Faelorn","Kessara","Bravik","Nimue","Gorvath","Elara",
  "Rhogar","Sylvaine","Dorvaan","Thessaly","Varek","Isolde","Caelan","Morwenna",
  "Torvin","Aelindra","Fenwick","Soraya","Daximur","Lorelei","Harric","Zara",
  "Osric","Callista","Baldric","Elowen","Grimmar","Naeva","Stelvar","Rhiannon",
];
const FIRST_NAMES_DARK = [
  "Mordek","Vexara","Shadrach","Noctris","Malachar","Vressa","Dusk","Ravane",
  "Grimholt","Zareth","Sylthis","Darkova","Hexon","Morvaine","Sorak","Velthra",
];
const FIRST_NAMES_ELVISH = [
  "Aelindra","Caladwen","Thalindra","Eresiel","Galadorn","Nimrodel","Calaeron",
  "Síoriel","Aerindel","Valaniel","Loraviel","Eryndir","Celiwen","Faeniel",
];
const LAST_NAMES = [
  "Cendredargent","Flambenoire","Ombrelame","Voilefer","Épinedargent","Rochebrûlée",
  "Ventvif","Lunerouge","Aileroc","Pierreciel","Sangueverre","Tonneclair",
  "Ferbleu","Ombrevive","Soleildor","Nuitpâle","Cendrefolle","Éperonet",
  "Mortfalaise","Vivrecroc","Éclairval","Froidciel","Seuilblanc","Morteépine",
];

const PNJ_ROLES = [
  "Tavernier","Forgeron","Garde","Marchand","Paysan","Sorcier","Voleur","Prêtre",
  "Barde","Chasseur","Nobliau","Messager","Alchimiste","Médecin","Instructeur",
  "Prisonnier","Espion","Mendiant","Marin","Capitaine",
];

const PNJ_TRAITS = [
  "méfiant", "jovial", "morose", "bavard", "secret", "cupide",
  "généreux", "nerveux", "courageux", "lâche", "obsessionnel", "distrait",
  "mélancolique", "arrogant", "humble", "zélé", "fatigué", "mystérieux",
];

const PNJ_MOTIVATIONS = [
  "cherche à venger un proche", "veut s'enrichir coûte que coûte",
  "garde un terrible secret", "fuit quelque chose de sombre",
  "est amoureux en secret", "essaie de rembourser une dette",
  "cherche la rédemption", "veut retrouver sa liberté",
  "protège sa famille à tout prix", "sert un maître invisible",
  "est atteint d'une malédiction", "recherche un objet perdu",
];

const PNJ_PARTICULARITES = [
  "une cicatrice en forme de rune", "un tic nerveux de l'œil",
  "parle toujours à voix basse", "porte toujours des gants",
  "ne supporte pas les chiens", "collectionne les pièces étrangères",
  "bégaie sous stress", "a une perruche apprivoisée",
  "gratte constamment sa barbe", "ne mange jamais en public",
  "est toujours en retard", "connaît tout le monde en ville",
];

// ── Générateur de rencontres ───────────────────────────────────────────────

interface EncounterType {
  label: string;
  difficulty: "Facile" | "Moyen" | "Difficile" | "Mortel";
  description: string;
}

const ENCOUNTER_TEMPLATES: Record<string, EncounterType[]> = {
  route: [
    { label: "Bandits embusqués", difficulty: "Moyen", description: "1d4+2 bandits masqués attaquent depuis les fourrés sur la route." },
    { label: "Chariot renversé", difficulty: "Facile", description: "Un marchand coincé sous son chariot, escorté d'un trésor..." },
    { label: "Pèlerins mystérieux", difficulty: "Facile", description: "Un groupe de pèlerins au comportement étrange cherche un passage." },
    { label: "Patrouille corrompue", difficulty: "Difficile", description: "Des gardes exigent un 'péage' illégal, prêts à user de violence." },
    { label: "Fugitif pourchassé", difficulty: "Moyen", description: "Un homme en fuite demande de l'aide, poursuivi par des soldats." },
  ],
  forêt: [
    { label: "Loups affamés", difficulty: "Facile", description: "Une meute de 2d4 loups acculée par l'hiver attaque les voyageurs." },
    { label: "Esprit de la forêt", difficulty: "Difficile", description: "Un dryade furieuse protège ses arbres d'abatteurs récents." },
    { label: "Piège de chasseur", difficulty: "Moyen", description: "Un piège magique tente les aventuriers vers une clairière maudite." },
    { label: "Gobelins pillards", difficulty: "Moyen", description: "1d6+3 gobelins ont dressé un camp et pillent les voyageurs." },
    { label: "Bête gigantesque", difficulty: "Mortel", description: "Un ours géant ou un loup des ombres rôde dans la zone." },
  ],
  ville: [
    { label: "Pickpocket de guilde", difficulty: "Facile", description: "Un jeune voleur tente de subtiliser quelque chose d'un personnage." },
    { label: "Rixe de taverne", difficulty: "Moyen", description: "Une bagarre éclate, entraînant les joueurs malgré eux." },
    { label: "Meurtre mystérieux", difficulty: "Difficile", description: "Un corps est découvert, et les gardes suspecte les aventuriers." },
    { label: "Dignitaire menacé", difficulty: "Difficile", description: "Un noble reçoit une lettre de menace et cherche des protecteurs discrets." },
    { label: "Marchand d'artefacts", difficulty: "Facile", description: "Un colporteur propose des objets suspects à prix cassé." },
  ],
  donjon: [
    { label: "Garde mort-vivant", difficulty: "Moyen", description: "1d4 squelettes ou zombies patrouillent dans un couloir sans fin." },
    { label: "Salle piégée", difficulty: "Difficile", description: "Une salle avec sol en damier et flèches automatiques. Ingéniosité requise." },
    { label: "Monstre gardien", difficulty: "Mortel", description: "Un golem ou un géant du feu veille sur une porte scellée." },
    { label: "Cultistes en rituel", difficulty: "Difficile", description: "Des cultistes achèvent un rituel d'invocation. Les arrêter à temps ?" },
    { label: "Prisonnier oublié", difficulty: "Facile", description: "Un survivant affaibli connaît peut-être la disposition des lieux." },
  ],
};

// ── Composant ──────────────────────────────────────────────────────────────

interface GeneratedPNJ {
  firstName: string;
  lastName: string;
  role: string;
  trait: string;
  motivation: string;
  particularite: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePNJ(style: string): GeneratedPNJ {
  let firstNames = FIRST_NAMES_FANTASY;
  if (style === "sombre") firstNames = FIRST_NAMES_DARK;
  if (style === "elfique") firstNames = FIRST_NAMES_ELVISH;
  return {
    firstName: pickRandom(firstNames),
    lastName: pickRandom(LAST_NAMES),
    role: pickRandom(PNJ_ROLES),
    trait: pickRandom(PNJ_TRAITS),
    motivation: pickRandom(PNJ_MOTIVATIONS),
    particularite: pickRandom(PNJ_PARTICULARITES),
  };
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Facile: "text-green-400 border-green-400/40 bg-green-400/10",
  Moyen: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  Difficile: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  Mortel: "text-red-400 border-red-400/40 bg-red-400/10",
};

export default function GMTools() {
  const [nameStyle, setNameStyle] = useState("fantastique");
  const [pnjs, setPnjs] = useState<GeneratedPNJ[]>([]);
  const [encounterTerrain, setEncounterTerrain] = useState("forêt");
  const [encounter, setEncounter] = useState<EncounterType | null>(null);
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  const generateBatch = (n = 1) => {
    const newPnjs = Array.from({ length: n }, () => generatePNJ(nameStyle));
    setPnjs(newPnjs);
  };

  const generateNames = (n = 8) => {
    const firstNames = nameStyle === "sombre" ? FIRST_NAMES_DARK
      : nameStyle === "elfique" ? FIRST_NAMES_ELVISH
      : FIRST_NAMES_FANTASY;
    const names = Array.from({ length: n }, () => `${pickRandom(firstNames)} ${pickRandom(LAST_NAMES)}`);
    setGeneratedNames(names);
  };

  const generateEncounter = () => {
    const list = ENCOUNTER_TEMPLATES[encounterTerrain] || ENCOUNTER_TEMPLATES["forêt"];
    setEncounter(pickRandom(list));
  };

  const copyPNJ = (pnj: GeneratedPNJ) => {
    const text = `**${pnj.firstName} ${pnj.lastName}** — ${pnj.role}\nTraits : ${pnj.trait}\nMotivation : ${pnj.motivation}\nParticularité : ${pnj.particularite}`;
    navigator.clipboard.writeText(text);
    toast({ title: "PNJ copié !", description: "Collez-le dans le chat ou vos notes." });
  };

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-6 max-w-2xl pr-2">

        {/* ══ GÉNÉRATEUR DE NOMS ══════════════════════════════════════════════ */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scroll className="h-4 w-4 text-primary" />
              Générateur de noms
            </CardTitle>
            <CardDescription>Générez rapidement des noms pour PNJ, villes, factions…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="shrink-0">Style</Label>
              <Select value={nameStyle} onValueChange={setNameStyle}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fantastique">Fantastique</SelectItem>
                  <SelectItem value="elfique">Elfique</SelectItem>
                  <SelectItem value="sombre">Sombre / Sinistre</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => generateNames(8)} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Générer 8 noms
              </Button>
            </div>
            {generatedNames.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {generatedNames.map((name, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-1.5">
                    <span className="text-sm font-medium">{name}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(name); toast({ title: "Nom copié !" }); }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══ GÉNÉRATEUR DE PNJ ═══════════════════════════════════════════════ */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Générateur de PNJ
            </CardTitle>
            <CardDescription>Créez des personnages non-joueurs complets en un clic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={nameStyle} onValueChange={setNameStyle}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Style de noms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fantastique">Fantastique</SelectItem>
                  <SelectItem value="elfique">Elfique</SelectItem>
                  <SelectItem value="sombre">Sombre / Sinistre</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => generateBatch(1)} className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                1 PNJ
              </Button>
              <Button variant="outline" size="sm" onClick={() => generateBatch(3)} className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                3 PNJ
              </Button>
            </div>

            {pnjs.length > 0 && (
              <div className="space-y-3">
                {pnjs.map((pnj, i) => (
                  <div key={i} className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{pnj.firstName} {pnj.lastName}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{pnj.role}</Badge>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" onClick={() => copyPNJ(pnj)}>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copier
                      </Button>
                    </div>
                    <Separator className="bg-border/50" />
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground text-xs font-medium">Trait :</span> <span className="capitalize">{pnj.trait}</span></p>
                      <p><span className="text-muted-foreground text-xs font-medium">Motivation :</span> {pnj.motivation}</p>
                      <p><span className="text-muted-foreground text-xs font-medium">Particularité :</span> {pnj.particularite}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══ GÉNÉRATEUR DE RENCONTRES ════════════════════════════════════════ */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords className="h-4 w-4 text-primary" />
              Générateur de rencontres
            </CardTitle>
            <CardDescription>Tirez une rencontre aléatoire adaptée au terrain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="shrink-0">Terrain</Label>
              <Select value={encounterTerrain} onValueChange={setEncounterTerrain}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="route">Route</SelectItem>
                  <SelectItem value="forêt">Forêt</SelectItem>
                  <SelectItem value="ville">Ville</SelectItem>
                  <SelectItem value="donjon">Donjon</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="gold" size="sm" onClick={generateEncounter} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Tirer
              </Button>
            </div>

            {encounter && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{encounter.label}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border ${DIFFICULTY_COLOR[encounter.difficulty]}`}>
                      {encounter.difficulty}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`**${encounter.label}** (${encounter.difficulty})\n${encounter.description}`);
                        toast({ title: "Rencontre copiée !" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{encounter.description}</p>
              </div>
            )}

            {/* Liste toutes les rencontres du terrain */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors select-none">
                Voir toutes les rencontres ({encounterTerrain})
              </summary>
              <div className="mt-2 space-y-2">
                {(ENCOUNTER_TEMPLATES[encounterTerrain] || []).map((enc, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border shrink-0 mt-0.5 ${DIFFICULTY_COLOR[enc.difficulty]}`}>
                      {enc.difficulty}
                    </span>
                    <div>
                      <p className="font-medium">{enc.label}</p>
                      <p className="text-xs text-muted-foreground">{enc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>

      </div>
    </ScrollArea>
  );
}

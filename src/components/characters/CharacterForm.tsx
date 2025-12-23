import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Save, Sword, Shield, Sparkles, BookOpen, User, Dices } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Character = Tables<"characters">;
type MagicItem = Tables<"magic_items">;

interface CharacterFormProps {
  character?: Character | null;
  onSave: (character: Partial<Character>) => void;
  onCancel: () => void;
}

const RACES = [
  "Humain", "Elfe", "Nain", "Halfelin", "Gnome", "Demi-Elfe", "Demi-Orc", 
  "Tieffelin", "Dragonborn", "Aarakocra", "Genasi", "Goliath", "Tabaxi", "Kenku"
];

const CLASSES = [
  "Barbare", "Barde", "Clerc", "Druide", "Guerrier", "Moine", 
  "Paladin", "Rôdeur", "Roublard", "Ensorceleur", "Sorcier", "Magicien"
];

const ALIGNMENTS = [
  "Loyal Bon", "Neutre Bon", "Chaotique Bon",
  "Loyal Neutre", "Neutre", "Chaotique Neutre",
  "Loyal Mauvais", "Neutre Mauvais", "Chaotique Mauvais"
];

const BACKGROUNDS = [
  "Acolyte", "Artisan", "Charlatan", "Criminel", "Artiste", "Gladiateur",
  "Héros du Peuple", "Ermite", "Noble", "Érudit", "Marin", "Soldat", "Vagabond"
];

const SKILLS = [
  "Acrobaties", "Arcanes", "Athlétisme", "Discrétion", "Dressage", "Escamotage",
  "Histoire", "Intimidation", "Investigation", "Médecine", "Nature", "Perception",
  "Perspicacité", "Persuasion", "Religion", "Représentation", "Survie", "Tromperie"
];

const LANGUAGES = [
  "Commun", "Elfique", "Nain", "Géant", "Gnome", "Gobelin", "Halfelin", 
  "Orc", "Abyssal", "Céleste", "Draconique", "Infernal", "Primordial", "Sylvain"
];

const CharacterForm = ({ character, onSave, onCancel }: CharacterFormProps) => {
  const [formData, setFormData] = useState<Partial<Character>>({
    name: "",
    race: "Humain",
    class: "Guerrier",
    subclass: "",
    level: 1,
    background: "",
    alignment: "Neutre",
    backstory: "",
    personality_traits: "",
    ideals: "",
    bonds: "",
    flaws: "",
    appearance: "",
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hp: 10,
    max_hp: 10,
    armor_class: 10,
    speed: 30,
    gold: 0,
    campaign: "",
    saving_throws: [],
    skills: [],
    languages: ["Commun"],
    ...character,
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>(formData.skills || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(formData.languages || ["Commun"]);

  // Fetch magic items for equipment selection
  const { data: weapons } = useQuery({
    queryKey: ["magic-items-weapons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("magic_items")
        .select("*")
        .in("type", ["Arme", "Weapon"]);
      return data as MagicItem[];
    },
  });

  const { data: armors } = useQuery({
    queryKey: ["magic-items-armors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("magic_items")
        .select("*")
        .in("type", ["Armure", "Armor"]);
      return data as MagicItem[];
    },
  });

  useEffect(() => {
    if (character) {
      setFormData({ ...character });
      setSelectedSkills(character.skills || []);
      setSelectedLanguages(character.languages || ["Commun"]);
    }
  }, [character]);

  const updateField = <K extends keyof Character>(field: K, value: Character[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(newSkills);
    updateField("skills", newSkills);
  };

  const toggleLanguage = (lang: string) => {
    const newLangs = selectedLanguages.includes(lang)
      ? selectedLanguages.filter((l) => l !== lang)
      : [...selectedLanguages, lang];
    setSelectedLanguages(newLangs);
    updateField("languages", newLangs);
  };

  const getModifier = (stat: number) => {
    const mod = Math.floor((stat - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-dark">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          {character ? "Modifier le Personnage" : "Créer un Personnage"}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button variant="gold" size="sm" onClick={handleSubmit}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-5 bg-muted">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Base</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Dices className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              <span className="hidden sm:inline">Équip.</span>
            </TabsTrigger>
            <TabsTrigger value="lore" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Lore</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Compét.</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du Personnage</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Entrez le nom..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Niveau</Label>
                <Input
                  id="level"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.level || 1}
                  onChange={(e) => updateField("level", parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Race</Label>
                <Select
                  value={formData.race || "Humain"}
                  onValueChange={(v) => updateField("race", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RACES.map((race) => (
                      <SelectItem key={race} value={race}>
                        {race}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Classe</Label>
                <Select
                  value={formData.class || "Guerrier"}
                  onValueChange={(v) => updateField("class", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subclass">Sous-classe</Label>
                <Input
                  id="subclass"
                  value={formData.subclass || ""}
                  onChange={(e) => updateField("subclass", e.target.value)}
                  placeholder="Ex: Champion, École d'Évocation..."
                />
              </div>

              <div className="space-y-2">
                <Label>Historique</Label>
                <Select
                  value={formData.background || ""}
                  onValueChange={(v) => updateField("background", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un historique" />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKGROUNDS.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alignement</Label>
                <Select
                  value={formData.alignment || "Neutre"}
                  onValueChange={(v) => updateField("alignment", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALIGNMENTS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campagne</Label>
                <Input
                  id="campaign"
                  value={formData.campaign || ""}
                  onChange={(e) => updateField("campaign", e.target.value)}
                  placeholder="Nom de la campagne..."
                />
              </div>
            </div>
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {[
                { key: "strength", label: "Force" },
                { key: "dexterity", label: "Dextérité" },
                { key: "constitution", label: "Constitution" },
                { key: "intelligence", label: "Intelligence" },
                { key: "wisdom", label: "Sagesse" },
                { key: "charisma", label: "Charisme" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="flex flex-col items-center rounded-lg border border-border bg-card p-4"
                >
                  <Label className="mb-2 text-xs text-muted-foreground">{label}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    className="mb-1 h-12 w-16 text-center text-lg font-bold"
                    value={formData[key as keyof Character] as number || 10}
                    onChange={(e) =>
                      updateField(key as keyof Character, parseInt(e.target.value) || 10)
                    }
                  />
                  <span className="text-sm font-medium text-primary">
                    {getModifier((formData[key as keyof Character] as number) || 10)}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <Label className="text-red-400">Points de Vie</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    className="h-10 w-20 text-center"
                    value={formData.hp || 10}
                    onChange={(e) => updateField("hp", parseInt(e.target.value) || 10)}
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    type="number"
                    className="h-10 w-20 text-center"
                    value={formData.max_hp || 10}
                    onChange={(e) => updateField("max_hp", parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <Label className="text-blue-400">Classe d'Armure</Label>
                <Input
                  type="number"
                  className="mt-2 h-10 w-20 text-center"
                  value={formData.armor_class || 10}
                  onChange={(e) => updateField("armor_class", parseInt(e.target.value) || 10)}
                />
              </div>

              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                <Label className="text-yellow-400">Vitesse</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    className="h-10 w-20 text-center"
                    value={formData.speed || 30}
                    onChange={(e) => updateField("speed", parseInt(e.target.value) || 30)}
                  />
                  <span className="text-muted-foreground">ft</span>
                </div>
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                <Label className="text-primary">Or</Label>
                <Input
                  type="number"
                  className="mt-2 h-10 w-24 text-center"
                  value={formData.gold || 0}
                  onChange={(e) => updateField("gold", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Equipment */}
          <TabsContent value="equipment" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sword className="h-4 w-4 text-red-400" />
                  Arme Équipée
                </Label>
                <Select
                  value={formData.equipped_weapon_id || ""}
                  onValueChange={(v) => updateField("equipped_weapon_id", v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une arme..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {weapons?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        <div className="flex items-center gap-2">
                          {w.name}
                          <Badge variant="outline" className="text-xs">
                            {w.rarity}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  Armure Équipée
                </Label>
                <Select
                  value={formData.equipped_armor_id || ""}
                  onValueChange={(v) => updateField("equipped_armor_id", v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une armure..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {armors?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          {a.name}
                          <Badge variant="outline" className="text-xs">
                            {a.rarity}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Inventaire</Label>
              <Textarea
                value={formData.inventory || ""}
                onChange={(e) => updateField("inventory", e.target.value)}
                placeholder="Listez vos objets, équipements, consommables..."
                rows={6}
              />
            </div>
          </TabsContent>

          {/* Lore */}
          <TabsContent value="lore" className="space-y-6">
            <div className="space-y-2">
              <Label>Apparence</Label>
              <Textarea
                value={formData.appearance || ""}
                onChange={(e) => updateField("appearance", e.target.value)}
                placeholder="Décrivez l'apparence de votre personnage..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Histoire / Backstory</Label>
              <Textarea
                value={formData.backstory || ""}
                onChange={(e) => updateField("backstory", e.target.value)}
                placeholder="Racontez l'histoire de votre personnage, ses origines, ses motivations..."
                rows={6}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Traits de Personnalité</Label>
                <Textarea
                  value={formData.personality_traits || ""}
                  onChange={(e) => updateField("personality_traits", e.target.value)}
                  placeholder="Comment se comporte votre personnage..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Idéaux</Label>
                <Textarea
                  value={formData.ideals || ""}
                  onChange={(e) => updateField("ideals", e.target.value)}
                  placeholder="Ce en quoi votre personnage croit..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Liens</Label>
                <Textarea
                  value={formData.bonds || ""}
                  onChange={(e) => updateField("bonds", e.target.value)}
                  placeholder="Les personnes ou lieux importants..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Défauts</Label>
                <Textarea
                  value={formData.flaws || ""}
                  onChange={(e) => updateField("flaws", e.target.value)}
                  placeholder="Les faiblesses de votre personnage..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          {/* Skills & Languages */}
          <TabsContent value="skills" className="space-y-6">
            <div>
              <Label className="mb-3 block">Compétences Maîtrisées</Label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Langues Connues</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <Badge
                    key={lang}
                    variant={selectedLanguages.includes(lang) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleLanguage(lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
};

export default CharacterForm;

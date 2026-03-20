import { useState, useEffect, useRef } from "react";
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
import { X, Save, Sword, Shield, Sparkles, BookOpen, User, Dices, Wand2, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { getSystemConfig, ALIGNMENTS, SKILLS, LANGUAGES, GAME_SYSTEMS } from "@/lib/game-systems";

type Spell = Tables<"spells">;

type Character = Tables<"characters">;
type MagicItem = Tables<"magic_items">;

interface CharacterFormProps {
  character?: Character | null;
  onSave: (character: Partial<Character>) => void;
  onCancel: () => void;
  gameSystem?: string;
}

// Classes that can cast spells (D&D only)
const SPELLCASTING_CLASSES = [
  "Barde", "Clerc", "Druide", "Paladin", "Rôdeur", "Ensorceleur", "Sorcier", "Magicien"
];

// Map class names for spell filtering
const CLASS_SPELL_VARIANTS: Record<string, string[]> = {
  "Barde": ["Barde", "Bard"],
  "Clerc": ["Clerc", "Cleric"],
  "Druide": ["Druide", "Druid"],
  "Paladin": ["Paladin"],
  "Rôdeur": ["Rôdeur", "Ranger"],
  "Ensorceleur": ["Ensorceleur", "Sorcerer"],
  "Sorcier": ["Sorcier", "Occultiste", "Warlock"],
  "Magicien": ["Magicien", "Wizard"]
};

const SPELLCASTING_ABILITIES: Record<string, string> = {
  "Barde": "Charisme",
  "Clerc": "Sagesse",
  "Druide": "Sagesse",
  "Paladin": "Charisme",
  "Rôdeur": "Sagesse",
  "Ensorceleur": "Charisme",
  "Sorcier": "Charisme",
  "Magicien": "Intelligence"
};

const CharacterForm = ({ character, onSave, onCancel, gameSystem: initialGameSystem = "D&D 5e" }: CharacterFormProps) => {
  const [currentGameSystem, setCurrentGameSystem] = useState(initialGameSystem);
  const systemConfig = getSystemConfig(currentGameSystem);
  const [formData, setFormData] = useState<Partial<Character>>({
    name: "",
    race: systemConfig.races[0],
    class: systemConfig.classes[0],
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

  // When game system changes, reset race/class to match new system
  const handleGameSystemChange = (newSystem: string) => {
    const newConfig = getSystemConfig(newSystem);
    setCurrentGameSystem(newSystem);
    setFormData(prev => ({
      ...prev,
      race: newConfig.races[0],
      class: newConfig.classes[0],
      subclass: "",
      background: "",
      alignment: newConfig.hasAlignments ? "Neutre" : "",
      campaign: newSystem,
    }));
  };

  const [selectedSkills, setSelectedSkills] = useState<string[]>(formData.skills || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(formData.languages || ["Commun"]);
  const [selectedKnownSpells, setSelectedKnownSpells] = useState<string[]>((formData.known_spells as string[]) || []);
  const [selectedPreparedSpells, setSelectedPreparedSpells] = useState<string[]>((formData.prepared_spells as string[]) || []);
  const [spellLevelFilter, setSpellLevelFilter] = useState<number | "all">("all");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSpellcaster = systemConfig.hasSpellcasting && SPELLCASTING_CLASSES.includes(formData.class || "");

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

  // Fetch spells for the character's class
  const { data: spells } = useQuery({
    queryKey: ["spells-for-class", formData.class],
    queryFn: async () => {
      const classVariants = CLASS_SPELL_VARIANTS[formData.class || ""];
      if (!classVariants || classVariants.length === 0) return [];
      
      // Fetch all spells and filter client-side for class variants
      const { data } = await supabase
        .from("spells")
        .select("*")
        .order("level")
        .order("name");
      
      // Filter spells that include any of the class variants
      const filtered = (data || []).filter(spell => 
        spell.classes.some((c: string) => classVariants.includes(c))
      );
      
      return filtered as Spell[];
    },
    enabled: isSpellcaster,
  });

  useEffect(() => {
    if (character) {
      setFormData({ ...character });
      setSelectedSkills(character.skills || []);
      setSelectedLanguages(character.languages || ["Commun"]);
      setSelectedKnownSpells((character.known_spells as string[]) || []);
      setSelectedPreparedSpells((character.prepared_spells as string[]) || []);
    }
  }, [character]);

  // Auto-set spellcasting ability when class changes
  useEffect(() => {
    if (isSpellcaster && formData.class) {
      const ability = SPELLCASTING_ABILITIES[formData.class];
      if (ability && !formData.spellcasting_ability) {
        updateField("spellcasting_ability", ability);
      }
    }
  }, [formData.class, isSpellcaster]);

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

  const toggleKnownSpell = (spellId: string) => {
    const newSpells = selectedKnownSpells.includes(spellId)
      ? selectedKnownSpells.filter((s) => s !== spellId)
      : [...selectedKnownSpells, spellId];
    setSelectedKnownSpells(newSpells);
    updateField("known_spells", newSpells);
    
    // If removing from known, also remove from prepared
    if (!newSpells.includes(spellId) && selectedPreparedSpells.includes(spellId)) {
      const newPrepared = selectedPreparedSpells.filter((s) => s !== spellId);
      setSelectedPreparedSpells(newPrepared);
      updateField("prepared_spells", newPrepared);
    }
  };

  const togglePreparedSpell = (spellId: string) => {
    // Can only prepare spells that are known
    if (!selectedKnownSpells.includes(spellId)) return;
    
    const newPrepared = selectedPreparedSpells.includes(spellId)
      ? selectedPreparedSpells.filter((s) => s !== spellId)
      : [...selectedPreparedSpells, spellId];
    setSelectedPreparedSpells(newPrepared);
    updateField("prepared_spells", newPrepared);
  };

  const filteredSpells = spells?.filter(spell => 
    spellLevelFilter === "all" || spell.level === spellLevelFilter
  ) || [];

  const getSpellById = (id: string) => spells?.find(s => s.id === id);

  const getModifier = (stat: number) => {
    const mod = Math.floor((stat - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 5MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('character-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('character-avatars')
        .getPublicUrl(filePath);

      updateField("avatar_url", publicUrl);
      toast.success("Avatar uploadé avec succès!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erreur lors de l'upload de l'avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    updateField("avatar_url", null);
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
          <TabsList className={`mb-6 grid w-full ${isSpellcaster ? 'grid-cols-6' : 'grid-cols-5'} bg-muted`}>
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
            {isSpellcaster && (
              <TabsTrigger value="spells" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                <span className="hidden sm:inline">Sorts</span>
              </TabsTrigger>
            )}
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
            {/* Game System Selector */}
            {!character && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <Label className="text-base font-semibold">Système de jeu</Label>
                <p className="text-xs text-muted-foreground">
                  Choisissez le système de jeu pour adapter les options de création.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {GAME_SYSTEMS.map((sys) => (
                    <Button
                      key={sys.value}
                      type="button"
                      variant={currentGameSystem === sys.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGameSystemChange(sys.value)}
                    >
                      {sys.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover border-4 border-primary/30"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted border-4 border-border">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Avatar du Personnage</Label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {formData.avatar_url ? "Changer" : "Ajouter"}
                  </Button>
                  {formData.avatar_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeAvatar}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. Max 5MB.</p>
              </div>
            </div>

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
                <Label>{systemConfig.raceLabel}</Label>
                <Select
                  value={formData.race || systemConfig.races[0]}
                  onValueChange={(v) => updateField("race", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConfig.races.map((race) => (
                      <SelectItem key={race} value={race}>
                        {race}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{systemConfig.classLabel}</Label>
                <Select
                  value={formData.class || systemConfig.classes[0]}
                  onValueChange={(v) => updateField("class", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConfig.classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subclass">
                  {currentGameSystem === "Worlds Awakening" ? "Tenue" : "Sous-classe"}
                </Label>
                <Input
                  id="subclass"
                  value={formData.subclass || ""}
                  onChange={(e) => updateField("subclass", e.target.value)}
                  placeholder={currentGameSystem === "Worlds Awakening" ? "Ex: Lame d'Ombre..." : "Ex: Champion, École d'Évocation..."}
                />
              </div>

              {systemConfig.backgrounds.length > 0 && (
                <div className="space-y-2">
                  <Label>{currentGameSystem === "Call of Cthulhu" ? "Époque" : "Historique"}</Label>
                  <Select
                    value={formData.background || ""}
                    onValueChange={(v) => updateField("background", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {systemConfig.backgrounds.map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {systemConfig.hasAlignments && (
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
              )}

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
                  value={formData.equipped_weapon_id || "none"}
                  onValueChange={(v) => updateField("equipped_weapon_id", v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une arme..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
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
                  value={formData.equipped_armor_id || "none"}
                  onValueChange={(v) => updateField("equipped_armor_id", v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une armure..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
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

          {/* Spells - Only for spellcasting classes */}
          {isSpellcaster && (
            <TabsContent value="spells" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Sorts de {formData.class}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Caractéristique d'incantation: {SPELLCASTING_ABILITIES[formData.class || ""]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Niveau:</Label>
                  <Select
                    value={spellLevelFilter === "all" ? "all" : String(spellLevelFilter)}
                    onValueChange={(v) => setSpellLevelFilter(v === "all" ? "all" : parseInt(v))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="0">Cantrips</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                        <SelectItem key={lvl} value={String(lvl)}>
                          Niveau {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected Spells Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                  <Label className="text-purple-400">
                    Sorts Connus ({selectedKnownSpells.length})
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedKnownSpells.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Aucun sort sélectionné</span>
                    ) : (
                      selectedKnownSpells.slice(0, 8).map((id) => {
                        const spell = getSpellById(id);
                        return spell ? (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {spell.name}
                          </Badge>
                        ) : null;
                      })
                    )}
                    {selectedKnownSpells.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedKnownSpells.length - 8}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <Label className="text-amber-400">
                    Sorts Préparés ({selectedPreparedSpells.length})
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedPreparedSpells.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Aucun sort préparé</span>
                    ) : (
                      selectedPreparedSpells.slice(0, 8).map((id) => {
                        const spell = getSpellById(id);
                        return spell ? (
                          <Badge key={id} variant="default" className="text-xs">
                            {spell.name}
                          </Badge>
                        ) : null;
                      })
                    )}
                    {selectedPreparedSpells.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedPreparedSpells.length - 8}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Spell List */}
              <div className="space-y-2">
                <Label>Sélectionner des Sorts</Label>
                <ScrollArea className="h-[400px] rounded-lg border border-border bg-card/50 p-4">
                  {filteredSpells.length === 0 ? (
                    <p className="text-center text-muted-foreground">
                      Aucun sort disponible pour cette classe
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredSpells.map((spell) => {
                        const isKnown = selectedKnownSpells.includes(spell.id);
                        const isPrepared = selectedPreparedSpells.includes(spell.id);
                        
                        return (
                          <div
                            key={spell.id}
                            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                              isKnown
                                ? "border-purple-500/50 bg-purple-500/10"
                                : "border-border bg-background hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{spell.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {spell.level === 0 ? "Cantrip" : `Niv. ${spell.level}`}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {spell.school}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                                {spell.casting_time} • {spell.range} • {spell.duration}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={isKnown ? "default" : "outline"}
                                onClick={() => toggleKnownSpell(spell.id)}
                                className="h-8 text-xs"
                              >
                                {isKnown ? "Connu ✓" : "Apprendre"}
                              </Button>
                              {isKnown && spell.level > 0 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isPrepared ? "gold" : "outline"}
                                  onClick={() => togglePreparedSpell(spell.id)}
                                  className="h-8 text-xs"
                                >
                                  {isPrepared ? "Préparé ✓" : "Préparer"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          )}

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

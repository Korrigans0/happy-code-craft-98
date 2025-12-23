import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Edit, Heart, Shield, Zap, Sword, BookOpen, User, Footprints, Coins } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Character = Tables<"characters">;
type MagicItem = Tables<"magic_items">;

interface CharacterSheetProps {
  character: Character;
  onEdit: () => void;
  onClose: () => void;
}

const CharacterSheet = ({ character, onEdit, onClose }: CharacterSheetProps) => {
  const proficiencyBonus = Math.floor((character.level - 1) / 4) + 2;

  const { data: equippedWeapon } = useQuery({
    queryKey: ["magic-item", character.equipped_weapon_id],
    queryFn: async () => {
      if (!character.equipped_weapon_id) return null;
      const { data } = await supabase
        .from("magic_items")
        .select("*")
        .eq("id", character.equipped_weapon_id)
        .maybeSingle();
      return data as MagicItem | null;
    },
    enabled: !!character.equipped_weapon_id,
  });

  const { data: equippedArmor } = useQuery({
    queryKey: ["magic-item", character.equipped_armor_id],
    queryFn: async () => {
      if (!character.equipped_armor_id) return null;
      const { data } = await supabase
        .from("magic_items")
        .select("*")
        .eq("id", character.equipped_armor_id)
        .maybeSingle();
      return data as MagicItem | null;
    },
    enabled: !!character.equipped_armor_id,
  });

  const getModifier = (stat: number) => {
    const mod = Math.floor((stat - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const stats = [
    { key: "strength", label: "FOR", value: character.strength },
    { key: "dexterity", label: "DEX", value: character.dexterity },
    { key: "constitution", label: "CON", value: character.constitution },
    { key: "intelligence", label: "INT", value: character.intelligence },
    { key: "wisdom", label: "SAG", value: character.wisdom },
    { key: "charisma", label: "CHA", value: character.charisma },
  ];

  return (
    <div className="flex h-full flex-col bg-gradient-dark">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {character.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {character.race} • {character.class} {character.subclass && `(${character.subclass})`} • Niveau {character.level}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Combat Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col items-center rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <Heart className="mb-1 h-5 w-5 text-red-400" />
              <span className="text-xl font-bold text-foreground">
                {character.hp}/{character.max_hp}
              </span>
              <span className="text-xs text-muted-foreground">Points de Vie</span>
            </div>

            <div className="flex flex-col items-center rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <Shield className="mb-1 h-5 w-5 text-blue-400" />
              <span className="text-xl font-bold text-foreground">{character.armor_class}</span>
              <span className="text-xs text-muted-foreground">Classe d'Armure</span>
            </div>

            <div className="flex flex-col items-center rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <Zap className="mb-1 h-5 w-5 text-yellow-400" />
              <span className="text-xl font-bold text-foreground">+{proficiencyBonus}</span>
              <span className="text-xs text-muted-foreground">Bonus Maîtrise</span>
            </div>

            <div className="flex flex-col items-center rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <Footprints className="mb-1 h-5 w-5 text-green-400" />
              <span className="text-xl font-bold text-foreground">{character.speed} ft</span>
              <span className="text-xs text-muted-foreground">Vitesse</span>
            </div>
          </div>

          {/* Ability Scores */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Caractéristiques</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {stats.map(({ key, label, value }) => (
                <div
                  key={key}
                  className="flex flex-col items-center rounded-lg border border-border bg-card p-3"
                >
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-lg font-bold text-foreground">{value}</span>
                  <span className="text-sm font-medium text-primary">{getModifier(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Équipement</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <Sword className="mt-0.5 h-5 w-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {equippedWeapon?.name || "Aucune arme équipée"}
                  </p>
                  {equippedWeapon && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {equippedWeapon.rarity}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <Shield className="mt-0.5 h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {equippedArmor?.name || "Aucune armure équipée"}
                  </p>
                  {equippedArmor && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {equippedArmor.rarity}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">{character.gold} pièces d'or</span>
            </div>
          </div>

          {/* Skills & Languages */}
          {(character.skills?.length > 0 || character.languages?.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {character.skills?.length > 0 && (
                <div>
                  <h3 className="mb-2 font-display text-sm font-semibold text-foreground">
                    Compétences
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {character.skills.map((skill) => (
                      <Badge key={skill} variant="default" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {character.languages?.length > 0 && (
                <div>
                  <h3 className="mb-2 font-display text-sm font-semibold text-foreground">
                    Langues
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {character.languages.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lore */}
          {(character.backstory || character.appearance || character.personality_traits) && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <BookOpen className="h-4 w-4" />
                Histoire & Personnalité
              </h3>

              <div className="space-y-4 rounded-lg border border-border bg-card p-4">
                {character.appearance && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-primary">Apparence</p>
                    <p className="text-sm text-muted-foreground">{character.appearance}</p>
                  </div>
                )}

                {character.backstory && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-primary">Histoire</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {character.backstory}
                    </p>
                  </div>
                )}

                {character.personality_traits && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-primary">Traits de Personnalité</p>
                    <p className="text-sm text-muted-foreground">{character.personality_traits}</p>
                  </div>
                )}

                {character.ideals && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-primary">Idéaux</p>
                    <p className="text-sm text-muted-foreground">{character.ideals}</p>
                  </div>
                )}

                {character.bonds && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-primary">Liens</p>
                    <p className="text-sm text-muted-foreground">{character.bonds}</p>
                  </div>
                )}

                {character.flaws && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-primary">Défauts</p>
                    <p className="text-sm text-muted-foreground">{character.flaws}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inventory */}
          {character.inventory && (
            <div>
              <h3 className="mb-3 font-display text-sm font-semibold text-foreground">
                Inventaire
              </h3>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {character.inventory}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CharacterSheet;

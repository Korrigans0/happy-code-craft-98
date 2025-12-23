import { User, Shield, Heart, Zap, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type Character = Tables<"characters">;

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
  onViewSheet: (character: Character) => void;
}

const CharacterCard = ({ character, onEdit, onDelete, onViewSheet }: CharacterCardProps) => {
  const proficiencyBonus = Math.floor((character.level - 1) / 4) + 2;

  return (
    <div className="group overflow-hidden rounded-xl border border-border/50 bg-gradient-card shadow-card transition-all duration-300 hover:border-primary/30">
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="absolute -bottom-8 left-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-muted">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="absolute right-3 top-3">
          <Badge variant="default">Niv. {character.level}</Badge>
        </div>
        <div className="absolute right-3 bottom-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/80 hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(character);
            }}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/80 text-destructive hover:bg-background hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-4 pt-10">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {character.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {character.race} • {character.class}
          {character.subclass && ` (${character.subclass})`}
        </p>

        {character.campaign && (
          <p className="mt-2 text-xs text-primary">{character.campaign}</p>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-red-400">
            <Heart className="h-4 w-4" />
            <span>
              {character.hp}/{character.max_hp}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-400">
            <Shield className="h-4 w-4" />
            <span>{character.armor_class}</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-400">
            <Zap className="h-4 w-4" />
            <span>+{proficiencyBonus}</span>
          </div>
        </div>

        <Button
          variant="join"
          size="sm"
          className="mt-4 w-full"
          onClick={() => onViewSheet(character)}
        >
          Voir la fiche
        </Button>
      </div>
    </div>
  );
};

export default CharacterCard;

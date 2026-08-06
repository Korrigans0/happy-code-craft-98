// SheetRouter — résout la fiche personnage à utiliser selon character.system.
// AetheriaCharacterSheet est STRICTEMENT réservée au système Aetheria.
// Chaque autre système utilise sa fiche dédiée, ou GenericSystemSheet
// (pilotée par la définition du système) en dernier recours.

import { getSystem, isKnownSystem } from "@/lib/systems";
import AetheriaCharacterSheet from "../AetheriaCharacterSheet";
import Dnd5eSheet from "./Dnd5eSheet";
import HomebrewSheet from "./HomebrewSheet";
import GenericSystemSheet from "./GenericSystemSheet";
import Pathfinder2eSheet from "./Pathfinder2eSheet";
import Cthulhu7eSheet from "./Cthulhu7eSheet";
import GlyphesPdfSheet from "./GlyphesPdfSheet";

interface SheetRouterProps {
  character: any;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
}

const SheetRouter = ({ character, editable, onSave, onClose, onEdit }: SheetRouterProps) => {
  const system = getSystem(character?.system);
  // Système inconnu/absent : jamais de fiche Aetheria par défaut.
  const key = !isKnownSystem(character?.system)
    ? "generic"
    : system.sheetComponent ?? "homebrew";

  switch (key) {
    case "aetheria":
      return (
        <AetheriaCharacterSheet
          character={character}
          editable={editable}
          onSave={onSave}
          onClose={onClose}
          onEdit={onEdit}
        />
      );
    case "dnd5e":
      return (
        <Dnd5eSheet
          character={character}
          editable={editable}
          onSave={onSave}
          onClose={onClose}
          onEdit={onEdit}
        />
      );
    case "homebrew":
      return (
        <HomebrewSheet
          character={character}
          editable={editable}
          onSave={onSave}
          onClose={onClose}
          onEdit={onEdit}
        />
      );
    case "pathfinder2e":
      return (
        <Pathfinder2eSheet
          character={character}
          editable={editable}
          onSave={onSave}
          onClose={onClose}
          onEdit={onEdit}
        />
      );
    case "cthulhu7e":
      return (
        <Cthulhu7eSheet
          character={character}
          editable={editable}
          onSave={onSave}
          onClose={onClose}
          onEdit={onEdit}
        />
      );
    case "glyphes":
      return (
        <GlyphesPdfSheet
          character={character}
          editable={editable}
          onSave={onSave}
          onClose={onClose}
          onEdit={onEdit}
        />
      );
    default:
      return (
        <GenericSystemSheet
          character={character}
          system={system}
          editable={editable}
          onSave={onSave}
          onClose={onClose}
          onEdit={onEdit}
        />
      );
  }
};

export default SheetRouter;

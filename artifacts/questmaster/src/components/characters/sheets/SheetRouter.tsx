// SheetRouter — résout la fiche personnage à utiliser selon character.system.
// Réutilise AetheriaCharacterSheet pour Aetheria/WA (mécaniques identiques v1),
// Dnd5eSheet pour D&D 5e, HomebrewSheet pour Personnalisé, GenericSystemSheet
// pour PF2e / CoC.

import { getSystem } from "@/lib/systems";
import AetheriaCharacterSheet from "../AetheriaCharacterSheet";
import Dnd5eSheet from "./Dnd5eSheet";
import HomebrewSheet from "./HomebrewSheet";
import GenericSystemSheet from "./GenericSystemSheet";
import Pathfinder2eSheet from "./Pathfinder2eSheet";
import Cthulhu7eSheet from "./Cthulhu7eSheet";

interface SheetRouterProps {
  character: any;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
}

const SheetRouter = ({ character, editable, onSave, onClose, onEdit }: SheetRouterProps) => {
  const system = getSystem(character?.system);
  const key = system.sheetComponent ?? "homebrew";

  switch (key) {
    case "aetheria":
    case "worlds-awakening":
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
    case "cthulhu7e":
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

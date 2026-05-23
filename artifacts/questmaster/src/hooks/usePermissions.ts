import { useMemo } from "react";

/**
 * Permissions centralisées pour le plateau (VTT) et la campagne.
 *
 * Règle métier :
 * - MJ : contrôle total (carte, brouillard, suppression tokens, combat, ajout/édition de tout token).
 * - Joueur : ne peut déplacer/sélectionner que SON propre token (lié à son character_id),
 *   utiliser sa fiche, les dés et le chat. Ne peut pas modifier la carte, le brouillard,
 *   ni supprimer un token qui ne lui appartient pas.
 *
 * Toute logique sensible doit passer par ce hook plutôt que par un check `isGM` dispersé.
 */
export interface PermissionsInput {
  isGM: boolean;
  /** id de l'utilisateur courant (auth.uid) */
  userId?: string | null;
  /** id du personnage joué par l'utilisateur dans cette campagne (campaign_members.character_id) */
  ownCharacterId?: string | null;
}

export interface TokenLike {
  id: string;
  /** Si présent et que creatureType === 'character', on compare à ownCharacterId */
  creatureId?: string;
  creatureType?: "wa_creature" | "monster" | "character" | "aetheria_creature";
  /** Optionnel : owner explicite si stocké côté token */
  ownerId?: string | null;
}

export function usePermissions({ isGM, userId, ownCharacterId }: PermissionsInput) {
  return useMemo(() => {
    const ownsToken = (token: TokenLike | null | undefined): boolean => {
      if (!token) return false;
      if (isGM) return true;
      if (token.ownerId && userId && token.ownerId === userId) return true;
      if (
        token.creatureType === "character" &&
        ownCharacterId &&
        token.creatureId === ownCharacterId
      ) {
        return true;
      }
      return false;
    };

    return {
      // Plateau / carte
      canEditMap: isGM,
      canUploadMap: isGM,
      canClearBoard: isGM,

      // Brouillard de guerre
      canToggleFog: isGM,
      canEditFog: isGM,

      // Tokens
      canAddToken: isGM,
      canDeleteToken: (token: TokenLike | null | undefined) => isGM || ownsToken(token),
      canMoveToken: (token: TokenLike | null | undefined) => ownsToken(token),
      canEditTokenStats: (token: TokenLike | null | undefined) => isGM || ownsToken(token),
      canSelectToken: (token: TokenLike | null | undefined) => isGM || ownsToken(token),

      // Couches / dessins
      canManageLayers: isGM,
      canDrawOnLayer: (_layerId: string) => true, // tout le monde peut dessiner sur la couche dessins
      canEraseOthersDrawings: isGM,

      // Combat
      canManageCombat: isGM,
      canEditInitiative: isGM,

      // Toujours autorisé pour les joueurs
      canRollDice: true,
      canChat: true,
      canViewOwnSheet: true,

      // Helpers bruts
      isGM,
      ownsToken,
    };
  }, [isGM, userId, ownCharacterId]);
}

export type UseTabletopPermissions = ReturnType<typeof usePermissions>;

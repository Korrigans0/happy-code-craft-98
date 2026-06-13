// Compatibilité personnage ↔ campagne.
//
// Règle :
// - Si campaign.system manquant (campagnes legacy) → tout autorisé.
// - Sinon character.system doit correspondre.
// - Exception : Homebrew (Personnalisé) autorisé si campaign.allow_homebrew_characters = true.

import { getSystem } from "@/lib/systems";

export const HOMEBREW_SYSTEM_ID = "Personnalisé";

export interface CampaignSystemCtx {
  system?: string | null;
  allow_homebrew_characters?: boolean | null;
}
export interface CharacterSystemCtx {
  system?: string | null;
}

export function isHomebrew(systemId?: string | null): boolean {
  return systemId === HOMEBREW_SYSTEM_ID;
}

export function canUseCharacterInCampaign(
  character: CharacterSystemCtx,
  campaign: CampaignSystemCtx,
): { ok: boolean; reason?: string } {
  const charSys = character.system ?? "Aetheria";
  const campSys = campaign.system;

  if (!campSys) return { ok: true };
  if (charSys === campSys) return { ok: true };

  if (isHomebrew(charSys)) {
    if (campaign.allow_homebrew_characters) return { ok: true };
    return {
      ok: false,
      reason: `Cette campagne (${getSystem(campSys).label}) n'autorise pas les personnages Homebrew. Le MJ peut activer l'option dans les paramètres.`,
    };
  }

  return {
    ok: false,
    reason: `Personnage ${getSystem(charSys).label} incompatible avec une campagne ${getSystem(campSys).label}.`,
  };
}

export function filterCompatibleCharacters<T extends CharacterSystemCtx>(
  characters: T[],
  campaign: CampaignSystemCtx,
): T[] {
  return characters.filter((c) => canUseCharacterInCampaign(c, campaign).ok);
}

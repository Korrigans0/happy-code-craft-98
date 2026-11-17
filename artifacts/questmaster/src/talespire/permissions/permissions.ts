// Permission display helpers. The server is the only authority (RLS + can_edit);
// these only adapt the interface to what it answered.
export interface CharacterAccess { isOwner: boolean; canEdit: boolean }

export function accessLabel(a: CharacterAccess): string {
  if (a.isOwner) return "Mon personnage";
  return a.canEdit ? "Fiche d'un joueur (MJ)" : "Lecture seule";
}

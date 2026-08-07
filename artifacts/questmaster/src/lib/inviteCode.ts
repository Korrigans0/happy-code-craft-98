// Invite codes: unambiguous alphabet.
// The letters O/o and the digit 0 are BANNED because players confuse them
// when reading a code or a /join/<code> link.
export const INVITE_CODE_ALPHABET = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";

export const INVITE_CODE_MIN = 4;
export const INVITE_CODE_MAX = 16;

/** Cryptographically random invite code using the unambiguous alphabet. */
export function generateInviteCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += INVITE_CODE_ALPHABET[bytes[i] % INVITE_CODE_ALPHABET.length];
  }
  return out;
}

/**
 * Normalize any user-typed / URL code: uppercase, alphanumeric only,
 * O and 0 stripped, max length enforced.
 */
export function sanitizeInviteCode(value: string): string {
  return (value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/[O0]/g, "")
    .slice(0, INVITE_CODE_MAX);
}

/** True when the code is usable (length + allowed characters). */
export function isValidInviteCode(value: string): boolean {
  const c = sanitizeInviteCode(value);
  return c.length >= INVITE_CODE_MIN && c === (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

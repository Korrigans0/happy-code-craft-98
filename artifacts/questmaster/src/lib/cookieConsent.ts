import { readStorage, writeStorage, removeStorage } from "@/lib/safeStorage";
export const COOKIE_CONSENT_KEY = "aetheria.cookie-consent.v1";
export const COOKIE_SETTINGS_EVENT = "aetheria:cookie-settings";

export interface CookieConsent {
  necessary: true;
  preferences: boolean;
  statistics: false;
  marketing: false;
  updatedAt: string;
}

export function readCookieConsent(): CookieConsent | null {
  try {
    const raw = readStorage(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    return { necessary: true, preferences: parsed.preferences === true, statistics: false, marketing: false, updatedAt: String(parsed.updatedAt ?? "") };
  } catch { return null; }
}

export function saveCookieConsent(preferences: boolean): CookieConsent {
  const value: CookieConsent = { necessary: true, preferences, statistics: false, marketing: false, updatedAt: new Date().toISOString() };
  try {
    writeStorage(COOKIE_CONSENT_KEY, JSON.stringify(value));
    writeStorage("aetheria.cookie-consent", preferences ? "accepted" : "rejected");
    if (!preferences) {
      removeStorage("aetheria.remember.credentials");
      removeStorage("aetheria.ambient.muted");
    }
  } catch { /* stockage indisponible */ }
  window.dispatchEvent(new CustomEvent("aetheria:cookie-consent-changed", { detail: value }));
  return value;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
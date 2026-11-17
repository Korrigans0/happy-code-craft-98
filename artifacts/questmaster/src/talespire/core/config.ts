// Public configuration only: the Symbiote never embeds backend secrets.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "";

export const OAUTH_ISSUER = `https://${projectRef}.supabase.co/auth/v1`;
export const MCP_ENDPOINT = `https://${projectRef}.supabase.co/functions/v1/mcp`;
export const TALESPIRE_LINK_PATH = "/talespire/link";
export const POLL_INTERVAL_MS = 8000;
export const SAVE_DEBOUNCE_MS = 600;
export const STORAGE_PREFIX = "aetheria-talespire:";

export const linkRedirectUri = () => `${window.location.origin}${TALESPIRE_LINK_PATH}`;

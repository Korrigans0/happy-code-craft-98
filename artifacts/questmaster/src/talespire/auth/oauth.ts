// OAuth 2.1 Authorization Code + PKCE against the Aetheria VTT auth server.
// Public client registered dynamically: no client secret, no backend key in the Symbiote.
import { OAUTH_ISSUER, linkRedirectUri } from "../core/config";
import { dropKey, loadJson, saveJson } from "../core/storage";

export interface StoredTokens { access_token: string; refresh_token: string; expires_at: number; user_id?: string; email?: string }
interface Metadata { authorization_endpoint: string; token_endpoint: string; registration_endpoint?: string }
interface PendingAuth { state: string; verifier: string; client_id: string; created_at: number }

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const randomString = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
async function challenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(digest));
}

let metadataCache: Metadata | null = null;
async function metadata(): Promise<Metadata> {
  if (metadataCache) return metadataCache;
  const res = await fetch(`${OAUTH_ISSUER}/.well-known/oauth-authorization-server`);
  if (!res.ok) throw new Error("Serveur d'authentification injoignable");
  metadataCache = (await res.json()) as Metadata;
  return metadataCache;
}

async function clientId(): Promise<string> {
  const redirect = linkRedirectUri();
  const saved = loadJson<{ client_id: string; redirect: string } | null>("client", null);
  if (saved && saved.redirect === redirect) return saved.client_id;
  const meta = await metadata();
  if (!meta.registration_endpoint) throw new Error("Enregistrement du client indisponible");
  const res = await fetch(meta.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Aetheria VTT pour TaleSpire",
      redirect_uris: [redirect],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: "openid email profile",
    }),
  });
  if (!res.ok) throw new Error("Impossible d'enregistrer le module TaleSpire");
  const body = await res.json();
  saveJson("client", { client_id: body.client_id, redirect });
  return body.client_id as string;
}

/** Prepares an authorization request and returns the URL to open. */
export async function startAuthorization(): Promise<string> {
  const [meta, id] = await Promise.all([metadata(), clientId()]);
  const pending: PendingAuth = { state: randomString(16), verifier: randomString(48), client_id: id, created_at: Date.now() };
  saveJson("pending", pending);
  const url = new URL(meta.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", linkRedirectUri());
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", pending.state);
  url.searchParams.set("code_challenge", await challenge(pending.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

/** True when this browser holds the PKCE verifier for the given state (same-window flow). */
export const ownsPendingState = (state: string | null) =>
  !!state && loadJson<PendingAuth | null>("pending", null)?.state === state;

function decodeJwt(token: string): Record<string, unknown> {
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch { return {}; }
}

async function tokenRequest(params: Record<string, string>): Promise<StoredTokens> {
  const meta = await metadata();
  const res = await fetch(meta.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw new Error(res.status === 400 ? "Code de liaison invalide ou expiré" : "Connexion impossible");
  const body = await res.json();
  const claims = decodeJwt(body.access_token);
  const tokens: StoredTokens = {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: Date.now() + (Number(body.expires_in) || 3600) * 1000,
    user_id: claims.sub as string | undefined,
    email: claims.email as string | undefined,
  };
  saveJson("tokens", tokens);
  return tokens;
}

/** Exchanges an authorization code (redirect or pasted link code) using the stored verifier. */
export async function exchangeCode(rawCode: string): Promise<StoredTokens> {
  const pending = loadJson<PendingAuth | null>("pending", null);
  if (!pending || Date.now() - pending.created_at > 15 * 60_000) {
    throw new Error("Demande de connexion expirée : recommencez depuis TaleSpire");
  }
  const code = rawCode.trim();
  const tokens = await tokenRequest({
    grant_type: "authorization_code", code, redirect_uri: linkRedirectUri(),
    client_id: pending.client_id, code_verifier: pending.verifier,
  });
  dropKey("pending");
  return tokens;
}

let refreshing: Promise<StoredTokens | null> | null = null;
export const loadTokens = () => loadJson<StoredTokens | null>("tokens", null);

/** Returns a valid access token, refreshing it when it expires within a minute. */
export async function accessToken(force = false): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens) return null;
  if (!force && tokens.expires_at - Date.now() > 60_000) return tokens.access_token;
  refreshing ??= (async () => {
    try {
      const saved = loadJson<{ client_id: string } | null>("client", null);
      return await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refresh_token, ...(saved ? { client_id: saved.client_id } : {}) });
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  const next = await refreshing;
  if (!next) { signOut(); return null; }
  return next.access_token;
}

export function signOut() { dropKey("tokens"); dropKey("pending"); }

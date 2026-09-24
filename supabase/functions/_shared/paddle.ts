export type PaddleEnvironment = "sandbox" | "live";
export const paddleBase = (env: PaddleEnvironment) => env === "live" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
export const paddleKey = (env: PaddleEnvironment) => Deno.env.get(env === "live" ? "PADDLE_LIVE_API_KEY" : "PADDLE_SANDBOX_API_KEY");
export async function paddleRequest(env: PaddleEnvironment, path: string, init: RequestInit = {}) {
  const key = paddleKey(env); if (!key) throw new Error(`Clé Paddle ${env} absente`);
  const response = await fetch(`${paddleBase(env)}${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.detail ?? payload?.error?.code ?? `Paddle ${response.status}`);
  return payload;
}
export function envFromRequest(req: Request): PaddleEnvironment { return new URL(req.url).searchParams.get("env") === "live" ? "live" : "sandbox"; }
export async function verifyPaddleSignature(raw: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const parts = Object.fromEntries(signature.split(";").map((part) => part.split("=", 2)));
  const ts = parts.ts; const expected = parts.h1; if (!ts || !expected || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}:${raw}`));
  const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  if (actual.length !== expected.length) return false;
  let diff = 0; for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

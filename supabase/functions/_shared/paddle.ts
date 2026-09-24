import { Environment, Paddle, EventName } from "npm:@paddle/paddle-node-sdk";
export { EventName };
export type PaddleEnv = "sandbox" | "live";
const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev/paddle";
const getEnv = (key: string) => { const value = Deno.env.get(key); if (!value) throw new Error(`${key} is not configured`); return value; };
export function getConnectionApiKey(env: PaddleEnv) { return getEnv(env === "sandbox" ? "PADDLE_SANDBOX_API_KEY" : "PADDLE_LIVE_API_KEY"); }
export function getPaddleClient(env: PaddleEnv) {
  const connectionApiKey = getConnectionApiKey(env);
  return new Paddle(connectionApiKey, { environment: GATEWAY_BASE_URL as unknown as Environment, customHeaders: { "X-Connection-Api-Key": connectionApiKey, "Lovable-API-Key": getEnv("LOVABLE_API_KEY") } });
}
export async function gatewayFetch(env: PaddleEnv, path: string, init?: RequestInit) {
  const connectionApiKey = getConnectionApiKey(env);
  return fetch(`${GATEWAY_BASE_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", "X-Connection-Api-Key": connectionApiKey, "Lovable-API-Key": getEnv("LOVABLE_API_KEY"), ...init?.headers } });
}
export function getWebhookSecret(env: PaddleEnv) { return getEnv(env === "sandbox" ? "PAYMENTS_SANDBOX_WEBHOOK_SECRET" : "PAYMENTS_LIVE_WEBHOOK_SECRET"); }
export async function verifyWebhook(req: Request, env: PaddleEnv) {
  const signature = req.headers.get("paddle-signature"); const body = await req.text();
  if (!signature || !body) throw new Error("Missing signature or body");
  return await getPaddleClient(env).webhooks.unmarshal(body, getWebhookSecret(env), signature);
}

import { initializePaddle as loadPaddle, type Paddle } from "@paddle/paddle-js";
import { supabase } from "@/integrations/supabase/client";
const CLIENT_TOKEN = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
let instance: Promise<Paddle | undefined> | null = null;
export function getPaddleEnvironment(): "sandbox" | "live" { return CLIENT_TOKEN?.startsWith("test_") ? "sandbox" : "live"; }
export function getPaddle() {
  if (!CLIENT_TOKEN) throw new Error("Le paiement n’est pas configuré.");
  if (!instance) instance = loadPaddle({ token: CLIENT_TOKEN, environment: getPaddleEnvironment() === "sandbox" ? "sandbox" : "production" });
  return instance;
}
export async function resolvePaddlePrice(priceId: string) {
  const { data, error } = await supabase.functions.invoke("get-paddle-price", { body: { priceId, environment: getPaddleEnvironment() } });
  if (error || !data?.paddleId) throw new Error("Tarif Paddle introuvable.");
  return data.paddleId as string;
}

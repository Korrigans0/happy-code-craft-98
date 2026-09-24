import { initializePaddle, type Paddle } from "@paddle/paddle-js";
let instance: Promise<Paddle | undefined> | null = null;
export function getPaddle() {
  if (!instance) {
    const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
    if (!token) throw new Error("Le paiement de test n’est pas configuré.");
    instance = initializePaddle({ token, environment: token.startsWith("test_") ? "sandbox" : "production" });
  }
  return instance;
}

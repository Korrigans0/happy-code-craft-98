import { getPaddleEnvironment } from "@/lib/paddle";
export default function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return <div className="border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center text-sm text-amber-200">Les paiements effectués dans l’aperçu sont des tests : aucun argent réel n’est débité.</div>;
}

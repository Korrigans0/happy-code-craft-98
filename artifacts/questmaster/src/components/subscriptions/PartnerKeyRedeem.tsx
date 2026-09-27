import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Cette clé n’existe pas. Vérifiez sa saisie.",
  used: "Cette clé a déjà été utilisée et ne peut plus être activée.",
  disabled: "Cette clé a été désactivée.",
  rate_limited: "Trop de tentatives. Réessayez dans 15 minutes.",
  already_active: "Vous bénéficiez déjà d’une clé partenaire active.",
  not_authenticated: "Connectez-vous pour activer une clé.",
};

/** Partner key redemption: all validation and plan assignment happen server-side. */
export default function PartnerKeyRedeem() {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const redeem = async () => {
    if (!value.trim() || busy) return;
    setBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc("redeem_partner_key", { _key: value.trim() });
      if (error) throw error;
      if (!data?.ok) { toast.error(ERROR_MESSAGES[data?.error] ?? "Activation impossible."); return; }
      toast.success(`Premium Mixte activé jusqu’au ${new Date(data.expires_at).toLocaleDateString("fr-FR")} !`);
      setValue("");
      await queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    } catch {
      toast.error("Activation impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-amber-400/30 bg-slate-950/60 p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-amber-300"><Gift className="h-5 w-5" /> J’ai une clé partenaire</h2>
      <p className="mt-2 text-sm text-slate-400">Une clé partenaire offre Premium Mixte pendant 365 jours à partir de son activation. Chaque clé ne peut être utilisée qu’une seule fois.</p>
      {subscription && subscription.paidTier !== "free" && (
        <p className="mt-2 text-xs text-amber-200/80">Votre abonnement payant n’est ni modifié ni résilié par la clé : pensez à le gérer depuis « Gérer mon abonnement » si vous ne souhaitez plus être facturé.</p>
      )}
      {subscription?.partnerExpiresAt ? (
        <p className="mt-4 text-sm text-cyan-200">Clé active — Premium Mixte jusqu’au {new Date(subscription.partnerExpiresAt).toLocaleDateString("fr-FR")}.</p>
      ) : (
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); void redeem(); }}>
          <Input value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} placeholder="Entrer votre clé partenaire" maxLength={40} autoComplete="off" aria-label="Clé partenaire" className="min-h-11 font-mono" />
          <Button type="submit" className="min-h-11 font-bold" disabled={busy || !value.trim()}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Activer la clé</Button>
        </form>
      )}
    </div>
  );
}

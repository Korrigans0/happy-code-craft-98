import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, XCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "checking" | "ready" | "already" | "invalid" | "submitting" | "success" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setState("invalid"); return; }
        if (data.valid === true) setState("ready");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    if (error) { setState("error"); return; }
    if ((data as any)?.success) setState("success");
    else if ((data as any)?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-dark px-4">
      <img
        src="/aetheria-logo.png"
        alt="Aetheria"
        className="mb-8 h-20 w-20 rounded-full object-cover"
        style={{ filter: "drop-shadow(0 0 20px hsl(43,75%,50%,0.5))" }}
      />
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{
          background: "hsl(215,60%,11%)",
          border: "1px solid hsl(43,75%,50%,0.2)",
          boxShadow: "0 20px 60px hsl(0,0%,0%,0.6)",
        }}
      >
        <MailX className="mx-auto mb-3 h-10 w-10 text-amber-400" />
        <h1 className="font-display text-2xl font-bold text-gradient-gold mb-2">
          Se désinscrire
        </h1>

        {state === "checking" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">Vérification du lien…</p>
          </div>
        )}

        {state === "ready" && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Confirmez votre désinscription pour ne plus recevoir d'emails de la part d'Aetheria VTT.
            </p>
            <Button
              className="w-full font-bold"
              style={{
                background: "linear-gradient(135deg, hsl(43,75%,50%) 0%, hsl(35,85%,40%) 100%)",
                color: "hsl(215,70%,8%)",
              }}
              onClick={confirm}
            >
              Confirmer la désinscription
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Annuler
            </Button>
          </div>
        )}

        {state === "submitting" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">Désinscription en cours…</p>
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
            <p className="text-sm text-green-400 font-medium">Vous avez été désinscrit avec succès.</p>
            <Button variant="outline" className="mt-2" onClick={() => navigate("/")}>Retour à l'accueil</Button>
          </div>
        )}

        {state === "already" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-10 w-10 text-amber-400" />
            <p className="text-sm text-amber-300">Cette adresse est déjà désinscrite.</p>
            <Button variant="outline" className="mt-2" onClick={() => navigate("/")}>Retour à l'accueil</Button>
          </div>
        )}

        {(state === "invalid" || state === "error") && (
          <div className="flex flex-col items-center gap-3 py-4">
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-destructive">
              {state === "invalid" ? "Lien invalide ou expiré." : "Une erreur est survenue. Réessayez plus tard."}
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>Retour à l'accueil</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;

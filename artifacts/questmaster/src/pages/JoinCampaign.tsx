import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Sword, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const JoinCampaign = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<"pending" | "joining" | "success" | "error">("pending");
  const [errorMsg, setErrorMsg] = useState("");

  const joinMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const result = await campaignsApi.join(inviteCode.trim());
      return result.campaign_id;
    },
    onSuccess: (campaignId) => {
      setStatus("success");
      toast({ title: "Bienvenue !", description: "Vous avez rejoint la campagne." });
      setTimeout(() => navigate(`/campaigns/${campaignId}`), 1200);
    },
    onError: (err: Error) => {
      setStatus("error");
      setErrorMsg(err?.message || "Code invalide ou expiré.");
    },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/sign-in?redirect=/join/${code}`, { replace: true });
      return;
    }
    if (code && status === "pending") {
      setStatus("joining");
      joinMutation.mutate(code);
    }
  }, [user, loading, code]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-dark px-4">
      {/* Logo */}
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
        {/* Titre */}
        <h1 className="font-display text-2xl font-bold text-gradient-gold mb-2">
          Rejoindre une campagne
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Code : <span className="font-mono text-amber-400 font-semibold tracking-widest">{code}</span>
        </p>

        {/* États */}
        {(status === "pending" || status === "joining") && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">Connexion à la campagne…</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
            <p className="text-sm text-green-400 font-medium">Campagne rejointe ! Redirection…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-destructive">{errorMsg}</p>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/campaigns")}>
                Mes campagnes
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setStatus("joining");
                  setErrorMsg("");
                  joinMutation.mutate(code!);
                }}
              >
                <Sword className="mr-1.5 h-3.5 w-3.5" />
                Réessayer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinCampaign;

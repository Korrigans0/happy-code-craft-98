import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, KeyRound, CheckCircle2, XCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase envoie le token dans le hash de l'URL
    // Il faut écouter onAuthStateChange pour récupérer la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        } else if (session) {
          setSessionReady(true);
        }
      }
    );
    // Vérifier si une session existe déjà
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
      else {
        // Attendre 2s pour le callback Supabase
        setTimeout(() => {
          setSessionReady(prev => prev === null ? false : prev);
        }, 2000);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast({ title: "Mot de passe trop court", description: "Minimum 8 caractères.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mot de passe mis à jour ✓", description: "Vous pouvez vous connecter." });
      navigate("/sign-in");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-dark px-4">
      <img src="/aetheria-logo.png" alt="Aetheria"
        className="mb-8 h-20 w-20 rounded-full object-cover"
        style={{ filter: "drop-shadow(0 0 20px hsl(43,75%,50%,0.5))" }} />

      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: "hsl(215,60%,11%)",
          border: "1px solid hsl(43,75%,50%,0.2)",
          boxShadow: "0 20px 60px hsl(0,0%,0%,0.6)",
        }}>

        <div className="mb-6 text-center">
          <KeyRound className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h1 className="font-display text-2xl font-bold text-gradient-gold">
            Nouveau mot de passe
          </h1>
        </div>

        {sessionReady === null && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">Vérification du lien…</p>
          </div>
        )}

        {sessionReady === false && (
          <div className="flex flex-col items-center gap-4 py-4">
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-destructive text-center">
              Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.
            </p>
            <Button variant="outline" onClick={() => navigate("/sign-in")}>
              Retour à la connexion
            </Button>
          </div>
        )}

        {sessionReady === true && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Nouveau mot de passe</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Confirmer le mot de passe</Label>
              <Input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                className="bg-slate-800 border-slate-600 text-white"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
            {password && confirm && password !== confirm && (
              <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
            )}
            {password && confirm && password === confirm && (
              <p className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle2 className="h-3 w-3" /> Mots de passe identiques
              </p>
            )}
            <Button
              className="w-full font-bold"
              style={{
                background: "linear-gradient(135deg, hsl(43,75%,50%) 0%, hsl(35,85%,40%) 100%)",
                color: "hsl(215,70%,8%)",
              }}
              onClick={handleSubmit}
              disabled={loading || password.length < 8 || password !== confirm}
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mise à jour…</>
                : "Mettre à jour le mot de passe"
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

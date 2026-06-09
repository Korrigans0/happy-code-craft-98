import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Auth = () => {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = params.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const REMEMBER_KEY = "aetheria.remember.credentials";
  const remembered = (() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      return raw ? (JSON.parse(raw) as { email?: string; password?: string }) : null;
    } catch {
      return null;
    }
  })();
  const [email, setEmail] = useState(remembered?.email ?? "");
  const [password, setPassword] = useState(remembered?.password ?? "");
  const [displayName, setDisplayName] = useState("");
  const [remember, setRemember] = useState(!!remembered);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/campaigns", { replace: true });
  }, [loading, user, navigate]);

  if (loading) return null;
  if (user) return <Navigate to="/campaigns" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre email pour confirmer.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }));
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
        toast.success("Connexion réussie");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error instanceof Error ? result.error.message : String(result.error));
      return;
    }
    if (result.redirected) return;
    navigate("/campaigns", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-dark px-4">
      <Card className="w-full max-w-md p-6 space-y-4 border-amber-500/20">
        <h1 className="text-2xl font-bold text-center text-amber-100 font-cinzel">
          {mode === "signin" ? "Connexion à Aetheria" : "Rejoindre Aetheria"}
        </h1>
        <Button type="button" variant="outline" className="w-full" onClick={google}>
          Continuer avec Google
        </Button>
        <div className="text-center text-xs text-muted-foreground">ou</div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1">
              <Label>Nom d'aventurier</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Mot de passe</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "..." : mode === "signin" ? "Se connecter" : "Créer un compte"}
          </Button>
        </form>
        <div className="flex justify-between text-sm">
          <button
            type="button"
            className="text-amber-400 hover:text-amber-300"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Créer un compte" : "J'ai déjà un compte"}
          </button>
          {mode === "signin" && (
            <button
              type="button"
              className="text-muted-foreground hover:text-amber-300"
              onClick={async () => {
                if (!email) { toast.error("Entrez votre email d'abord"); return; }
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) toast.error(error.message);
                else toast.success("Email de réinitialisation envoyé");
              }}
            >
              Mot de passe oublié ?
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;

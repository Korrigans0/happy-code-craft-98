import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { exchangeCode, ownsPendingState } from "../auth/oauth";

/**
 * OAuth redirect target. In the Symbiote window (same browser) the code is exchanged
 * automatically; in a separate browser the code is shown as the link code to paste.
 */
export default function TaleSpireLinkPage() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const denied = params.get("error");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const sameWindow = ownsPendingState(state);

  useEffect(() => {
    if (code && sameWindow) {
      exchangeCode(code).then(() => window.location.replace("/talespire")).catch((e) => setError(e.message));
    }
  }, [code, sameWindow]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-center">
        <h1 className="font-display text-xl text-gradient-gold">Liaison TaleSpire</h1>
        {denied && <p className="text-sm text-destructive">Connexion refusée. Vous pouvez fermer cette page.</p>}
        {!denied && !code && <p className="text-sm text-muted-foreground">Lancez la liaison depuis le module Aetheria dans TaleSpire.</p>}
        {code && sameWindow && !error && <p className="text-sm text-muted-foreground">Connexion en cours…</p>}
        {code && !sameWindow && (
          <>
            <p className="text-sm text-muted-foreground">Copiez ce code de liaison et collez-le dans TaleSpire. Il n'est valable que quelques minutes et une seule fois.</p>
            <code className="block break-all rounded-md bg-muted p-3 text-sm">{code}</code>
            <Button onClick={() => navigator.clipboard?.writeText(code).then(() => setCopied(true))}>{copied ? "Copié" : "Copier le code"}</Button>
          </>
        )}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      </div>
    </div>
  );
}

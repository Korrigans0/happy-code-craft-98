import { useCallback, useEffect, useState } from "react";
import { Loader2, Plug, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Grant { client: { id: string; name?: string | null }; scopes?: string[]; granted_at: string }

const AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user/oauth/grants`;

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Session expirée");
  return { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string };
}

/** Lists external apps (TaleSpire module, assistants…) linked to the account and revokes them. */
export default function ConnectedAppsCard() {
  const { toast } = useToast();
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(AUTH_URL, { headers: await authHeaders() });
      setGrants(res.ok ? ((await res.json()) as Grant[]) : []);
    } catch { setGrants([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const revoke = async (clientId: string) => {
    setBusy(clientId);
    try {
      const res = await fetch(`${AUTH_URL}?client_id=${encodeURIComponent(clientId)}`, { method: "DELETE", headers: await authHeaders() });
      if (!res.ok && res.status !== 204) throw new Error();
      toast({ title: "Accès révoqué", description: "Cette application devra être liée à nouveau." });
      await load();
    } catch {
      toast({ title: "Révocation impossible", description: "Réessayez dans un instant.", variant: "destructive" });
    } finally { setBusy(null); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2"><Plug className="h-5 w-5 text-primary" /> Applications liées</CardTitle>
        <CardDescription>Modules et outils externes (comme TaleSpire) autorisés à accéder à vos fiches. Révoquez-les à tout moment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {grants === null && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        {grants?.length === 0 && <p className="text-sm text-muted-foreground">Aucune application liée.</p>}
        {grants?.map((g) => (
          <div key={g.client.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm">{g.client.name || "Application externe"}</p>
              <p className="text-xs text-muted-foreground">Liée le {new Date(g.granted_at).toLocaleString("fr-BE")}</p>
            </div>
            <Button variant="outline" size="sm" disabled={busy === g.client.id} onClick={() => revoke(g.client.id)}>
              {busy === g.client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              <span className="ml-1">Révoquer</span>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Copy, KeyRound, Loader2, Plus, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TIER_LABEL, isSubscriptionTier } from "@/lib/subscriptions";

type KeyStatus = "available" | "used" | "disabled";
interface PartnerKeyRow {
  id: string; key_hint: string; plan: string; status: KeyStatus; created_at: string;
  activated_at: string | null; expires_at: string | null; disabled_at: string | null;
  activated_by: string | null; activated_email: string | null; activated_name: string | null;
}

const STATUS_LABEL: Record<KeyStatus, string> = { available: "Disponible", used: "Utilisée", disabled: "Désactivée" };
const STATUS_CLASS: Record<KeyStatus, string> = {
  available: "bg-cyan-400/15 text-cyan-200 border-cyan-400/30",
  used: "bg-amber-400/15 text-amber-200 border-amber-400/30",
  disabled: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};
const MAX_BATCH = 500;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const rpc = (name: string, args?: Record<string, unknown>) => (supabase as any).rpc(name, args);

async function copyText(text: string, label: string) {
  try { await navigator.clipboard.writeText(text); toast.success(label); } catch { toast.error("Copie impossible"); }
}

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Server-side check: has_role is evaluated by the database, not by the browser.
  const { data: isAdmin, isLoading: checking } = useQuery({
    queryKey: ["admin-check", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const [count, setCount] = useState(10);
  const [fresh, setFresh] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | KeyStatus>("all");
  const [search, setSearch] = useState("");

  const keysQuery = useQuery({
    queryKey: ["partner-keys"], enabled: !!isAdmin,
    queryFn: async (): Promise<PartnerKeyRow[]> => {
      const { data, error } = await rpc("admin_list_partner_keys");
      if (error) throw error;
      return data ?? [];
    },
  });

  const generate = useMutation({
    mutationFn: async (n: number) => {
      const { data, error } = await rpc("admin_generate_partner_keys", { _count: n });
      if (error) throw error;
      return (data ?? []).map((r: { partner_key: string }) => r.partner_key) as string[];
    },
    onSuccess: (keys) => { setFresh(keys); toast.success(`${keys.length} clé(s) générée(s)`); queryClient.invalidateQueries({ queryKey: ["partner-keys"] }); },
    onError: () => toast.error("Génération impossible"),
  });

  const disable = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rpc("admin_disable_partner_key", { _key_id: id });
      if (error) throw error;
      if (!data) throw new Error("not_available");
    },
    onSuccess: () => { toast.success("Clé désactivée"); queryClient.invalidateQueries({ queryKey: ["partner-keys"] }); },
    onError: () => toast.error("Seule une clé disponible peut être désactivée"),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (keysQuery.data ?? []).filter((r) => (filter === "all" || r.status === filter) &&
      (!q || [r.key_hint, r.activated_email, r.activated_name].some((v) => v?.toLowerCase().includes(q))));
  }, [keysQuery.data, filter, search]);

  if (checking) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <SEO title="Administration — Aétheria VTT" description="Espace d’administration" path="/admin" />
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 md:px-6">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-gradient-gold md:text-4xl"><ShieldCheck className="h-8 w-8 text-amber-400" /> Administration</h1>

        <section className="mt-8 rounded-2xl border border-amber-400/20 bg-slate-950/60 p-5 md:p-6">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-slate-100"><KeyRound className="h-6 w-6 text-amber-300" /> Clés partenaires</h2>
          <p className="mt-1 text-sm text-slate-400">Plan : Premium Mixte · 365 jours à partir de l’activation · usage unique. Les clés complètes ne sont affichées qu’une seule fois, à leur génération.</p>

          <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); generate.mutate(count); }}>
            <label className="flex flex-col gap-1 text-sm text-slate-300">Nombre de clés
              <Input type="number" min={1} max={MAX_BATCH} value={count} onChange={(e) => setCount(Math.min(MAX_BATCH, Math.max(1, Number(e.target.value) || 1)))} className="min-h-11 w-full sm:w-32" />
            </label>
            <Button type="submit" className="min-h-11 font-bold" disabled={generate.isPending}>{generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Générer des clés</Button>
          </form>

          {fresh.length > 0 && (
            <div className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-cyan-100">Nouvelles clés — copiez-les maintenant, elles ne seront plus affichées.</p>
                <Button size="sm" variant="outline" onClick={() => copyText(fresh.join("\n"), `${fresh.length} clés copiées`)}><Copy className="mr-2 h-4 w-4" />Tout copier</Button>
              </div>
              <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
                {fresh.map((k) => (
                  <li key={k} className="flex items-center justify-between gap-2 rounded bg-slate-950/60 px-3 py-1.5">
                    <code className="break-all font-mono text-sm text-slate-100">{k}</code>
                    <Button size="icon" variant="ghost" aria-label="Copier la clé" onClick={() => copyText(k, "Clé copiée")}><Copy className="h-4 w-4" /></Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="grid h-auto grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="all">Toutes</TabsTrigger><TabsTrigger value="available">Disponibles</TabsTrigger>
                <TabsTrigger value="used">Utilisées</TabsTrigger><TabsTrigger value="disabled">Désactivées</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative md:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher clé ou utilisateur" className="pl-9" /></div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <Table className="min-w-[860px]">
              <TableHeader><TableRow><TableHead>Clé</TableHead><TableHead>Plan</TableHead><TableHead>Statut</TableHead><TableHead>Créée le</TableHead><TableHead>Activée le</TableHead><TableHead>Expire le</TableHead><TableHead>Utilisateur</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {keysQuery.isLoading && <TableRow><TableCell colSpan={8} className="text-center text-slate-400">Chargement…</TableCell></TableRow>}
                {!keysQuery.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-slate-400">Aucune clé</TableCell></TableRow>}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.key_hint}</TableCell>
                    <TableCell>{isSubscriptionTier(r.plan) ? TIER_LABEL[r.plan] : r.plan}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</Badge></TableCell>
                    <TableCell>{fmt(r.created_at)}</TableCell>
                    <TableCell>{fmt(r.activated_at)}</TableCell>
                    <TableCell>{fmt(r.expires_at)}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{r.activated_email ? `${r.activated_name ? r.activated_name + " · " : ""}${r.activated_email}` : "—"}</TableCell>
                    <TableCell>{r.status === "available" && <Button size="sm" variant="ghost" className="text-red-300" disabled={disable.isPending} onClick={() => disable.mutate(r.id)}><Ban className="mr-1 h-4 w-4" />Désactiver</Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

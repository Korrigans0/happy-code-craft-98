import { Suspense, useState } from "react";
import { Loader2, LogOut, Menu, RefreshCw, X, Link2, CloudOff, Check, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaleSpireAuth } from "../auth/useTaleSpireAuth";
import { useCharacterManager } from "../characters/useCharacterManager";
import { systemFor } from "../systems/registry";
import { patchFromSheetSave } from "../sync/pendingPatch";
import type { SyncStatus } from "../sync/characterSync";
import { accessLabel } from "../permissions/permissions";

const STATUS: Record<SyncStatus, { label: string; Icon: typeof Check; cls: string }> = {
  synced: { label: "Synchronisé", Icon: Check, cls: "text-primary" },
  pending: { label: "En attente", Icon: Loader2, cls: "text-muted-foreground" },
  saving: { label: "Enregistrement…", Icon: Loader2, cls: "text-muted-foreground animate-spin" },
  offline: { label: "Hors ligne — sera envoyé", Icon: CloudOff, cls: "text-destructive" },
  error: { label: "Erreur", Icon: AlertTriangle, cls: "text-destructive" },
  readonly: { label: "Lecture seule", Icon: Eye, cls: "text-muted-foreground" },
};

function SignIn({ auth }: { auth: ReturnType<typeof useTaleSpireAuth> }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <h1 className="font-display text-2xl text-gradient-gold text-center">Aetheria VTT</h1>
      <p className="text-sm text-muted-foreground text-center">Retrouvez vos fiches de personnage directement dans TaleSpire.</p>
      <Button disabled={busy} onClick={() => run(auth.signInHere)}>Se connecter avec mon compte</Button>
      <div className="rounded-md border border-border p-3 space-y-2">
        <p className="text-sm font-display">Code de liaison</p>
        <p className="text-xs text-muted-foreground">Ouvrez la page de liaison dans votre navigateur, connectez-vous, puis collez ici le code affiché.</p>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => run(auth.prepareLinkCode)}>
          <Link2 className="mr-1 h-4 w-4" /> Obtenir un code
        </Button>
        {auth.linkUrl && (
          <div className="space-y-2">
            <Input readOnly value={auth.linkUrl} onFocus={(e) => e.currentTarget.select()} aria-label="Adresse de liaison" />
            <Input placeholder="Collez le code de liaison" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button size="sm" disabled={busy || !code.trim()} onClick={() => run(() => auth.submitLinkCode(code))}>Valider</Button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}

export default function TaleSpireApp() {
  const auth = useTaleSpireAuth();
  const mgr = useCharacterManager(auth.client, !!auth.tokens);
  const [listOpen, setListOpen] = useState(true);

  if (!auth.tokens) return <div className="min-h-screen bg-background text-foreground"><SignIn auth={auth} /></div>;

  const entry = mgr.active ? mgr.sync.get(mgr.active) : undefined;
  const view = mgr.active ? mgr.sync.view(mgr.active) : null;
  const system = systemFor(view?.system);
  const status = entry ? STATUS[entry.status] : null;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center gap-2 border-b border-border px-2 py-1">
        <Button size="icon" variant="ghost" aria-label="Personnages" onClick={() => setListOpen((v) => !v)}><Menu className="h-4 w-4" /></Button>
        <span className="font-display text-sm text-gradient-gold">Aetheria</span>
        <nav className="flex flex-1 gap-1 overflow-x-auto" aria-label="Fiches ouvertes">
          {mgr.tabs.map((id) => {
            const c = mgr.sync.view(id) ?? mgr.list.find((l) => l.id === id);
            return (
              <div key={id} className={`flex items-center rounded-md border px-2 text-xs ${mgr.active === id ? "border-primary text-primary" : "border-border"}`}>
                <button className="max-w-[9rem] truncate py-1" onClick={() => mgr.setActive(id)}>{c?.name ?? "…"}</button>
                <button aria-label="Fermer la fiche" className="ml-1" onClick={() => mgr.close(id)}><X className="h-3 w-3" /></button>
              </div>
            );
          })}
        </nav>
        {status && <span className={`flex items-center gap-1 text-xs ${status.cls.replace("animate-spin", "")}`}><status.Icon className={`h-3 w-3 ${status.cls.includes("spin") ? "animate-spin" : ""}`} />{status.label}</span>}
        <Button size="icon" variant="ghost" aria-label="Se déconnecter" onClick={auth.logout}><LogOut className="h-4 w-4" /></Button>
      </header>
      <div className="flex min-h-0 flex-1">
        {listOpen && (
          <aside className="w-56 shrink-0 overflow-y-auto border-r border-border p-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-xs">Personnages</span>
              <Button size="icon" variant="ghost" aria-label="Actualiser" onClick={mgr.refresh}><RefreshCw className={`h-3 w-3 ${mgr.loading ? "animate-spin" : ""}`} /></Button>
            </div>
            {mgr.error && <p className="text-xs text-destructive">{mgr.error}</p>}
            {!mgr.loading && !mgr.list.length && <p className="text-xs text-muted-foreground">Aucun personnage.</p>}
            <ul className="space-y-1">
              {mgr.list.map((c) => (
                <li key={c.id}>
                  <button onClick={() => mgr.open(c.id)} className={`w-full rounded-md px-2 py-1 text-left hover:bg-muted ${mgr.active === c.id ? "bg-muted" : ""}`}>
                    <div className="truncate text-sm">{c.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{c.system} · {c.is_owner ? "Mon personnage" : "Campagne"}</div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <main className="min-w-0 flex-1 overflow-auto">
          {!mgr.active && <p className="p-6 text-sm text-muted-foreground">Choisissez un personnage dans la liste.</p>}
          {mgr.active && !view && <div className="p-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          {view && entry && (
            <>
              <div className="px-3 py-1 text-[11px] text-muted-foreground">
                {accessLabel({ isOwner: view.user_id === auth.tokens.user_id, canEdit: entry.canEdit })}
                {entry.error && <span className="ml-2 text-destructive">{entry.error}</span>}
              </div>
              {system?.Sheet ? (
                <Suspense fallback={<Loader2 className="m-6 h-5 w-5 animate-spin text-primary" />}>
                  <system.Sheet
                    key={`${mgr.active}:${entry.remoteRevision}`}
                    character={view}
                    editable={entry.canEdit}
                    onSheetSave={(save) => mgr.sync.edit(mgr.active!, patchFromSheetSave(view, save))}
                  />
                </Suspense>
              ) : (
                <p className="p-6 text-sm text-muted-foreground">Le système « {view.system} » arrivera bientôt dans TaleSpire.</p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

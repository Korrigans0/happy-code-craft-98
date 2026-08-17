import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { campaignsApi, charactersApi, profilesApi } from "@/lib/api";
import { describeAuditEntry } from "@/components/campaign/CampaignHistory";
import {
  Map, Users, CalendarDays, BookOpen, Library as LibraryIcon, Dices,
  Sparkles, ArrowRight, Clock, ScrollText,
} from "lucide-react";

interface DashCampaign {
  id: string;
  title: string;
  system?: string | null;
  image_url?: string | null;
  updated_at: string;
  user_id: string;
}

function formatCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "maintenant";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `dans ${days} j ${hours} h`;
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `dans ${hours} h ${minutes} min`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["dash-profile", user?.id],
    queryFn: () => profilesApi.getMe(),
    enabled: !!user,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["dash-campaigns", user?.id],
    queryFn: () => campaignsApi.list() as Promise<DashCampaign[]>,
    enabled: !!user,
  });

  const { data: characters = [], isLoading: charsLoading } = useQuery({
    queryKey: ["dash-characters", user?.id],
    queryFn: () => charactersApi.list(),
    enabled: !!user,
  });

  const campaignIds = useMemo(() => campaigns.map((c) => c.id), [campaigns]);

  const { data: sessions = [] } = useQuery({
    queryKey: ["dash-sessions", campaignIds],
    queryFn: async () => {
      const all = await Promise.all(
        campaigns.map(async (c) => {
          const list = (await campaignsApi.getSessions(c.id)) as any[];
          return list.map((s) => ({ ...s, campaign: c }));
        }),
      );
      return all
        .flat()
        .filter((s) => s.scheduled_at && !s.completed_at && new Date(s.scheduled_at).getTime() > Date.now() - 3600000)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    },
    enabled: campaignIds.length > 0,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["dash-players", campaignIds],
    queryFn: async () => {
      const all = await Promise.all(campaigns.map((c) => campaignsApi.getMembers(c.id) as Promise<any[]>));
      const seen = new Map<string, any>();
      all.flat().forEach((m) => { if (m.user_id && m.user_id !== user?.id) seen.set(m.user_id, m); });
      return Array.from(seen.values());
    },
    enabled: campaignIds.length > 0,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["dash-activity", campaignIds],
    queryFn: async () => {
      const all = await Promise.all(
        campaigns.map(async (c) => {
          const rows = (await campaignsApi.getAuditLog(c.id)) as any[];
          return rows.slice(0, 10).map((r) => ({ ...r, campaign: c }));
        }),
      );
      return all
        .flat()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 12);
    },
    enabled: campaignIds.length > 0,
  });

  const nextSession = sessions[0];
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Voyageur";

  const shortcuts = [
    { to: "/campaigns", label: "Mes campagnes", icon: Map },
    { to: "/characters", label: "Personnages", icon: Users },
    { to: "/compendium", label: "Codex", icon: BookOpen },
    { to: "/library", label: "Bibliothèque", icon: LibraryIcon },
    { to: "/dice", label: "Dés", icon: Dices },
    { to: "/systems", label: "Systèmes", icon: Sparkles },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <SEO
        title="Tableau de bord — Aetheria VTT"
        description="Retrouvez vos campagnes, vos prochaines sessions, vos personnages et vos dernières activités sur Aetheria VTT."
        path="/dashboard"
      />
      <Header />
      <main className="container mx-auto flex-1 px-4 py-6">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold text-gradient-gold sm:text-3xl">
            Salut, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre table est prête. Voici l'essentiel de vos aventures.
          </p>
        </header>

        {/* Prochaine session */}
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 border-amber-500/20 bg-card/70 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400" />
            <div>
              <p className="font-display text-sm font-semibold">Prochaine session</p>
              {nextSession ? (
                <p className="text-sm text-muted-foreground">
                  {nextSession.title} — {nextSession.campaign.title} ·{" "}
                  <span className="text-amber-400">{formatCountdown(nextSession.scheduled_at)}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune session planifiée.</p>
              )}
            </div>
          </div>
          {nextSession ? (
            <Button onClick={() => navigate(`/campaigns/${nextSession.campaign.id}`)}>
              Rejoindre la table <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" onClick={() => navigate("/campaigns")}>
              Planifier une session
            </Button>
          )}
        </Card>

        {/* Raccourcis */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {shortcuts.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="flex flex-col items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-3 text-center text-xs transition-colors hover:border-amber-500/40 hover:bg-muted/40"
            >
              <s.icon className="h-5 w-5 text-amber-400" />
              {s.label}
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Campagnes */}
          <section className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Mes campagnes</h2>
              <Link to="/campaigns" className="text-sm text-primary hover:underline">Tout voir</Link>
            </div>
            {campaignsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
                Aucune campagne. Créez votre première aventure.
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {campaigns.slice(0, 6).map((c) => (
                  <Card
                    key={c.id}
                    className="cursor-pointer overflow-hidden border-border/60 bg-card/60 transition-colors hover:border-amber-500/40"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                  >
                    {c.image_url && (
                      <img src={c.image_url} alt={`Bannière de ${c.title}`} loading="lazy" className="h-20 w-full object-cover" />
                    )}
                    <div className="space-y-1 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{c.title}</span>
                        {c.user_id === user?.id && <Badge variant="outline" className="text-[10px]">MJ</Badge>}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{c.system ?? "Aetheria"}</span>
                        <span>{new Date(c.updated_at).toLocaleDateString("fr-BE")}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Activité */}
            <div className="mt-6">
              <h2 className="mb-3 font-display text-lg font-semibold">Dernières modifications</h2>
              {activity.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-card/40 p-4 text-center text-sm text-muted-foreground">
                  Rien de neuf pour l'instant.
                </Card>
              ) : (
                <ul className="space-y-2">
                  {activity.map((a: any) => (
                    <li key={a.id}>
                      <Card className="flex flex-wrap items-center justify-between gap-2 border-border/60 bg-card/60 p-3 text-sm">
                        <span>{describeAuditEntry(a)}</span>
                        <span className="text-xs text-muted-foreground">
                          {a.campaign.title} · {new Date(a.created_at).toLocaleString("fr-BE")}
                        </span>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Colonne latérale */}
          <aside className="space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Mes personnages</h2>
                <Link to="/characters" className="text-sm text-primary hover:underline">Tout voir</Link>
              </div>
              {charsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (characters as any[]).length === 0 ? (
                <Card className="border-dashed border-border/60 bg-card/40 p-4 text-center text-sm text-muted-foreground">
                  Aucun personnage.
                </Card>
              ) : (
                <ul className="space-y-2">
                  {(characters as any[]).slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <Card className="flex items-center gap-3 border-border/60 bg-card/60 p-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={c.avatar_url ?? undefined} alt={c.name} />
                          <AvatarFallback>{c.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.system} · niv. {c.level}
                          </p>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold">Joueurs de mes tables</h2>
              {players.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-card/40 p-4 text-center text-sm text-muted-foreground">
                  Invitez des joueurs depuis vos campagnes.
                </Card>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {players.slice(0, 12).map((p: any) => (
                    <div key={p.user_id} className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-2 py-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={p.avatar_url ?? undefined} alt={p.display_name ?? "Joueur"} />
                        <AvatarFallback>{(p.display_name ?? "J").slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{p.display_name || p.character_name || "Joueur"}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold">Sessions à venir</h2>
              {sessions.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-card/40 p-4 text-center text-sm text-muted-foreground">
                  Aucune session planifiée.
                </Card>
              ) : (
                <ul className="space-y-2">
                  {sessions.slice(0, 5).map((s: any) => (
                    <li key={s.id}>
                      <Card className="border-border/60 bg-card/60 p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 text-amber-400" />
                          <span className="truncate">{s.title}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {s.campaign.title} · {new Date(s.scheduled_at).toLocaleString("fr-BE")}
                        </p>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Card className="border-border/60 bg-card/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-amber-400" />
                <h2 className="font-display text-sm font-semibold">Astuce</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Appuyez sur <kbd className="rounded bg-muted px-1">Ctrl</kbd> +{" "}
                <kbd className="rounded bg-muted px-1">K</kbd> pour ouvrir la recherche rapide.
              </p>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

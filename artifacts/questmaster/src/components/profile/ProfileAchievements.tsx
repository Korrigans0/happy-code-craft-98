// ProfileAchievements — statistiques de joueur et hauts faits.
// Tout est calculé côté client à partir des données déjà accessibles à
// l'utilisateur (RLS inchangée) : aucune donnée d'un autre compte n'est lue.

import { useQuery } from "@tanstack/react-query";
import {
  Award, BookOpen, Castle, Dices, Flame, Image as ImageIcon, Loader2, Scroll, Sparkles, Users,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Props {
  userId: string;
  memberSince?: string | null;
}

interface Stats {
  characters: number;
  campaignsOwned: number;
  campaignsJoined: number;
  sessionsPlayed: number;
  codexEntries: number;
  assets: number;
  systems: string[];
}

interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: typeof Award;
  value: number;
  goal: number;
}

async function fetchStats(userId: string): Promise<Stats> {
  const count = { count: "exact" as const, head: true };

  const [chars, owned, memberships, media] = await Promise.all([
    supabase.from("characters").select("system", { count: "exact" }).eq("user_id", userId),
    supabase.from("campaigns").select("id", count).eq("user_id", userId),
    supabase.from("campaign_members").select("campaign_id").eq("user_id", userId),
    supabase.from("media_assets").select("id", count).eq("owner_id", userId),
  ]);

  const campaignIds = (memberships.data ?? []).map((m: any) => m.campaign_id).filter(Boolean);

  let sessionsPlayed = 0;
  let codexEntries = 0;
  if (campaignIds.length > 0) {
    const [sessions, codex] = await Promise.all([
      supabase
        .from("campaign_sessions")
        .select("id", count)
        .in("campaign_id", campaignIds)
        .not("completed_at", "is", null),
      supabase.from("campaign_entities").select("id", count).eq("created_by", userId),
    ]);
    sessionsPlayed = sessions.count ?? 0;
    codexEntries = codex.count ?? 0;
  }

  const systems = Array.from(
    new Set((chars.data ?? []).map((c: any) => c.system).filter(Boolean)),
  ) as string[];

  return {
    characters: chars.count ?? 0,
    campaignsOwned: owned.count ?? 0,
    campaignsJoined: campaignIds.length,
    sessionsPlayed,
    codexEntries,
    assets: media.count ?? 0,
    systems,
  };
}

function buildAchievements(s: Stats): Achievement[] {
  return [
    { id: "first-char", label: "Premier héros", description: "Créer un personnage", icon: Users, value: s.characters, goal: 1 },
    { id: "troupe", label: "Compagnie complète", description: "Créer 5 personnages", icon: Users, value: s.characters, goal: 5 },
    { id: "first-camp", label: "Maître de jeu", description: "Créer une campagne", icon: Castle, value: s.campaignsOwned, goal: 1 },
    { id: "chronicler", label: "Chroniqueur", description: "10 entrées de codex", icon: BookOpen, value: s.codexEntries, goal: 10 },
    { id: "veteran", label: "Vétéran des tables", description: "10 sessions terminées", icon: Flame, value: s.sessionsPlayed, goal: 10 },
    { id: "polyglot", label: "Explorateur de mondes", description: "Jouer 3 systèmes différents", icon: Sparkles, value: s.systems.length, goal: 3 },
    { id: "curator", label: "Conservateur", description: "25 médias dans la bibliothèque", icon: ImageIcon, value: s.assets, goal: 25 },
    { id: "guildmaster", label: "Chef de guilde", description: "Rejoindre 5 campagnes", icon: Scroll, value: s.campaignsJoined, goal: 5 },
  ];
}

const StatTile = ({ icon: Icon, label, value }: { icon: typeof Award; label: string; value: number }) => (
  <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-center">
    <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
    <p className="font-display text-xl text-foreground">{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </div>
);

export default function ProfileAchievements({ userId, memberSince }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: () => fetchStats(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <Card className="border-border bg-gradient-card">
        <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement des hauts faits…
        </CardContent>
      </Card>
    );
  }

  const achievements = buildAchievements(data);
  const unlocked = achievements.filter((a) => a.value >= a.goal);

  return (
    <div className="space-y-6">
      <Card className="border-border bg-gradient-card">
        <CardHeader>
          <CardTitle className="text-foreground">Statistiques d'aventurier</CardTitle>
          <CardDescription>
            {memberSince
              ? `Compagnon d'Aetheria depuis le ${new Date(memberSince).toLocaleDateString("fr-BE", { year: "numeric", month: "long", day: "numeric" })}`
              : "Votre parcours sur Aetheria VTT"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile icon={Users} label="Personnages" value={data.characters} />
          <StatTile icon={Castle} label="Campagnes menées" value={data.campaignsOwned} />
          <StatTile icon={Scroll} label="Campagnes rejointes" value={data.campaignsJoined} />
          <StatTile icon={Flame} label="Sessions jouées" value={data.sessionsPlayed} />
          <StatTile icon={BookOpen} label="Entrées de codex" value={data.codexEntries} />
          <StatTile icon={ImageIcon} label="Médias" value={data.assets} />
        </CardContent>
      </Card>

      <Card className="border-border bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Award className="h-5 w-5 text-primary" /> Hauts faits
              </CardTitle>
              <CardDescription>Vos exploits sur la table</CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary">
              {unlocked.length} / {achievements.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {achievements.map((a) => {
            const done = a.value >= a.goal;
            const pct = Math.min(100, (a.value / a.goal) * 100);
            return (
              <div
                key={a.id}
                className={`rounded-lg border p-3 transition-colors ${
                  done ? "border-primary/50 bg-primary/10" : "border-border/60 bg-secondary/20"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <a.icon className={`h-4 w-4 ${done ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                    {a.label}
                  </p>
                  {done && <Dices className="ml-auto h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{a.description}</p>
                <Progress value={pct} className="h-1.5" />
                <p className="mt-1 text-right text-[10px] text-muted-foreground">
                  {Math.min(a.value, a.goal)} / {a.goal}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

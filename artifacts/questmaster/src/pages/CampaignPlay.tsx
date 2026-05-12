import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Loader2, MessageSquare, Swords, BookOpen, Users, 
  Settings, Copy, ArrowLeft, Crown, Map, CalendarDays,
  Volume2, ExternalLink, Wand2, Gamepad2
} from "lucide-react";
import CampaignChat from "@/components/campaign/CampaignChat";
import CampaignCombat from "@/components/campaign/CampaignCombat";
import CampaignNotes from "@/components/campaign/CampaignNotes";
import CampaignMembers from "@/components/campaign/CampaignMembers";
import CampaignSettings from "@/components/campaign/CampaignSettings";
import CampaignTabletop from "@/components/campaign/CampaignTabletop";
import CampaignSessions from "@/components/campaign/CampaignSessions";
import GMTools from "@/components/campaign/GMTools";

interface Campaign {
  id: string;
  title: string;
  description?: string | null;
  system?: string | null;
  is_active: boolean;
  user_id: string;
  invite_code?: string | null;
  discord_link?: string | null;
  created_at: string;
}

const CampaignPlay = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("tabletop");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/sign-in');
    }
  }, [user, authLoading, navigate]);

  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      return campaignsApi.get(id!) as Promise<Campaign>;
    },
    enabled: !!id && !!user,
  });

  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ["campaignMembership", id, user?.id],
    queryFn: async () => {
      const members = await campaignsApi.getMembers(id!);
      return members.find((m: any) => m.user_id === user!.id) || null;
    },
    enabled: !!id && !!user,
  });

  const isGM = membership?.role === 'gm';

  const copyInviteCode = () => {
    if (campaign?.invite_code) {
      navigator.clipboard.writeText(campaign.invite_code);
      toast({
        title: "Code copié !",
        description: "Partagez ce code avec vos joueurs.",
      });
    }
  };

  const openDiscord = () => {
    if (campaign?.discord_link) {
      window.open(campaign.discord_link, "_blank", "noopener,noreferrer");
    }
  };

  if (authLoading || campaignLoading || membershipLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-dark">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Campagne introuvable</h1>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/campaigns")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux campagnes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-dark">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Accès refusé</h1>
            <p className="mt-2 text-muted-foreground">Vous n'êtes pas membre de cette campagne.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/campaigns")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux campagnes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Foundry VTT URL from localStorage (reactive)
  const foundryKey = `foundry_url_${id}`;
  const [foundryUrl, setFoundryUrl] = useState(() => localStorage.getItem(foundryKey) || "");
  const [foundryIframeBlocked, setFoundryIframeBlocked] = useState(false);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === foundryKey) setFoundryUrl(e.newValue || "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [foundryKey]);

  const tabs = [
    { id: "tabletop", icon: Map, label: "Partie" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "combat", icon: Swords, label: "Combat" },
    { id: "sessions", icon: CalendarDays, label: "Sessions" },
    { id: "notes", icon: BookOpen, label: "Notes" },
    { id: "members", icon: Users, label: "Joueurs" },
    ...(foundryUrl ? [{ id: "foundry", icon: Gamepad2, label: "Foundry" }] : []),
    ...(isGM ? [{ id: "gmtools", icon: Wand2, label: "Outils MJ" }] : []),
    ...(isGM ? [{ id: "settings", icon: Settings, label: "Options" }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex flex-1 flex-col">

        {/* ── CAMPAIGN HEADER ──────────────────────────────── */}
        <div className="border-b border-border bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">

            {/* Gauche : retour + infos campagne */}
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/campaigns")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-lg font-bold text-foreground truncate sm:text-xl">
                    {campaign.title}
                  </h1>
                  {isGM && (
                    <Badge variant="default" className="shrink-0 bg-primary/20 text-primary">
                      <Crown className="mr-1 h-3 w-3" />
                      MJ
                    </Badge>
                  )}
                  {campaign.system && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {campaign.system}
                    </Badge>
                  )}
                </div>
                <p className="hidden text-sm text-muted-foreground sm:block truncate">
                  {campaign.description || "Pas de description"}
                </p>
              </div>
            </div>

            {/* Droite : boutons actions */}
            <div className="flex shrink-0 items-center gap-2">

              {/* Bouton Discord — visible par tous si configuré */}
              {campaign.discord_link && (
                <Button
                  onClick={openDiscord}
                  size="sm"
                  className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                >
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Vocal</span>
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </Button>
              )}

              {/* Code invitation — MJ seulement */}
              {isGM && campaign.invite_code && (
                <Button variant="outline" size="sm" onClick={copyInviteCode} className="hidden sm:flex">
                  <Copy className="mr-2 h-4 w-4" />
                  Code: {campaign.invite_code}
                </Button>
              )}
              {isGM && campaign.invite_code && (
                <Button variant="outline" size="icon" onClick={copyInviteCode} className="sm:hidden">
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────────── */}
        <div className="container mx-auto flex-1 px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            <TabsList
              className="grid w-full bg-muted"
              style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
            >
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4 flex-1">
              <TabsContent value="tabletop" className="m-0 h-full">
                <CampaignTabletop campaignId={id!} isGM={isGM} />
              </TabsContent>
              <TabsContent value="chat" className="m-0 h-full">
                <CampaignChat campaignId={id!} isGM={isGM} />
              </TabsContent>
              <TabsContent value="combat" className="m-0 h-full">
                <CampaignCombat campaignId={id!} isGM={isGM} />
              </TabsContent>
              <TabsContent value="sessions" className="m-0 h-full">
                <CampaignSessions campaignId={id!} isGM={isGM} />
              </TabsContent>
              <TabsContent value="notes" className="m-0 h-full">
                <CampaignNotes campaignId={id!} isGM={isGM} />
              </TabsContent>
              <TabsContent value="members" className="m-0 h-full">
                <CampaignMembers campaignId={id!} isGM={isGM} />
              </TabsContent>
              {foundryUrl && (
                <TabsContent value="foundry" className="m-0 h-full">
                  <div className="relative flex h-[calc(100vh-220px)] min-h-[500px] flex-col rounded-lg overflow-hidden border border-orange-500/30 bg-black">
                    {/* Toolbar */}
                    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-orange-500/20 bg-card/90 px-3 py-1.5 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-medium text-orange-300">Foundry VTT</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:block">{foundryUrl}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setFoundryIframeBlocked(false); }}
                          className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Recharger"
                        >
                          ↻ Recharger
                        </button>
                        <button
                          onClick={() => window.open(foundryUrl, "_blank")}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Ouvrir dans un nouvel onglet"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ouvrir
                        </button>
                      </div>
                    </div>

                    {/* iframe */}
                    {!foundryIframeBlocked ? (
                      <iframe
                        key={foundryUrl}
                        src={foundryUrl}
                        className="flex-1 w-full border-0"
                        title="Foundry VTT"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                        onError={() => setFoundryIframeBlocked(true)}
                      />
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                        <Gamepad2 className="h-12 w-12 text-orange-400/50" />
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-foreground">Foundry bloque l'intégration iframe</p>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Le serveur Foundry refuse d'être intégré. Activez l'option dans<br/>
                            <strong className="text-foreground">Foundry → Paramètres → Configuration → Autoriser l'intégration iframe</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => window.open(foundryUrl, "_blank")}
                          className="flex items-center gap-2 rounded-lg bg-orange-500/20 border border-orange-500/40 px-4 py-2 text-sm text-orange-300 hover:bg-orange-500/30 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ouvrir Foundry dans un onglet séparé
                        </button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
              {isGM && (
                <TabsContent value="gmtools" className="m-0 h-full">
                  <GMTools />
                </TabsContent>
              )}
              {isGM && (
                <TabsContent value="settings" className="m-0 h-full">
                  <CampaignSettings campaign={campaign} />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

      </main>
    </div>
  );
};

export default CampaignPlay;

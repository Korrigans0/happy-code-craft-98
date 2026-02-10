import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { 
  Loader2, MessageSquare, Swords, BookOpen, Users, 
  Settings, Copy, ArrowLeft, Send, Dices, Crown, Map
} from "lucide-react";
import CampaignChat from "@/components/campaign/CampaignChat";
import CampaignCombat from "@/components/campaign/CampaignCombat";
import CampaignNotes from "@/components/campaign/CampaignNotes";
import CampaignMembers from "@/components/campaign/CampaignMembers";
import CampaignSettings from "@/components/campaign/CampaignSettings";
import CampaignTabletop from "@/components/campaign/CampaignTabletop";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;

const CampaignPlay = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("tabletop");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Check if user is a member and their role
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ["campaignMembership", id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_members")
        .select("*, character:characters(*)")
        .eq("campaign_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex flex-1 flex-col">
        {/* Campaign Header */}
        <div className="border-b border-border bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/campaigns")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-bold text-foreground">{campaign.title}</h1>
                  {isGM && (
                    <Badge variant="default" className="bg-primary/20 text-primary">
                      <Crown className="mr-1 h-3 w-3" />
                      MJ
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{campaign.description || "Pas de description"}</p>
              </div>
            </div>
            {isGM && campaign.invite_code && (
              <Button variant="outline" size="sm" onClick={copyInviteCode}>
                <Copy className="mr-2 h-4 w-4" />
                Code: {campaign.invite_code}
              </Button>
            )}
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="flex-1 container mx-auto px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6 bg-muted">
              <TabsTrigger value="tabletop" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Partie</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="combat" className="flex items-center gap-2">
                <Swords className="h-4 w-4" />
                <span className="hidden sm:inline">Combat</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Joueurs</span>
              </TabsTrigger>
              {isGM && (
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Options</span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1 mt-4">
              <TabsContent value="tabletop" className="h-full m-0">
                <CampaignTabletop campaignId={id!} isGM={isGM} />
              </TabsContent>
              <TabsContent value="chat" className="h-full m-0">
                <CampaignChat campaignId={id!} userId={user!.id} isGM={isGM} />
              </TabsContent>
              <TabsContent value="combat" className="h-full m-0">
                <CampaignCombat campaignId={id!} isGM={isGM} />
              </TabsContent>
              <TabsContent value="notes" className="h-full m-0">
                <CampaignNotes campaignId={id!} userId={user!.id} isGM={isGM} />
              </TabsContent>
              <TabsContent value="members" className="h-full m-0">
                <CampaignMembers campaignId={id!} isGM={isGM} />
              </TabsContent>
              {isGM && (
                <TabsContent value="settings" className="h-full m-0">
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Filter, Sword, Calendar, Settings, Trash2, Play, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;

const Campaigns = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  
  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create campaign
  const createMutation = useMutation({
    mutationFn: async (campaign: { title: string; description: string; is_active: boolean }) => {
      if (!user) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          title: campaign.title,
          description: campaign.description || null,
          is_active: campaign.is_active,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
      toast({
        title: "Campagne créée",
        description: "Votre campagne a été créée avec succès.",
      });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewIsActive(true);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la campagne.",
        variant: "destructive",
      });
    },
  });

  // Delete campaign
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
      toast({
        title: "Campagne supprimée",
        description: "La campagne a été supprimée.",
      });
      setDeleteConfirmOpen(false);
      setCampaignToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la campagne.",
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("campaigns")
        .update({ is_active })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
    },
  });

  // Join campaign by invite code
  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error("Non authentifié");
      // Find campaign by invite code
      const { data: campaign, error: findError } = await supabase
        .from("campaigns")
        .select("id")
        .eq("invite_code", code.trim())
        .single();
      if (findError || !campaign) throw new Error("Code invalide");
      
      // Check if already a member
      const { data: existing } = await supabase
        .from("campaign_members")
        .select("id")
        .eq("campaign_id", campaign.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) throw new Error("Vous êtes déjà membre");
      
      // Join as player
      const { error: joinError } = await supabase
        .from("campaign_members")
        .insert({ campaign_id: campaign.id, user_id: user.id, role: "player" });
      if (joinError) throw joinError;
      return campaign.id;
    },
    onSuccess: (campaignId) => {
      toast({ title: "Rejoint !", description: "Vous avez rejoint la campagne." });
      setIsJoinOpen(false);
      setJoinCode("");
      navigate(`/campaigns/${campaignId}`);
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!newTitle.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est requis.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      title: newTitle,
      description: newDescription,
      is_active: newIsActive,
    });
  };

  const handleDelete = (id: string) => {
    setCampaignToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (campaignToDelete) {
      deleteMutation.mutate(campaignToDelete);
    }
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Mes Campagnes
              </h1>
              <p className="text-muted-foreground">
                Gérez vos aventures et sessions de jeu
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsJoinOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Rejoindre
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="gold">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Campagne
                  </Button>
                </DialogTrigger>
              <DialogTrigger asChild>
                <Button variant="gold">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Campagne
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une campagne</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle campagne pour vos aventures.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="La Malédiction de Strahd"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Une aventure sombre dans les terres de Barovie..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Campagne active</Label>
                    <Switch
                      id="active"
                      checked={newIsActive}
                      onCheckedChange={setNewIsActive}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    variant="gold" 
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
             </Dialog>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une campagne..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-xl border border-border/50 bg-muted"
                />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <Sword className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                Aucune campagne
              </h3>
              <p className="mt-2 text-muted-foreground">
                Créez votre première campagne pour commencer l'aventure !
              </p>
              <Button variant="gold" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une campagne
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-card p-6 shadow-card transition-all duration-300 hover:border-primary/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                      <Sword className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-lg font-semibold text-foreground truncate">
                          {campaign.title}
                        </h3>
                        <Badge variant={campaign.is_active ? "active" : "inactive"}>
                          {campaign.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {campaign.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {campaign.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <Button variant="join" size="sm" className="flex-1" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          Ouvrir
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: campaign.id, 
                            is_active: !campaign.is_active 
                          })}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la campagne ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La campagne sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join by Code Dialog */}
      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejoindre une campagne</DialogTitle>
            <DialogDescription>
              Entrez le code d'invitation partagé par le Maître du Jeu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Code d'invitation</Label>
              <Input
                id="invite-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="ABC123"
                className="text-center text-lg tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="gold"
              onClick={() => joinMutation.mutate(joinCode)}
              disabled={!joinCode.trim() || joinMutation.isPending}
            >
              {joinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rejoindre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
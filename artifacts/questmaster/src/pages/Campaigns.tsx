import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus, Search, Sword, Calendar, Settings, Trash2, Play,
  Loader2, KeyRound, CheckCircle, XCircle, Crown, User,
  Users, Dices,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GAME_SYSTEMS } from "@/lib/game-systems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageAmbiance from "@/components/fantasy/PageAmbiance";
import { BannerUpload } from "@/components/campaign/BannerUpload";
import { toast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  title: string;
  description?: string | null;
  system?: string | null;
  is_active: boolean;
  user_id: string;
  invite_code?: string | null;
  image_url?: string | null;
  created_at: string;
}

const SYSTEM_COLORS: Record<string, string> = {
  "Aetheria":            "from-amber-900/80 to-amber-700/40",
  "D&D 5e":             "from-red-900/80 to-red-700/40",
  "Pathfinder 2e":      "from-orange-900/80 to-orange-700/40",
  "Call of Cthulhu":    "from-green-950/90 to-green-900/50",
  "Warhammer 4":        "from-stone-900/90 to-stone-700/40",
  "Savage Worlds":      "from-yellow-900/80 to-yellow-700/40",
  "Starfinder":         "from-blue-900/80 to-blue-700/40",
  "Chroniques Oubliées":"from-purple-900/80 to-purple-700/40",
  "Symbaroum":          "from-emerald-950/90 to-emerald-900/50",
  "Autre":              "from-slate-900/80 to-slate-700/40",
};

const DEFAULT_BANNERS: Record<string, string> = {
  "Aetheria":            "linear-gradient(135deg, #1a0a2e 0%, #0f1f3d 50%, #2d1b00 100%)",
  "D&D 5e":             "linear-gradient(135deg, #1a0000 0%, #2d0808 50%, #1a0a0a 100%)",
  "Pathfinder 2e":      "linear-gradient(135deg, #1a0800 0%, #2d1200 50%, #1a0f00 100%)",
  "Call of Cthulhu":    "linear-gradient(135deg, #000a04 0%, #001a08 50%, #000f02 100%)",
  "Warhammer 4":        "linear-gradient(135deg, #1a1a12 0%, #2d2d1a 50%, #12120a 100%)",
  "Starfinder":         "linear-gradient(135deg, #00001a 0%, #00082d 50%, #00051a 100%)",
};

function getDefaultBanner(system?: string | null) {
  return system && DEFAULT_BANNERS[system]
    ? DEFAULT_BANNERS[system]
    : "linear-gradient(135deg, #050d1a 0%, #0f2040 50%, #1a0a00 100%)";
}

function getSystemGradient(system?: string | null) {
  return system && SYSTEM_COLORS[system]
    ? SYSTEM_COLORS[system]
    : "from-slate-900/80 to-slate-700/40";
}

const Campaigns = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newSystem, setNewSystem] = useState("Aetheria");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newPlannedSessions, setNewPlannedSessions] = useState<string>("");
  const [newLevelMin, setNewLevelMin] = useState<string>("");
  const [newLevelMax, setNewLevelMax] = useState<string>("");
  const [newMaxPlayers, setNewMaxPlayers] = useState<string>("5");
  const [newSchedule, setNewSchedule] = useState("");
  const [newTone, setNewTone] = useState("");
  const [newTags, setNewTags] = useState("");

  const resetCreateForm = () => {
    setNewTitle(""); setNewDescription(""); setNewSummary("");
    setNewSystem("Aetheria"); setNewIsActive(true); setNewImageUrl("");
    setNewPlannedSessions(""); setNewLevelMin(""); setNewLevelMax("");
    setNewMaxPlayers("5"); setNewSchedule(""); setNewTone(""); setNewTags("");
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/sign-in");
  }, [user, authLoading, navigate]);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return campaignsApi.list();
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (c: Record<string, unknown>) => {
      if (!user) throw new Error("Non authentifié");
      return campaignsApi.create(c);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
      toast({ title: "Campagne créée !", description: "Votre campagne est prête." });
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: () => toast({ title: "Impossible de créer la campagne", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Non authentifié");
      return campaignsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
      toast({ title: "Campagne supprimée" });
      setDeleteConfirmId(null);
    },
    onError: () => toast({ title: "Impossible de supprimer", variant: "destructive" }),
  });

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error("Non authentifié");
      const result = await campaignsApi.join(code.trim().toUpperCase());
      return result.campaign_id;
    },
    onSuccess: (campaignId) => {
      toast({ title: "Bienvenue !", description: "Vous avez rejoint la campagne." });
      setIsJoinOpen(false);
      setJoinCode("");
      navigate(`/campaigns/${campaignId}`);
    },
    onError: (err: Error) => toast({ title: "Code invalide", description: err.message, variant: "destructive" }),
  });

  const filteredCampaigns = campaigns
    .filter((c: Campaign) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((c: Campaign) =>
      filterStatus === "all" ? true : filterStatus === "active" ? c.is_active : !c.is_active
    );

  const myCount = campaigns.filter((c: Campaign) => c.user_id === user?.id).length;
  const joinedCount = campaigns.filter((c: Campaign) => c.user_id !== user?.id).length;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <PageAmbiance />
      <Header />
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 md:px-6">

          {/* ── En-tête ── */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Mes Campagnes</h1>
              <p className="mt-1 text-muted-foreground">
                Gérez vos aventures et sessions de jeu
              </p>
              {campaigns.length > 0 && (
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Crown className="h-3.5 w-3.5 text-primary" />
                    {myCount} en tant que MJ
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {joinedCount} en tant que joueur
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer une campagne</DialogTitle>
                    <DialogDescription>
                      Définissez les paramètres de départ. Vous pourrez tout modifier ensuite.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-2">
                    {/* Bannière */}
                    <div className="space-y-2">
                      <Label>Bannière de campagne</Label>
                      <BannerUpload value={newImageUrl} onChange={setNewImageUrl} />
                      <p className="text-xs text-muted-foreground">Image affichée en haut de la fiche campagne et sur la carte.</p>
                    </div>

                    {/* Titre */}
                    <div className="space-y-2">
                      <Label htmlFor="new-title">Titre *</Label>
                      <Input
                        id="new-title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="La Malédiction de Strahd"
                        autoFocus
                      />
                    </div>

                    {/* Résumé court */}
                    <div className="space-y-2">
                      <Label htmlFor="new-summary">Résumé court (info)</Label>
                      <Input
                        id="new-summary"
                        value={newSummary}
                        onChange={(e) => setNewSummary(e.target.value.slice(0, 140))}
                        placeholder="Horreur gothique en Barovie — 4 à 6 joueurs"
                        maxLength={140}
                      />
                      <p className="text-xs text-muted-foreground">{newSummary.length}/140 — Une phrase d'accroche pour vos joueurs.</p>
                    </div>

                    {/* Description longue */}
                    <div className="space-y-2">
                      <Label htmlFor="new-desc">Description complète</Label>
                      <Textarea
                        id="new-desc"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Une aventure sombre dans les terres de Barovie…"
                        rows={4}
                      />
                    </div>

                    {/* Système */}
                    <div className="space-y-2">
                      <Label>Système de jeu</Label>
                      <Select value={newSystem} onValueChange={setNewSystem}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GAME_SYSTEMS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newSystem === "Personnalisé" ? (
                        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1.5">
                          <p className="font-medium text-primary">✨ Mode Personnalisé — règles libres</p>
                          <p>Mélangez librement <strong>Worlds Awakening</strong>, <strong>Aetheria</strong> et vos propres créations.</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Astuce : choisissez <strong>✨ Personnalisé</strong> pour mélanger WA, Aetheria et vos créations.
                        </p>
                      )}
                    </div>

                    {/* Niveaux + joueurs */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-lvl-min">Niveau min</Label>
                        <Input id="new-lvl-min" type="number" min={1} value={newLevelMin}
                          onChange={(e) => setNewLevelMin(e.target.value)} placeholder="1" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-lvl-max">Niveau max</Label>
                        <Input id="new-lvl-max" type="number" min={1} value={newLevelMax}
                          onChange={(e) => setNewLevelMax(e.target.value)} placeholder="10" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-max-players">Joueurs max</Label>
                        <Input id="new-max-players" type="number" min={1} max={20} value={newMaxPlayers}
                          onChange={(e) => setNewMaxPlayers(e.target.value)} placeholder="5" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-sessions">Sessions prévues</Label>
                        <Input id="new-sessions" type="number" min={1} value={newPlannedSessions}
                          onChange={(e) => setNewPlannedSessions(e.target.value)} placeholder="12" />
                      </div>
                    </div>

                    {/* Rythme + tonalité */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new-schedule">Rythme / planning</Label>
                        <Input id="new-schedule" value={newSchedule}
                          onChange={(e) => setNewSchedule(e.target.value)}
                          placeholder="Tous les vendredis 20h" />
                      </div>
                      <div className="space-y-2">
                        <Label>Tonalité</Label>
                        <Select value={newTone || "non-defini"} onValueChange={(v) => setNewTone(v === "non-defini" ? "" : v)}>
                          <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="non-defini">Non défini</SelectItem>
                            <SelectItem value="serieux">Sérieux / immersif</SelectItem>
                            <SelectItem value="heroique">Héroïque</SelectItem>
                            <SelectItem value="sombre">Sombre / horreur</SelectItem>
                            <SelectItem value="leger">Léger / humoristique</SelectItem>
                            <SelectItem value="mixte">Mixte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label htmlFor="new-tags">Étiquettes (séparées par des virgules)</Label>
                      <Input id="new-tags" value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        placeholder="dark fantasy, enquête, politique" />
                    </div>

                    {/* Active */}
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">Campagne active</p>
                        <p className="text-xs text-muted-foreground">Les joueurs peuvent rejoindre et interagir</p>
                      </div>
                      <Switch id="new-active" checked={newIsActive} onCheckedChange={setNewIsActive} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                    <Button
                      variant="gold"
                      onClick={() => {
                        if (!newTitle.trim()) {
                          toast({ title: "Le titre est requis", variant: "destructive" }); return;
                        }
                        const lmin = newLevelMin ? Number(newLevelMin) : null;
                        const lmax = newLevelMax ? Number(newLevelMax) : null;
                        if (lmin && lmax && lmin > lmax) {
                          toast({ title: "Le niveau min doit être ≤ niveau max", variant: "destructive" }); return;
                        }
                        createMutation.mutate({
                          title: newTitle,
                          description: newDescription,
                          summary: newSummary || null,
                          system: newSystem,
                          is_active: newIsActive,
                          image_url: newImageUrl || null,
                          planned_sessions: newPlannedSessions ? Number(newPlannedSessions) : null,
                          level_min: lmin,
                          level_max: lmax,
                          max_players: newMaxPlayers ? Number(newMaxPlayers) : null,
                          schedule: newSchedule || null,
                          tone: newTone || null,
                          tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
                        });
                      }}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Créer la campagne
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ── Filtres ── */}
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
            <div className="flex gap-2">
              {(["all", "active", "inactive"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filterStatus === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(f)}
                  className="gap-1.5"
                >
                  {f === "active" && <CheckCircle className="h-3.5 w-3.5" />}
                  {f === "inactive" && <XCircle className="h-3.5 w-3.5" />}
                  {f === "all" ? "Toutes" : f === "active" ? "Actives" : "Inactives"}
                </Button>
              ))}
            </div>
          </div>

          {/* ── Grille campagnes ── */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl border border-border/50 bg-muted" />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Sword className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">Aucune campagne</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                {searchQuery
                  ? "Aucune campagne ne correspond à votre recherche."
                  : "Créez votre première campagne ou rejoignez-en une avec un code d'invitation !"}
              </p>
              {!searchQuery && (
                <div className="mt-5 flex gap-2">
                  <Button variant="gold" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />Créer
                  </Button>
                  <Button variant="outline" onClick={() => setIsJoinOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />Rejoindre
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign: Campaign) => {
                const isGm = campaign.user_id === user?.id;
                const systemGradient = getSystemGradient(campaign.system);
                return (
                  <div
                    key={campaign.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-gradient-card shadow-card transition-all duration-300 hover:border-primary/40 hover:shadow-gold/10 hover:shadow-lg"
                  >
                    {/* Banner / image de couverture */}
                    <div className="relative h-40 overflow-hidden">
                      {campaign.image_url ? (
                        <img
                          src={campaign.image_url}
                          alt={campaign.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ background: getDefaultBanner(campaign.system) }}
                        />
                      )}
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${systemGradient}`} />
                      {/* Decorative pattern */}
                      <div className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255,215,0,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,215,0,0.2) 0%, transparent 50%)"
                        }}
                      />

                      {/* Badges flottants */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <Badge variant={campaign.is_active ? "active" : "inactive"} className="text-xs shadow-sm">
                          {campaign.is_active ? "● Active" : "○ Inactive"}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant="outline"
                          className={`text-xs shadow-sm border ${isGm ? "border-primary/60 bg-primary/20 text-primary" : "border-blue-400/60 bg-blue-500/20 text-blue-300"}`}
                        >
                          {isGm ? <><Crown className="mr-1 h-3 w-3" />MJ</> : <><User className="mr-1 h-3 w-3" />Joueur</>}
                        </Badge>
                      </div>

                      {/* Titre sur le banner */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-display text-lg font-bold text-white drop-shadow-lg leading-tight line-clamp-2">
                          {campaign.title}
                        </h3>
                      </div>
                    </div>

                    {/* Corps de la carte */}
                    <div className="flex flex-1 flex-col p-4 gap-3">

                      {/* Système + date */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Dices className="h-3.5 w-3.5 text-primary" />
                          {campaign.system || "Système libre"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(campaign.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Description */}
                      {campaign.description ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                          {campaign.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 italic">Aucune description</p>
                      )}

                      {/* Actions */}
                      <div className="mt-auto flex items-center gap-2 pt-1">
                        <Button
                          variant="gold"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          Ouvrir
                        </Button>
                        {isGm && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              title="Paramètres"
                              onClick={() => navigate(`/campaigns/${campaign.id}?tab=settings`)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Supprimer"
                              onClick={() => {
                                setDeleteConfirmId(campaign.id);
                                setDeleteConfirmTitle(campaign.title);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* ── Dialog : Supprimer ── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer «&nbsp;{deleteConfirmTitle}&nbsp;» ?</DialogTitle>
            <DialogDescription>
              Cette action est <strong>irréversible</strong>. La campagne et tout son contenu
              (messages, notes, sessions, plateau) seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog : Rejoindre ── */}
      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Rejoindre une campagne
            </DialogTitle>
            <DialogDescription>
              Entrez le code d'invitation fourni par votre Maître du Jeu.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">Code d'invitation</Label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="AETHERIA"
                className="text-center text-2xl font-mono tracking-[0.4em] h-14"
                maxLength={16}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.length >= 4) joinMutation.mutate(joinCode);
                }}
              />
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
              <Users className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>
                Le MJ partage son code depuis les <strong>Paramètres</strong> de la campagne.
                Vous pouvez aussi rejoindre via un lien direct envoyé par le MJ.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsJoinOpen(false); setJoinCode(""); }}>
              Annuler
            </Button>
            <Button
              variant="gold"
              onClick={() => joinMutation.mutate(joinCode)}
              disabled={joinCode.length < 4 || joinMutation.isPending}
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

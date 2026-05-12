import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Save, Trash2, RefreshCw, Copy, Link2, ExternalLink, Volume2, MessageCircle } from "lucide-react";

interface Campaign {
  id: string; title: string; description?: string | null; is_active?: boolean | null;
  invite_code?: string | null; gm_id?: string;
  discord_link?: string | null;
}

interface CampaignSettingsProps {
  campaign: Campaign;
}

const CampaignSettings = ({ campaign }: CampaignSettingsProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(campaign.title);
  const [description, setDescription] = useState(campaign.description || "");
  const [isActive, setIsActive] = useState(campaign.is_active ?? true);
  const [discordLink, setDiscordLink] = useState(campaign.discord_link || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ── Mise à jour campagne ────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async () =>
      campaignsApi.update(campaign.id, { title, description, is_active: isActive, discord_link: discordLink || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      toast({ title: "Campagne mise à jour ✓" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    },
  });

  // ── Régénérer le code d'invitation ─────────────────────
  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      return campaignsApi.update(campaign.id, { invite_code: newCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      toast({ title: "Nouveau code généré ✓" });
    },
  });

  // ── Supprimer la campagne ───────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => campaignsApi.delete(campaign.id),
    onSuccess: () => {
      toast({ title: "Campagne supprimée" });
      navigate("/campaigns");
    },
    onError: () => {
      toast({ title: "Impossible de supprimer la campagne", variant: "destructive" });
    },
  });

  const copyInviteCode = () => {
    if (campaign.invite_code) {
      navigator.clipboard.writeText(campaign.invite_code);
      toast({ title: "Code copié !" });
    }
  };

  const copyInviteLink = () => {
    if (campaign.invite_code) {
      const link = `${window.location.origin}/join/${campaign.invite_code}`;
      navigator.clipboard.writeText(link);
      toast({ title: "Lien copié !", description: "Partagez ce lien avec vos joueurs." });
    }
  };

  const isValidDiscordLink = (link: string) => {
    if (!link) return true;
    return link.startsWith("https://discord.gg/") || link.startsWith("https://discord.com/");
  };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Paramètres généraux ──────────────────────────── */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>Paramètres généraux</CardTitle>
          <CardDescription>Modifiez les informations de votre campagne</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la campagne"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la campagne..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Campagne active</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Code & lien d'invitation ─────────────────────── */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>Invitation des joueurs</CardTitle>
          <CardDescription>
            Partagez le code ou le lien direct pour que vos joueurs rejoignent la campagne
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Code */}
          <div className="space-y-2">
            <Label>Code d'invitation</Label>
            <div className="flex items-center gap-2">
              <Input
                value={campaign.invite_code || ""}
                readOnly
                className="font-mono text-lg tracking-widest text-center"
              />
              <Button variant="outline" size="icon" onClick={copyInviteCode} title="Copier le code">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => regenerateCodeMutation.mutate()}
                disabled={regenerateCodeMutation.isPending}
                title="Régénérer le code"
              >
                <RefreshCw className={`h-4 w-4 ${regenerateCodeMutation.isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Les joueurs entrent ce code sur la page "Mes Campagnes" → "Rejoindre".
            </p>
          </div>

          {/* Lien direct */}
          <div className="space-y-2">
            <Label>Lien d'invitation direct</Label>
            <div className="flex items-center gap-2">
              <Input
                value={campaign.invite_code ? `${window.location.origin}/join/${campaign.invite_code}` : "Aucun code généré"}
                readOnly
                className="text-xs text-muted-foreground truncate"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyInviteLink}
                disabled={!campaign.invite_code}
                title="Copier le lien"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le joueur clique sur ce lien et rejoint automatiquement après connexion.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Lien Discord ─────────────────────────────────── */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-indigo-400" />
            Vocal Discord
          </CardTitle>
          <CardDescription>
            Ajoutez un lien vers votre salon vocal Discord. Vos joueurs pourront rejoindre
            directement depuis l'interface de campagne.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discord">Lien d'invitation Discord</Label>
            <div className="flex gap-2">
              <Input
                id="discord"
                value={discordLink}
                onChange={(e) => setDiscordLink(e.target.value)}
                placeholder="https://discord.gg/votre-serveur"
                className={`flex-1 ${
                  discordLink && !isValidDiscordLink(discordLink)
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {discordLink && isValidDiscordLink(discordLink) && (
                <Button variant="outline" size="icon" onClick={() => window.open(discordLink, "_blank")} title="Tester le lien">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {discordLink && !isValidDiscordLink(discordLink) && (
              <p className="text-xs text-red-400">
                Le lien doit commencer par https://discord.gg/ ou https://discord.com/
              </p>
            )}
          </div>

          {discordLink && isValidDiscordLink(discordLink) && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-xs text-indigo-400 mb-2 font-semibold">Aperçu :</p>
              <div className="flex items-center gap-2 w-fit rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-semibold">
                <Volume2 className="h-4 w-4" />
                Rejoindre le vocal
              </div>
            </div>
          )}

          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || (!!discordLink && !isValidDiscordLink(discordLink))}
            variant="outline"
          >
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder le lien Discord
          </Button>
        </CardContent>
      </Card>

      {/* ── Zone de danger ───────────────────────────────── */}
      <Card className="bg-gradient-card border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteMutation.isPending ? "Suppression..." : "Supprimer la campagne"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Dialog confirmation suppression ───────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la campagne ?</DialogTitle>
            <DialogDescription>
              Cette action est <strong>irréversible</strong>. La campagne "{campaign.title}", tous ses messages,
              notes, sessions et l'état du plateau seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => { setDeleteDialogOpen(false); deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Oui, supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CampaignSettings;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Save, Trash2, RefreshCw, Copy, MessageCircle, ExternalLink, Volume2 } from "lucide-react";

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
  const [discordLink, setDiscordLink] = useState(
    (campaign as Campaign & { discord_link?: string }).discord_link || ""
  );

  // ── Mise à jour campagne ────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async () => {
      return campaignsApi.update(campaign.id, campaign.gm_id || "", { title, description, is_active: isActive, discord_link: discordLink || null });
    },
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
      return campaignsApi.update(campaign.id, campaign.gm_id || "", { invite_code: newCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      toast({ title: "Nouveau code généré ✓" });
    },
  });

  // ── Supprimer la campagne ───────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return campaignsApi.delete(campaign.id, campaign.gm_id || "");
    },
    onSuccess: () => {
      toast({ title: "Campagne supprimée" });
      navigate("/campaigns");
    },
  });

  const copyInviteCode = () => {
    if (campaign.invite_code) {
      navigator.clipboard.writeText(campaign.invite_code);
      toast({ title: "Code copié !" });
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
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(discordLink, "_blank")}
                  title="Tester le lien"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {discordLink && !isValidDiscordLink(discordLink) && (
              <p className="text-xs text-red-400">
                Le lien doit commencer par https://discord.gg/ ou https://discord.com/
              </p>
            )}
            {!discordLink && (
              <p className="text-xs text-muted-foreground">
                Créez un lien d'invitation dans Discord : clic droit sur un salon vocal → "Inviter des personnes"
              </p>
            )}
          </div>

          {/* Aperçu du bouton tel qu'il apparaîtra */}
          {discordLink && isValidDiscordLink(discordLink) && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-xs text-indigo-400 mb-2 font-semibold">
                Aperçu — Bouton affiché dans la campagne :
              </p>
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

      {/* ── Code d'invitation ────────────────────────────── */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>Code d'invitation</CardTitle>
          <CardDescription>
            Partagez ce code avec vos joueurs pour qu'ils rejoignent la campagne
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={campaign.invite_code || ""}
              readOnly
              className="font-mono text-lg tracking-widest"
            />
            <Button variant="outline" size="icon" onClick={copyInviteCode} title="Copier le code">
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => regenerateCodeMutation.mutate()}
              disabled={regenerateCodeMutation.isPending}
              title="Régénérer"
            >
              <RefreshCw className={`h-4 w-4 ${regenerateCodeMutation.isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Les joueurs peuvent utiliser ce code sur la page "Mes Campagnes" pour rejoindre votre aventure.
          </p>
        </CardContent>
      </Card>

      {/* ── Zone de danger ───────────────────────────────── */}
      <Card className="bg-gradient-card border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.")) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteMutation.isPending ? "Suppression..." : "Supprimer la campagne"}
          </Button>
        </CardContent>
      </Card>

    </div>
  );
};

export default CampaignSettings;

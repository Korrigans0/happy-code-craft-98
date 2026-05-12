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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { GAME_SYSTEMS } from "@/lib/game-systems";
import {
  Save, Trash2, RefreshCw, Copy, Link2, ExternalLink,
  Volume2, MessageCircle, Image, Shield, Users, Lock,
  Unlock, Check, AlertCircle, Shuffle,
} from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  description?: string | null;
  system?: string | null;
  is_active?: boolean | null;
  invite_code?: string | null;
  gm_id?: string;
  discord_link?: string | null;
  image_url?: string | null;
}

interface CampaignSettingsProps {
  campaign: Campaign;
}

function generateCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

const CampaignSettings = ({ campaign }: CampaignSettingsProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // General
  const [title, setTitle] = useState(campaign.title);
  const [description, setDescription] = useState(campaign.description || "");
  const [system, setSystem] = useState(campaign.system || "Aetheria");
  const [isActive, setIsActive] = useState(campaign.is_active ?? true);
  const [imageUrl, setImageUrl] = useState(campaign.image_url || "");
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Invite code
  const [inviteCode, setInviteCode] = useState(campaign.invite_code || "");
  const [codeEdited, setCodeEdited] = useState(false);

  // Discord
  const [discordLink, setDiscordLink] = useState(campaign.discord_link || "");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });

  // ── Mise à jour générale ─────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async () =>
      campaignsApi.update(campaign.id, {
        title,
        description: description || null,
        system,
        is_active: isActive,
        image_url: imageUrl || null,
        discord_link: discordLink || null,
      }),
    onSuccess: () => { invalidate(); toast({ title: "Campagne mise à jour ✓" }); },
    onError: () => toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" }),
  });

  // ── Sauvegarder le code d'invitation ─────────────────────────────────────
  const saveCodeMutation = useMutation({
    mutationFn: async () => campaignsApi.update(campaign.id, { invite_code: inviteCode }),
    onSuccess: () => {
      invalidate();
      setCodeEdited(false);
      toast({ title: "Code d'invitation mis à jour ✓" });
    },
    onError: (err: Error) => toast({ title: err.message || "Code invalide ou déjà utilisé", variant: "destructive" }),
  });

  // ── Supprimer la campagne ─────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => campaignsApi.delete(campaign.id),
    onSuccess: () => { toast({ title: "Campagne supprimée" }); navigate("/campaigns"); },
    onError: () => toast({ title: "Impossible de supprimer la campagne", variant: "destructive" }),
  });

  const handleCodeChange = (val: string) => {
    setInviteCode(val.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 16));
    setCodeEdited(true);
  };

  const shuffleCode = () => {
    const code = generateCode();
    setInviteCode(code);
    setCodeEdited(true);
  };

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast({ title: "Code copié !" });
    }
  };

  const copyLink = () => {
    if (campaign.invite_code) {
      navigator.clipboard.writeText(`${window.location.origin}/join/${campaign.invite_code}`);
      toast({ title: "Lien copié !", description: "Partagez ce lien avec vos joueurs." });
    }
  };

  const isValidDiscord = (v: string) =>
    !v || v.startsWith("https://discord.gg/") || v.startsWith("https://discord.com/");

  const isValidImageUrl = (v: string) => {
    if (!v) return true;
    try { new URL(v); return true; } catch { return false; }
  };

  const currentLink = campaign.invite_code
    ? `${window.location.origin}/join/${campaign.invite_code}`
    : null;

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ══ INFORMATIONS GÉNÉRALES ══════════════════════════════════════════ */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Informations générales
          </CardTitle>
          <CardDescription>Titre, description et système de jeu de votre campagne</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la campagne *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="La Malédiction de Strahd"
              className="font-display"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre campagne : univers, ambiance, prérequis... Ce texte sera visible par vos joueurs."
              rows={4}
            />
          </div>

          {/* Système de jeu */}
          <div className="space-y-2">
            <Label>Système de jeu</Label>
            <Select value={system} onValueChange={setSystem}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAME_SYSTEMS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statut actif */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Campagne active</p>
              <p className="text-xs text-muted-foreground">
                Les joueurs peuvent rejoindre et interagir quand la campagne est active
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? "active" : "inactive"} className="text-xs">
                {isActive ? "Active" : "Inactive"}
              </Badge>
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !title.trim()}
            variant="gold"
            className="w-full sm:w-auto"
          >
            {updateMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder les informations"}
          </Button>
        </CardContent>
      </Card>

      {/* ══ IMAGE DE COUVERTURE ═══════════════════════════════════════════════ */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Image de couverture
          </CardTitle>
          <CardDescription>
            Donnez une identité visuelle à votre campagne (URL d'image)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aperçu */}
          {imageUrl && isValidImageUrl(imageUrl) && !imagePreviewError && (
            <div className="relative overflow-hidden rounded-lg border border-border/60 aspect-video bg-muted">
              <img
                src={imageUrl}
                alt="Aperçu"
                className="h-full w-full object-cover"
                onError={() => setImagePreviewError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              <Badge className="absolute bottom-2 left-2 text-xs bg-background/80">
                Aperçu
              </Badge>
            </div>
          )}
          {imagePreviewError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Impossible de charger cette image. Vérifiez l'URL.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="image-url">URL de l'image</Label>
            <Input
              id="image-url"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImagePreviewError(false); }}
              placeholder="https://exemple.com/image-de-campagne.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Formats recommandés : JPG, PNG, WebP. Ratio 16:9 conseillé.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || (!!imageUrl && !isValidImageUrl(imageUrl))}
          >
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder l'image
          </Button>
        </CardContent>
      </Card>

      {/* ══ CODE & LIEN D'INVITATION ══════════════════════════════════════════ */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Invitation des joueurs
          </CardTitle>
          <CardDescription>
            Le MJ choisit un code d'invitation. Les joueurs l'utilisent pour rejoindre la campagne.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Code personnalisable */}
          <div className="space-y-2">
            <Label>Code d'invitation</Label>
            <div className="flex items-center gap-2">
              <Input
                value={inviteCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="font-mono text-xl tracking-[0.3em] text-center uppercase"
                maxLength={16}
                placeholder="MONCODE"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={shuffleCode}
                title="Générer un code aléatoire"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={copyCode}
                title="Copier le code"
                disabled={!inviteCode}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              4 à 16 caractères (lettres et chiffres uniquement). Les joueurs entrent ce code
              sur la page «&nbsp;Mes Campagnes&nbsp;» → «&nbsp;Rejoindre&nbsp;».
            </p>

            {codeEdited && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="gold"
                  onClick={() => saveCodeMutation.mutate()}
                  disabled={saveCodeMutation.isPending || inviteCode.length < 4}
                >
                  {saveCodeMutation.isPending ? (
                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-3.5 w-3.5" />
                  )}
                  Valider le code
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setInviteCode(campaign.invite_code || ""); setCodeEdited(false); }}
                >
                  Annuler
                </Button>
              </div>
            )}

            {!codeEdited && campaign.invite_code && (
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <Check className="h-3.5 w-3.5" />
                Code actif : <span className="font-mono font-semibold">{campaign.invite_code}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Lien direct */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Lien d'invitation direct
            </Label>
            {currentLink ? (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    value={currentLink}
                    readOnly
                    className="text-xs text-muted-foreground font-mono truncate bg-muted/40"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    title="Copier le lien"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(currentLink, "_blank")}
                    title="Tester le lien"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Le joueur clique ce lien, se connecte s'il ne l'est pas, et rejoint automatiquement.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Définissez un code d'invitation pour générer un lien direct.
              </p>
            )}
          </div>

          {/* Explication modes de jointure */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-primary">Comment rejoindre votre campagne ?</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span><strong className="text-foreground">Via le code</strong> — le joueur va sur «&nbsp;Mes Campagnes&nbsp;» → bouton «&nbsp;Rejoindre&nbsp;» et tape le code.</span>
              </div>
              <div className="flex items-start gap-2">
                <Unlock className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span><strong className="text-foreground">Via le lien</strong> — le joueur clique le lien et est ajouté automatiquement après connexion.</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══ VOCAL DISCORD ════════════════════════════════════════════════════ */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-indigo-400" />
            Vocal Discord
          </CardTitle>
          <CardDescription>
            Ajoutez un lien vocal Discord. Vos joueurs pourront le rejoindre directement depuis
            l'interface de campagne.
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
                className={`flex-1 ${discordLink && !isValidDiscord(discordLink) ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {discordLink && isValidDiscord(discordLink) && (
                <Button variant="outline" size="icon" onClick={() => window.open(discordLink, "_blank")} title="Tester">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {discordLink && !isValidDiscord(discordLink) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Le lien doit commencer par https://discord.gg/ ou https://discord.com/
              </p>
            )}
          </div>

          {discordLink && isValidDiscord(discordLink) && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-xs text-indigo-400 mb-2 font-semibold">Aperçu du bouton :</p>
              <div className="flex items-center gap-2 w-fit rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-semibold">
                <Volume2 className="h-4 w-4" />
                Rejoindre le vocal
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || (!!discordLink && !isValidDiscord(discordLink))}
          >
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder le lien Discord
          </Button>
        </CardContent>
      </Card>

      {/* ══ ZONE DE DANGER ═══════════════════════════════════════════════════ */}
      <Card className="bg-gradient-card border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles — impossible d'annuler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            La suppression efface définitivement la campagne, tous ses messages, notes, sessions,
            personnages assignés et l'état du plateau de jeu.
          </p>
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

      {/* ── Dialog confirmation suppression ───────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer «&nbsp;{campaign.title}&nbsp;» ?</DialogTitle>
            <DialogDescription>
              Cette action est <strong>irréversible</strong>. La campagne, tous ses messages,
              notes, sessions et l'état du plateau seront définitivement effacés.
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
              Oui, supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CampaignSettings;

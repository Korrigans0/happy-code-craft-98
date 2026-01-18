import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Save, Trash2, RefreshCw, Copy } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;

interface CampaignSettingsProps {
  campaign: Campaign;
}

const CampaignSettings = ({ campaign }: CampaignSettingsProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState(campaign.title);
  const [description, setDescription] = useState(campaign.description || "");
  const [isActive, setIsActive] = useState(campaign.is_active ?? true);

  // Update campaign
  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("campaigns")
        .update({ title, description, is_active: isActive })
        .eq("id", campaign.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      toast({ title: "Campagne mise à jour" });
    },
  });

  // Regenerate invite code
  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      const newCode = Math.random().toString(36).substring(2, 10);
      const { error } = await supabase
        .from("campaigns")
        .update({ invite_code: newCode })
        .eq("id", campaign.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      toast({ title: "Nouveau code généré" });
    },
  });

  // Delete campaign
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaign.id);
      if (error) throw error;
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

  return (
    <div className="space-y-6 max-w-2xl">
      {/* General Settings */}
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
            Sauvegarder
          </Button>
        </CardContent>
      </Card>

      {/* Invite Code */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>Code d'invitation</CardTitle>
          <CardDescription>Partagez ce code avec vos joueurs pour qu'ils rejoignent la campagne</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={campaign.invite_code || ""}
              readOnly
              className="font-mono text-lg"
            />
            <Button variant="outline" size="icon" onClick={copyInviteCode}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => regenerateCodeMutation.mutate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Les joueurs peuvent utiliser ce code sur la page "Mes Campagnes" pour rejoindre votre aventure.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
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
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer la campagne
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignSettings;

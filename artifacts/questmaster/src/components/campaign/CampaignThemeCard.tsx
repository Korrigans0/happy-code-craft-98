// Campaign customization card (MJ only) — ambiance, accent hue and tagline.

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Palette, Save, RotateCcw, Check } from "lucide-react";
import {
  CAMPAIGN_AMBIANCES, DEFAULT_AMBIANCE, getAmbiance,
  parseTheme, themeStyle, type CampaignTheme,
} from "@/lib/campaign/theme";

interface CampaignThemeCardProps {
  campaignId: string;
  theme?: unknown;
}

const CampaignThemeCard = ({ campaignId, theme: rawTheme }: CampaignThemeCardProps) => {
  const queryClient = useQueryClient();
  const initial = parseTheme(rawTheme);
  const [ambiance, setAmbiance] = useState(initial.ambiance ?? DEFAULT_AMBIANCE.id);
  const [hue, setHue] = useState<number>(initial.hue ?? getAmbiance(initial.ambiance).hue);
  const [tagline, setTagline] = useState(initial.tagline ?? "");

  const draft: CampaignTheme = { ambiance, hue, tagline: tagline || undefined };

  const saveMutation = useMutation({
    mutationFn: async () => campaignsApi.update(campaignId, { theme: draft } as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      toast({ title: "Ambiance de campagne enregistrée ✓" });
    },
    onError: (err: Error) =>
      toast({ title: err.message || "Impossible d'enregistrer l'ambiance", variant: "destructive" }),
  });

  const reset = () => {
    setAmbiance(DEFAULT_AMBIANCE.id);
    setHue(DEFAULT_AMBIANCE.hue);
    setTagline("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Personnalisation
        </CardTitle>
        <CardDescription>
          Choisissez l'ambiance visuelle de votre campagne. Elle s'applique à la table de jeu
          et aux onglets de la campagne, pour tous les participants.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ambiances */}
        <div className="space-y-3">
          <Label>Ambiance</Label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPAIGN_AMBIANCES.map((preset) => {
              const selected = preset.id === ambiance;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => { setAmbiance(preset.id); setHue(preset.hue); }}
                  className={`group relative overflow-hidden rounded-lg border p-3 text-left transition-all ${
                    selected
                      ? "border-primary shadow-[0_0_20px_-6px_hsl(var(--primary))]"
                      : "border-border hover:border-primary/50"
                  }`}
                  style={{ backgroundImage: preset.background }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-foreground">
                      {preset.label}
                    </span>
                    <span
                      className="h-4 w-4 shrink-0 rounded-full ring-1 ring-border"
                      style={{ background: `hsl(${selected ? hue : preset.hue} ${preset.accent.split(" ")[1]} ${preset.accent.split(" ")[2]})` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
                  {selected && (
                    <Check className="absolute bottom-2 right-2 h-4 w-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Teinte d'accent */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="campaign-hue">Teinte d'accent</Label>
            <span className="text-xs text-muted-foreground">{hue}°</span>
          </div>
          <Slider
            id="campaign-hue"
            min={0}
            max={360}
            step={1}
            value={[hue]}
            onValueChange={([v]) => setHue(v)}
          />
          <div
            className="h-2 w-full rounded-full"
            style={{
              background:
                "linear-gradient(to right, hsl(0 70% 55%), hsl(60 70% 55%), hsl(120 70% 55%), hsl(180 70% 55%), hsl(240 70% 55%), hsl(300 70% 55%), hsl(360 70% 55%))",
            }}
          />
        </div>

        {/* Baseline */}
        <div className="space-y-2">
          <Label htmlFor="campaign-tagline">Accroche (facultatif)</Label>
          <Input
            id="campaign-tagline"
            value={tagline}
            maxLength={120}
            placeholder="Les cendres d'un royaume oublié…"
            onChange={(e) => setTagline(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Affichée sous le titre de la campagne pendant la partie.
          </p>
        </div>

        {/* Aperçu */}
        <div className="space-y-2">
          <Label>Aperçu</Label>
          <div className="rounded-lg border border-border p-4" style={themeStyle(draft)}>
            <p className="font-display text-lg font-bold text-foreground">Votre campagne</p>
            {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm">Action principale</Button>
              <Button size="sm" variant="outline">Secondaire</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Enregistrement…" : "Enregistrer l'ambiance"}
          </Button>
          <Button variant="outline" onClick={reset} disabled={saveMutation.isPending}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignThemeCard;

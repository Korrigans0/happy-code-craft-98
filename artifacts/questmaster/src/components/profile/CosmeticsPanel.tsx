// CosmeticsPanel — choix des skins de dés, cadres de tokens, thème et bruitages.

import { Check, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCosmetics } from "@/hooks/useCosmetics";
import { COSMETIC_GROUPS, Cosmetics } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

const CosmeticsPanel = () => {
  const { cosmetics, update } = useCosmetics();

  return (
    <Card className="border-primary/20 bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading">
          <Palette className="h-5 w-5 text-primary" />
          Personnalisation
        </CardTitle>
        <CardDescription>
          Votre style vous suit sur toutes vos tables : dés, tokens, ambiance et bruitages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {COSMETIC_GROUPS.map((group) => {
          const current = (cosmetics as unknown as Record<string, string>)[group.key];
          return (
            <div key={group.key}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {group.options.map((opt) => {
                  const active = current === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update({ [group.key]: opt.id } as Partial<Cosmetics>)}
                      className={cn(
                        "group relative rounded-lg border p-3 text-left transition-all",
                        active
                          ? "border-primary bg-primary/10 shadow-[0_0_18px_-6px_hsl(var(--primary))]"
                          : "border-border/60 bg-background/40 hover:border-primary/50",
                      )}
                    >
                      <span
                        className="mb-2 block h-9 w-9 rounded-full border border-border/50"
                        style={{ background: opt.preview }}
                        aria-hidden
                      />
                      <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground">{opt.description}</span>
                      {active && (
                        <Check className="absolute right-2 top-2 h-4 w-4 text-primary" aria-label="Sélectionné" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CosmeticsPanel;

// Panneau latéral Glyphes de la table de jeu : jeton sélectionné (PA,
// héroïsme, blessures, approche, actions), manœuvres (charge, désengagement),
// attaque/réaction entre jetons, confrontation et journal des jets partagé.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Dices, Swords, Wind } from "lucide-react";
import GlyphesTokenPanel from "./GlyphesTokenPanel";
import GlyphesRollLog from "./GlyphesRollLog";
import GlyphesCheckDialog from "./GlyphesCheckDialog";
import GlyphesAttackDialog, { type GlyphesTargetOption } from "./GlyphesAttackDialog";
import GlyphesManeuverDialog from "./GlyphesManeuverDialog";
import GlyphesConfrontationPanel from "./GlyphesConfrontationPanel";
import { useGlyphesCombat } from "@/lib/game-systems/glyphes/useGlyphesCombat";

interface Props {
  campaignId?: string | null;
  authorName: string;
  selectedTokenId?: string | null;
  selectedTokenName?: string | null;
  canEdit: boolean;
  /** Jetons présents sur la scène, cibles potentielles d'une attaque. */
  tokens?: GlyphesTargetOption[];
  onClose?: () => void;
  /** "sidebar" : colonne fixe (desktop). "sheet" : pleine largeur (mobile). */
  variant?: "sidebar" | "sheet";
}

export default function GlyphesPanel({
  campaignId,
  authorName,
  selectedTokenId,
  selectedTokenName,
  canEdit,
  tokens = [],
  onClose,
  variant = "sidebar",
}: Props) {
  const combat = useGlyphesCombat(campaignId);
  const [checkOpen, setCheckOpen] = useState(false);
  const [attackOpen, setAttackOpen] = useState(false);
  const [maneuverOpen, setManeuverOpen] = useState(false);

  const state = selectedTokenId ? combat.getState(selectedTokenId) : null;
  const targets = useMemo(() => tokens.filter((t) => t.id !== selectedTokenId), [tokens, selectedTokenId]);

  return (
    <aside
      className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card"
      aria-label="Panneau Glyphes"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-display text-sm font-semibold text-foreground">✨ Glyphes</span>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Tabs defaultValue="jeton" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-2 mt-2 grid grid-cols-3">
          <TabsTrigger value="jeton" className="text-[11px]">Jeton</TabsTrigger>
          <TabsTrigger value="confrontation" className="text-[11px]">Confrontation</TabsTrigger>
          <TabsTrigger value="journal" className="text-[11px]">Journal</TabsTrigger>
        </TabsList>

        <TabsContent value="jeton" className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-2">
              {state && selectedTokenId ? (
                <>
                  <GlyphesTokenPanel
                    tokenName={selectedTokenName || "Jeton"}
                    state={state}
                    canEdit={canEdit}
                    onChange={(patch) => combat.update(selectedTokenId, patch)}
                    onSpend={(cost) => combat.spend(selectedTokenId, cost)}
                    onSpendHeroism={(cost) => combat.spendHeroism(selectedTokenId, cost)}
                    onStartTurn={() => combat.startTurn(selectedTokenId)}
                    onCheck={() => setCheckOpen(true)}
                    onAttack={targets.length > 0 ? () => setAttackOpen(true) : undefined}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={!canEdit}
                    onClick={() => setManeuverOpen(true)}
                  >
                    <Wind className="mr-2 h-4 w-4" /> Charge / Désengagement
                  </Button>
                  {targets.length === 0 && (
                    <p className="text-center text-[10px] text-muted-foreground">
                      <Swords className="mr-1 inline h-3 w-3" />
                      Aucune autre cible sur la scène.
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-2 p-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez un jeton pour gérer ses points d'action, son héroïsme et ses blessures.
                  </p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setCheckOpen(true)}>
                    <Dices className="mr-2 h-4 w-4" /> Lancer une épreuve
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="confrontation" className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2">
              <GlyphesConfrontationPanel
                campaignId={campaignId}
                authorName={authorName}
                canEdit={canEdit}
                tokens={tokens}
                getTokenState={(id) => combat.getState(id)}
                onHeroismChange={(id, heroism) => combat.update(id, { heroism })}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="journal" className="min-h-0 flex-1 overflow-hidden">
          <GlyphesRollLog campaignId={campaignId} className="h-full" />
        </TabsContent>
      </Tabs>

      <GlyphesCheckDialog
        open={checkOpen}
        onOpenChange={setCheckOpen}
        campaignId={campaignId}
        authorName={authorName}
        actorName={selectedTokenName || undefined}
        onResolved={(res) => {
          if (selectedTokenId && res.heroismGained > 0) {
            combat.gainHeroism(selectedTokenId, res.heroismGained);
          }
        }}
      />

      {selectedTokenId && state && (
        <>
          <GlyphesAttackDialog
            open={attackOpen}
            onOpenChange={setAttackOpen}
            campaignId={campaignId}
            authorName={authorName}
            attackerName={selectedTokenName || "Jeton"}
            attackerState={state}
            targets={targets}
            getTargetState={(id) => combat.getState(id)}
            onApplyWounds={(id, wounds) => combat.update(id, { wounds: combat.getState(id).wounds + wounds })}
            onSpendTargetHeroism={(id, cost) => combat.spendHeroism(id, cost)}
            onSpendActionPoints={(cost) => combat.spend(selectedTokenId, cost)}
          />

          <GlyphesManeuverDialog
            open={maneuverOpen}
            onOpenChange={setManeuverOpen}
            campaignId={campaignId}
            authorName={authorName}
            actorName={selectedTokenName || "Jeton"}
            availablePoints={state.actionPoints}
            onSpend={(cost) => combat.spend(selectedTokenId, cost)}
          />
        </>
      )}
    </aside>
  );
}

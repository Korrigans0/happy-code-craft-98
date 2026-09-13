// Panneau latéral Glyphes de la table de jeu : jeton sélectionné (PA,
// héroïsme, blessures, approche, actions), attaque/réaction entre jetons
// et journal des jets partagé.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Dices, Swords } from "lucide-react";
import GlyphesTokenPanel from "./GlyphesTokenPanel";
import GlyphesRollLog from "./GlyphesRollLog";
import GlyphesCheckDialog from "./GlyphesCheckDialog";
import GlyphesAttackDialog, { type GlyphesTargetOption } from "./GlyphesAttackDialog";
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
}

export default function GlyphesPanel({
  campaignId,
  authorName,
  selectedTokenId,
  selectedTokenName,
  canEdit,
  tokens = [],
  onClose,
}: Props) {
  const combat = useGlyphesCombat(campaignId);
  const [checkOpen, setCheckOpen] = useState(false);
  const [attackOpen, setAttackOpen] = useState(false);

  const state = selectedTokenId ? combat.getState(selectedTokenId) : null;
  const targets = useMemo(
    () => tokens.filter((t) => t.id !== selectedTokenId),
    [tokens, selectedTokenId],
  );

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

      <div className="space-y-2 border-b border-border p-2">
        {state && selectedTokenId ? (
          <GlyphesTokenPanel
            tokenName={selectedTokenName || "Jeton"}
            state={state}
            canEdit={canEdit}
            onChange={(patch) => combat.update(selectedTokenId, patch)}
            onSpend={(cost) => combat.spend(selectedTokenId, cost)}
            onSpendHeroism={(cost) => combat.spendHeroism(selectedTokenId, cost)}
            onStartTurn={() => combat.startTurn(selectedTokenId)}
            onCheck={() => setCheckOpen(true)}
          />
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

      <GlyphesRollLog campaignId={campaignId} className="min-h-0 flex-1" />

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
    </aside>
  );
}

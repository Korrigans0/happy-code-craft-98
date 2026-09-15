// Glyphes V0.2 — Confrontation : enjeux des deux camps, rounds, ordre de jeu
// par épreuve d'Instinct et issue déterminée par l'enjeu (jamais par le seul
// décompte des blessures).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Plus, RotateCw, Trash2 } from "lucide-react";
import {
  OUTCOME_LABELS,
  STAKES,
  deriveOutcome,
  rollInitiativeOrder,
  type ConfrontationOutcome,
  type DieSize,
  type StakeKey,
} from "@/lib/game-systems/glyphes";
import { DIE_LEVELS } from "@/lib/game-systems/glyphes";
import { useGlyphesConfrontation } from "@/lib/game-systems/glyphes/useGlyphesConfrontation";
import { broadcastGlyphesEntry, entryFromCheck } from "@/lib/game-systems/glyphes/broadcast";
import { defaultTokenState, type GlyphesTokenState } from "@/lib/game-systems/glyphes/useGlyphesCombat";

interface TokenOption {
  id: string;
  name: string;
}

interface Props {
  campaignId?: string | null;
  authorName: string;
  canEdit: boolean;
  tokens: TokenOption[];
  getTokenState: (tokenId: string) => GlyphesTokenState;
  /** Récompense / perte d'héroïsme appliquée aux jetons des joueurs. */
  onHeroismChange?: (tokenId: string, heroism: number) => void;
}

export default function GlyphesConfrontationPanel({
  campaignId,
  authorName,
  canEdit,
  tokens,
  getTokenState,
  onHeroismChange,
}: Props) {
  const conf = useGlyphesConfrontation(campaignId);
  const c = conf.confrontation;

  const [name, setName] = useState("");
  const [addTokenId, setAddTokenId] = useState("");
  const [addSide, setAddSide] = useState<"joueurs" | "adversaires">("joueurs");
  const [instinctDie, setInstinctDie] = useState<DieSize>(6);
  const [instinctLevel, setInstinctLevel] = useState(1);

  if (!c) {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-card/80 p-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Flag className="h-3 w-3 text-primary" /> Confrontation
        </p>
        <p className="text-[11px] text-muted-foreground">
          Une confrontation se gagne sur son enjeu, pas sur le décompte des blessures.
        </p>
        <Input
          placeholder="Nom de la confrontation"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
        />
        <Button size="sm" className="w-full" disabled={!canEdit} onClick={() => conf.start(name)}>
          <Plus className="mr-2 h-3 w-3" /> Ouvrir une confrontation
        </Button>
      </div>
    );
  }

  const suggested = deriveOutcome(c);

  const addParticipant = () => {
    const token = tokens.find((t) => t.id === addTokenId);
    if (!token) return;
    const st = getTokenState(token.id) ?? defaultTokenState();
    conf.addParticipant({
      id: token.id,
      name: token.name,
      side: addSide,
      tokenId: token.id,
      instinctSuccess: false,
      actionPoints: st.actionPoints,
      maxActionPoints: st.maxActionPoints,
      approach: st.approach,
      heroism: st.heroism,
      wounds: st.wounds,
      maxWounds: st.maxWounds,
      resilience: st.resilience,
      armor: st.armor,
      hasShield: st.hasShield,
      spentHeroismThisTurn: st.spentHeroismThisTurn,
      movedFt: st.movedFt,
    });
    setAddTokenId("");
  };

  const rollInstinct = (participantId: string, participantName: string, surprised?: boolean) => {
    const res = rollInitiativeOrder({
      name: participantName,
      instinctDie,
      aptitudeLevel: instinctLevel,
      surprised,
    });
    if (res.check) broadcastGlyphesEntry(campaignId, entryFromCheck(authorName, res.check));
    conf.updateParticipant(participantId, { instinctSuccess: res.success });
    conf.reorder();
  };

  const applyOutcome = (outcome: ConfrontationOutcome) => {
    conf.resolve(outcome);
    if (!onHeroismChange) return;
    for (const p of c.participants) {
      if (p.side !== "joueurs" || !p.tokenId) continue;
      if (outcome === "victoire") onHeroismChange(p.tokenId, Math.min(5, p.heroism + 5));
      if (outcome === "defaite") onHeroismChange(p.tokenId, 0);
    }
  };

  const stakeEditor = (which: "playerStake" | "opponentStake", label: string) => {
    const stake = c[which];
    return (
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
        <Select
          value={stake?.key ?? "personnalise"}
          onValueChange={(v) =>
            conf.patch({ [which]: { ...(stake ?? { text: "", fulfilled: null }), key: v as StakeKey } } as any)
          }
          disabled={!canEdit}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STAKES.map((s) => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="h-8 text-xs"
          placeholder="Formulation de l'enjeu"
          value={stake?.text ?? ""}
          disabled={!canEdit}
          onChange={(e) =>
            conf.patch({ [which]: { key: stake?.key ?? "personnalise", ...stake, text: e.target.value } } as any)
          }
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={stake?.fulfilled === true ? "default" : "outline"}
            className="h-7 flex-1 text-[10px]"
            disabled={!canEdit}
            onClick={() =>
              conf.patch({ [which]: { key: stake?.key ?? "personnalise", text: stake?.text ?? "", ...stake, fulfilled: true } } as any)
            }
          >
            Rempli
          </Button>
          <Button
            size="sm"
            variant={stake?.fulfilled === false ? "destructive" : "outline"}
            className="h-7 flex-1 text-[10px]"
            disabled={!canEdit}
            onClick={() =>
              conf.patch({ [which]: { key: stake?.key ?? "personnalise", text: stake?.text ?? "", ...stake, fulfilled: false } } as any)
            }
          >
            Échoué
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 rounded-lg border border-primary/40 bg-card/80 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          <Flag className="h-3 w-3 text-primary" /> {c.name}
        </span>
        <Badge variant="secondary" className="text-[10px]">Round {c.round}</Badge>
      </div>

      {stakeEditor("playerStake", "Enjeu des joueurs")}
      {stakeEditor("opponentStake", "Enjeu adverse")}

      {/* Participants et ordre de jeu */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Ordre de jeu (épreuve d'Instinct)
        </Label>
        <div className="grid grid-cols-2 gap-1">
          <Select value={String(instinctDie)} onValueChange={(v) => setInstinctDie(Number(v) as DieSize)}>
            <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIE_LEVELS.map((d) => (
                <SelectItem key={d.size} value={String(d.size)}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            max={5}
            className="h-7 text-[11px]"
            value={instinctLevel}
            onChange={(e) => setInstinctLevel(Number(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          {c.participants.map((p) => (
            <div key={p.id} className="flex items-center gap-1 rounded border border-border px-2 py-1">
              <span className="flex-1 truncate text-[11px]">
                {p.side === "joueurs" ? "🛡️" : "👹"} {p.name}
              </span>
              {p.instinctSuccess && <Badge className="h-4 px-1 text-[9px]">Instinct ✓</Badge>}
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40"
                disabled={!canEdit}
                onClick={() => rollInstinct(p.id, p.name, p.surprised)}
                title="Lancer l'épreuve d'Instinct"
              >
                🎲
              </button>
              <button
                className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                disabled={!canEdit}
                onClick={() => conf.removeParticipant(p.id)}
                aria-label="Retirer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {c.participants.length === 0 && (
            <p className="text-[11px] text-muted-foreground">Aucun participant pour l'instant.</p>
          )}
        </div>

        <div className="flex gap-1">
          <Select value={addTokenId} onValueChange={setAddTokenId} disabled={!canEdit}>
            <SelectTrigger className="h-7 flex-1 text-[11px]"><SelectValue placeholder="Jeton" /></SelectTrigger>
            <SelectContent className="max-h-60">
              {tokens.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={addSide} onValueChange={(v) => setAddSide(v as "joueurs" | "adversaires")} disabled={!canEdit}>
            <SelectTrigger className="h-7 w-28 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="joueurs">Joueurs</SelectItem>
              <SelectItem value="adversaires">Adversaires</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-7 px-2" disabled={!canEdit || !addTokenId} onClick={addParticipant}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Round et issue */}
      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px]" disabled={!canEdit} onClick={conf.advanceRound}>
          <RotateCw className="mr-1 h-3 w-3" /> Round suivant
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-[11px]" disabled={!canEdit} onClick={conf.end}>
          Clore
        </Button>
      </div>

      <div className="space-y-1 rounded border border-border p-2">
        <p className="text-[10px] text-muted-foreground">
          Issue suggérée par les enjeux : <span className="text-foreground">{OUTCOME_LABELS[suggested]}</span>
        </p>
        <div className="grid grid-cols-3 gap-1">
          {(["victoire", "nulle", "defaite"] as ConfrontationOutcome[]).map((o) => (
            <Button
              key={o}
              size="sm"
              variant={c.outcome === o ? "default" : "outline"}
              className="h-7 text-[10px]"
              disabled={!canEdit}
              onClick={() => applyOutcome(o)}
            >
              {o === "victoire" ? "Victoire" : o === "nulle" ? "Nulle" : "Défaite"}
            </Button>
          ))}
        </div>
        {c.outcome !== "en-cours" && (
          <p className="text-[10px] text-primary">{OUTCOME_LABELS[c.outcome]}</p>
        )}
      </div>
    </div>
  );
}

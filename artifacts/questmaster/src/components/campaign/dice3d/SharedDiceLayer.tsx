// Listens to the campaign dice channel and shows other players' 3D rolls
// tumbling over the map. The three.js scene is lazy-loaded on the first roll.
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getDiceChannel, type DiceRollBroadcast } from "@/lib/vtt/diceBroadcast";
import { useSharedDicePreference } from "@/lib/vtt/sharedDicePreference";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MAX_CONCURRENT_SHARED_ROLLS,
  MAX_SHARED_DICE_DESKTOP,
  MAX_SHARED_DICE_MOBILE,
  parseSharedRoll,
  type SharedRoll,
} from "./sharedRoll";

const SharedDiceScene = lazy(() => import("./SharedDiceScene"));

/** A WebGL failure must never take the tabletop down: the result card remains. */
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface SharedDiceLayerProps {
  campaignId: string;
  userId?: string | null;
}

const SharedDiceLayer = ({ campaignId, userId }: SharedDiceLayerProps) => {
  const [enabled] = useSharedDicePreference();
  const isMobile = useIsMobile();
  const [rolls, setRolls] = useState<SharedRoll[]>([]);
  const [broken, setBroken] = useState(false);
  const config = useRef({ enabled, userId, maxDice: MAX_SHARED_DICE_DESKTOP });
  config.current = {
    enabled: enabled && !broken,
    userId,
    maxDice: isMobile ? MAX_SHARED_DICE_MOBILE : MAX_SHARED_DICE_DESKTOP,
  };

  useEffect(() => {
    if (!campaignId) return;
    const channel: any = getDiceChannel(campaignId);
    const handler = ({ payload }: { payload: DiceRollBroadcast }) => {
      const { enabled: on, userId: me, maxDice } = config.current;
      // Hidden tabs would replay stale rolls when coming back.
      if (!on || document.hidden) return;
      const roll = parseSharedRoll(payload, me, maxDice);
      if (!roll) return;
      setRolls((prev) =>
        [...prev.filter((r) => r.id !== roll.id), roll].slice(-MAX_CONCURRENT_SHARED_ROLLS),
      );
    };
    channel.on?.("broadcast", { event: "roll" }, handler);
    return () => {
      // Keep the shared channel alive, just drop this listener.
      const bindings = channel.bindings?.broadcast;
      if (Array.isArray(bindings)) {
        channel.bindings.broadcast = bindings.filter((b: any) => b.callback !== handler);
      }
    };
  }, [campaignId]);

  useEffect(() => {
    if (!enabled) setRolls([]);
  }, [enabled]);

  const handleDone = useCallback((id: string) => {
    setRolls((prev) => prev.filter((r) => r.id !== id));
  }, []);

  if (!enabled || broken || rolls.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true" data-testid="shared-dice-layer">
      <SceneBoundary onError={() => setBroken(true)}>
        <Suspense fallback={null}>
          <SharedDiceScene rolls={rolls} onDone={handleDone} />
        </Suspense>
      </SceneBoundary>
    </div>
  );
};

export default SharedDiceLayer;

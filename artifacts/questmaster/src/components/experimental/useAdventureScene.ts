import { useCallback, useEffect, useRef, useState } from "react";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

// Crossfade weights for the scene colour. Each destination peaks at the centre
// of its own stretch of the journey and meets the next one at half strength on
// the boundary, so the top and bottom washes never pop from one tone to another.
export function useAdventureScene(hues: number[]) {
  const count = hues.length;
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [simplified, setSimplified] = useState(false);

  const mix = useCallback((position: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const anchored = Math.min(count - .5, Math.max(.5, position));
    const weights = hues.map((_, index) => clamp01(1 - Math.abs(anchored - (index + .5))));
    const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    let x = 0;
    let y = 0;
    hues.forEach((hue, index) => {
      const angle = (hue * Math.PI) / 180;
      const share = weights[index] / total;
      x += Math.cos(angle) * share;
      y += Math.sin(angle) * share;
    });
    const blended = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    stage.style.setProperty("--scene-color", `${blended.toFixed(1)} 80% 62%`);
    weights.forEach((weight, index) => stage.style.setProperty(`--mix-${index}`, weight.toFixed(3)));
  }, [count, hues]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nav = navigator as Navigator & { deviceMemory?: number };
    const update = () => setSimplified(media.matches || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2));
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (simplified) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage) return;
      const travel = track.offsetHeight - stage.offsetHeight;
      const progress = clamp01((64 - track.getBoundingClientRect().top) / Math.max(1, travel));
      setActive(Math.min(count - 1, Math.floor(progress * count)));
      stage.style.setProperty("--journey", String(progress));
      mix(progress * count);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [count, mix, simplified]);

  // Without scroll tracking the washes still follow the selected destination.
  useEffect(() => {
    if (!simplified) return;
    mix(active + .5);
  }, [active, mix, simplified]);

  const highlight = useCallback((index: number) => {
    setActive(index);
    mix(index + .5);
  }, [mix]);

  const select = useCallback((index: number) => {
    highlight(index);
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage || simplified) return;
    const travel = track.offsetHeight - stage.offsetHeight;
    const top = window.scrollY + track.getBoundingClientRect().top - 64 + travel * ((index + .25) / count);
    window.scrollTo({ top, behavior: "instant" });
  }, [count, highlight, simplified]);

  return { trackRef, stageRef, active, setActive: highlight, select, simplified, paused, setPaused };
}

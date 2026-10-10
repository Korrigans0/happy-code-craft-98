import { useEffect, useRef, useState } from "react";

export function useAdventureScene(count: number) {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [simplified, setSimplified] = useState(false);

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
      const progress = Math.max(0, Math.min(1, -track.getBoundingClientRect().top / Math.max(1, travel)));
      setActive(Math.min(count - 1, Math.floor(progress * count)));
      stage.style.setProperty("--journey", String(progress));
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
  }, [count, simplified]);

  const select = (index: number) => {
    setActive(index);
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage || simplified) return;
    const travel = track.offsetHeight - stage.offsetHeight;
    const top = window.scrollY + track.getBoundingClientRect().top + travel * ((index + 0.25) / count);
    window.scrollTo({ top, behavior: "auto" });
  };

  return { trackRef, stageRef, active, setActive, select, simplified, paused, setPaused };
}
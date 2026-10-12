import { useEffect, useRef, useState, type RefObject } from "react";

type Point = { x: number; y: number };
type Flight = { start: Point; end: Point; progress: number; id: number };
const interpolate = (start: Point, end: Point, t: number): Point => ({
  x: start.x + (end.x - start.x) * t,
  y: start.y + (end.y - start.y) * t - Math.sin(Math.PI * t) * Math.min(100, Math.abs(end.x - start.x) * .22 + 45),
});

export function AdventureEnergy({ orbitRef, active, simplified, paused, onArrival }: {
  orbitRef: RefObject<HTMLElement | null>; active: number; simplified: boolean; paused: boolean; onArrival: (index: number) => void;
}) {
  const previous = useRef(active);
  const head = useRef<Point | null>(null);
  const serial = useRef(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  useEffect(() => {
    const orbit = orbitRef.current;
    if (!orbit) return;
    const measure = () => setSize({ width: orbit.clientWidth, height: orbit.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(orbit);
    return () => observer.disconnect();
  }, [orbitRef]);
  useEffect(() => {
    const sourceIndex = previous.current;
    previous.current = active;
    if (simplified || paused) { setFlight(null); head.current = null; onArrival(active); return; }
    if (sourceIndex === active) return;
    const orbit = orbitRef.current;
    if (!orbit) return;
    const objects = orbit.querySelectorAll<HTMLElement>(".adventure-object");
    const source = objects[sourceIndex];
    const target = objects[active];
    if (!source || !target) return;
    // Layout centers stay stable even while the artwork scales and floats.
    const center = (element: HTMLElement) => ({ x: element.offsetLeft, y: element.offsetTop });
    const start = head.current ?? center(source);
    const end = center(target);
    const id = ++serial.current;
    let frame = 0;
    let began = 0;
    const tick = (now: number) => {
      if (!began) began = now;
      const progress = Math.min(1, (now - began) / 760);
      head.current = interpolate(start, end, progress);
      setFlight({ start, end, progress, id });
      if (progress < 1) frame = requestAnimationFrame(tick);
      else { head.current = null; onArrival(active); }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, simplified, paused, orbitRef, onArrival]);
  if (!flight || simplified || paused) return null;
  const points = Array.from({ length: 45 }, (_, index) => {
    const t = index / 44;
    const point = interpolate(flight.start, flight.end, t);
    return { x: point.x, y: point.y + Math.sin(index * 2.7) * 6 * Math.sin(Math.PI * t) };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const current = interpolate(flight.start, flight.end, flight.progress);
  return <svg className="adventure-energy" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true" data-transfer={flight.id} data-progress={flight.progress}>
    <g className="adventure-energy-trail" opacity={flight.progress > .8 ? (1 - flight.progress) * 5 : 1}>
      <path className="energy-aura" d={path} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - flight.progress} />
      <path className="energy-cyan" d={path} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - flight.progress} />
      <path className="energy-core" d={path} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - flight.progress} />
      {[.22, .45, .68].filter(t => t < flight.progress).map((t, index) => {
        const point = interpolate(flight.start, flight.end, t);
        return <path key={t} className="energy-branch" d={`M${point.x},${point.y} l${index % 2 ? -22 : 22},-18 l12,5 l8,-21`} />;
      })}
      {Array.from({ length: 7 }, (_, index) => {
        const point = interpolate(flight.start, flight.end, Math.max(0, flight.progress - index * .028));
        return <circle key={index} className="energy-spark" cx={point.x + Math.sin(index * 4) * 9} cy={point.y + Math.cos(index * 3) * 9} r={index % 2 ? 2 : 3} />;
      })}
      <circle className="energy-head" cx={current.x} cy={current.y} r="7" />
    </g>
  </svg>;
}
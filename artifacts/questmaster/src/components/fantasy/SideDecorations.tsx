/**
 * Décorations latérales SVG : branches enchantées, orchidées lumineuses,
 * cristaux flottants et fées. Cachées sous md pour préserver la lisibilité mobile.
 */
const Branch = ({ side, hue }: { side: "left" | "right"; hue: number }) => {
  const flip = side === "right" ? "scale(-1, 1)" : "";
  return (
    <svg
      viewBox="0 0 200 600"
      className={`absolute ${side === "left" ? "left-0" : "right-0"} top-0 h-full w-32 lg:w-48`}
      style={{ transform: flip }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`glow-${side}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`hsl(${hue}, 90%, 70%)`} stopOpacity="0.9" />
          <stop offset="100%" stopColor={`hsl(${hue}, 90%, 50%)`} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`branch-${side}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(215, 30%, 15%)" />
          <stop offset="100%" stopColor="hsl(215, 25%, 8%)" />
        </linearGradient>
      </defs>

      {/* Branche principale */}
      <path
        d="M 10,0 Q 60,80 30,160 Q 0,240 50,320 Q 90,400 30,480 Q 0,560 40,600"
        stroke={`url(#branch-${side})`}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Petites branches */}
      <path d="M 35,120 Q 70,100 95,130" stroke="hsl(215, 28%, 14%)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 45,280 Q 80,260 110,300" stroke="hsl(215, 28%, 14%)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 40,440 Q 80,420 105,450" stroke="hsl(215, 28%, 14%)" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Orchidées lumineuses */}
      {[
        { cx: 95, cy: 130, hue, delay: "0s" },
        { cx: 60, cy: 220, hue: 190, delay: "1s" },
        { cx: 110, cy: 300, hue: 270, delay: "0.5s" },
        { cx: 80, cy: 380, hue, delay: "1.5s" },
        { cx: 105, cy: 450, hue: 190, delay: "2s" },
      ].map((f, i) => (
        <g key={i} className="animate-float-slow" style={{ animationDelay: f.delay, transformOrigin: `${f.cx}px ${f.cy}px` }}>
          <circle cx={f.cx} cy={f.cy} r="22" fill={`url(#glow-${side})`} opacity="0.7" />
          <circle cx={f.cx} cy={f.cy} r="5" fill={`hsl(${f.hue}, 95%, 75%)`} />
          <circle cx={f.cx - 6} cy={f.cy - 4} r="3" fill={`hsl(${f.hue}, 90%, 80%)`} opacity="0.8" />
          <circle cx={f.cx + 6} cy={f.cy - 4} r="3" fill={`hsl(${f.hue}, 90%, 80%)`} opacity="0.8" />
          <circle cx={f.cx - 5} cy={f.cy + 5} r="3" fill={`hsl(${f.hue}, 90%, 80%)`} opacity="0.8" />
          <circle cx={f.cx + 5} cy={f.cy + 5} r="3" fill={`hsl(${f.hue}, 90%, 80%)`} opacity="0.8" />
        </g>
      ))}

      {/* Cristaux flottants */}
      <g className="animate-float-slow" style={{ animationDelay: "2s" }}>
        <polygon points="50,80 65,100 50,140 35,100" fill="hsl(190, 90%, 65%)" opacity="0.7" />
        <polygon points="50,80 65,100 50,140 35,100" fill="none" stroke="hsl(190, 95%, 80%)" strokeWidth="1" />
      </g>
      <g className="animate-float-slow" style={{ animationDelay: "3.5s" }}>
        <polygon points="120,360 130,375 120,400 110,375" fill="hsl(270, 80%, 65%)" opacity="0.7" />
      </g>
    </svg>
  );
};

const SideDecorations = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
    <Branch side="left" hue={270} />
    <Branch side="right" hue={190} />
  </div>
);

export default SideDecorations;

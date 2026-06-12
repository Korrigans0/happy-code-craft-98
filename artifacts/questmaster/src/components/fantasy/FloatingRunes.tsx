const runes = ["ᚠ", "ᚱ", "ᚷ", "ᛉ", "ᛊ", "ᚹ", "ᚦ", "ᛏ", "ᛞ", "ᛒ"];

interface RuneDef {
  char: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  delay: string;
  hue: number;
}

const presets: RuneDef[] = [
  { char: runes[0], top: "8%", left: "4%", size: 36, delay: "0s", hue: 43 },
  { char: runes[1], top: "22%", right: "6%", size: 28, delay: "1.2s", hue: 190 },
  { char: runes[2], top: "60%", left: "8%", size: 32, delay: "2.4s", hue: 270 },
  { char: runes[3], top: "75%", right: "10%", size: 40, delay: "0.8s", hue: 43 },
  { char: runes[4], top: "40%", right: "3%", size: 24, delay: "1.8s", hue: 155 },
  { char: runes[5], top: "85%", left: "12%", size: 30, delay: "3s", hue: 270 },
];

const FloatingRunes = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    {presets.map((r, i) => (
      <span
        key={i}
        className="absolute font-display animate-rune-pulse select-none"
        style={{
          top: r.top,
          left: r.left,
          right: r.right,
          fontSize: r.size,
          color: `hsl(${r.hue}, 85%, 65%)`,
          textShadow: `0 0 12px hsl(${r.hue}, 90%, 60%, 0.7)`,
          animationDelay: r.delay,
        }}
      >
        {r.char}
      </span>
    ))}
  </div>
);

export default FloatingRunes;

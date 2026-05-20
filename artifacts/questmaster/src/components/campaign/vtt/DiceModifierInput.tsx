import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, RotateCcw } from "lucide-react";

interface DiceModifierInputProps {
  value: number;
  onChange: (value: number) => void;
  /** Optionnel : preview de la formule, ex "2d20" */
  formulaPreview?: string;
  /** Taille compacte pour les panneaux latéraux */
  compact?: boolean;
  /** Bornes (par défaut ±99) */
  min?: number;
  max?: number;
  className?: string;
}

const QUICK_VALUES = [-5, -2, -1, 1, 2, 5];

/**
 * Saisie de modificateur de dés.
 * - Boutons rapides +/− et raccourcis ±1 ±2 ±5
 * - Champ texte filtré (n'accepte que -?\d{0,3}, valide à la volée)
 * - Affiche la formule finale ex: "2d20 + 7"
 */
export default function DiceModifierInput({
  value,
  onChange,
  formulaPreview,
  compact = false,
  min = -99,
  max = 99,
  className = "",
}: DiceModifierInputProps) {
  const [text, setText] = useState<string>(value.toString());

  // garde le champ synchro quand value change de l'extérieur (reset / quick buttons)
  useEffect(() => {
    setText(value.toString());
  }, [value]);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  const handleText = (raw: string) => {
    // n'accepte que: vide, "-", "-N", "N"
    const cleaned = raw.replace(/[^\d-]/g, "");
    const normalized = cleaned.startsWith("-")
      ? "-" + cleaned.slice(1).replace(/-/g, "")
      : cleaned.replace(/-/g, "");
    const truncated = normalized.slice(0, 4); // jusqu'à -999
    setText(truncated);
    if (truncated === "" || truncated === "-") {
      onChange(0);
      return;
    }
    const n = parseInt(truncated, 10);
    if (!isNaN(n)) onChange(clamp(n));
  };

  const bump = (delta: number) => onChange(clamp(value + delta));
  const reset = () => onChange(0);

  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const display = `${sign}${Math.abs(value)}`;

  const finalFormula = formulaPreview
    ? `${formulaPreview}${value === 0 ? "" : value > 0 ? ` + ${value}` : ` − ${Math.abs(value)}`}`
    : null;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-1.5 py-1">
        <span className={`shrink-0 ${compact ? "text-[10px]" : "text-xs"} font-semibold uppercase tracking-wide text-muted-foreground`}>
          Mod
        </span>
        <Button
          size="icon"
          variant="ghost"
          className={compact ? "h-6 w-6" : "h-7 w-7"}
          onClick={() => bump(-1)}
          aria-label="Diminuer le modificateur"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          inputMode="numeric"
          pattern="-?[0-9]*"
          value={text}
          onChange={(e) => handleText(e.target.value)}
          onBlur={() => setText(value.toString())}
          className={`${compact ? "h-6 text-xs" : "h-7 text-sm"} w-14 text-center font-bold tabular-nums`}
          aria-label="Modificateur manuel"
        />
        <Button
          size="icon"
          variant="ghost"
          className={compact ? "h-6 w-6" : "h-7 w-7"}
          onClick={() => bump(1)}
          aria-label="Augmenter le modificateur"
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={`${compact ? "h-6 w-6" : "h-7 w-7"} text-muted-foreground`}
          onClick={reset}
          title="Remettre à zéro"
          aria-label="Réinitialiser le modificateur"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        <div className={`ml-auto shrink-0 ${compact ? "text-xs" : "text-sm"} font-bold tabular-nums ${
          value > 0 ? "text-emerald-400" : value < 0 ? "text-destructive" : "text-muted-foreground"
        }`}>
          {display || "0"}
        </div>
      </div>

      {/* Raccourcis */}
      <div className="flex flex-wrap gap-1">
        {QUICK_VALUES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => bump(q)}
            className={`rounded border border-border bg-muted/30 px-1.5 ${compact ? "py-0 text-[10px]" : "py-0.5 text-xs"} font-medium tabular-nums text-foreground transition-colors hover:bg-muted/60`}
          >
            {q > 0 ? `+${q}` : q}
          </button>
        ))}
      </div>

      {/* Preview formule finale */}
      {finalFormula && (
        <p className={`${compact ? "text-[10px]" : "text-xs"} font-mono text-muted-foreground`}>
          → <span className="text-primary font-semibold">{finalFormula}</span>
        </p>
      )}
    </div>
  );
}

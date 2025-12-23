import { useState } from "react";
import { Dices, RotateCcw, Plus, Minus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface DiceType {
  sides: number;
  color: string;
  label: string;
}

interface RollResult {
  id: string;
  dice: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: Date;
}

const diceTypes: DiceType[] = [
  { sides: 4, color: "from-red-500 to-red-600", label: "D4" },
  { sides: 6, color: "from-orange-500 to-orange-600", label: "D6" },
  { sides: 8, color: "from-yellow-500 to-yellow-600", label: "D8" },
  { sides: 10, color: "from-green-500 to-green-600", label: "D10" },
  { sides: 12, color: "from-blue-500 to-blue-600", label: "D12" },
  { sides: 20, color: "from-purple-500 to-purple-600", label: "D20" },
  { sides: 100, color: "from-pink-500 to-pink-600", label: "D100" },
];

const DiceRoller = () => {
  const [selectedDice, setSelectedDice] = useState<DiceType>(diceTypes[5]);
  const [diceCount, setDiceCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [currentResult, setCurrentResult] = useState<RollResult | null>(null);
  const [history, setHistory] = useState<RollResult[]>([]);

  const rollDice = () => {
    setIsRolling(true);

    setTimeout(() => {
      const rolls: number[] = [];
      for (let i = 0; i < diceCount; i++) {
        rolls.push(Math.floor(Math.random() * selectedDice.sides) + 1);
      }

      const total = rolls.reduce((a, b) => a + b, 0) + modifier;

      const result: RollResult = {
        id: Date.now().toString(),
        dice: `${diceCount}d${selectedDice.sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`,
        rolls,
        modifier,
        total,
        timestamp: new Date(),
      };

      setCurrentResult(result);
      setHistory((prev) => [result, ...prev].slice(0, 10));
      setIsRolling(false);
    }, 500);
  };

  const resetRoll = () => {
    setDiceCount(1);
    setModifier(0);
    setCurrentResult(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-bold text-foreground">
              Lanceur de Dés
            </h1>
            <p className="mt-2 text-muted-foreground">
              Lancez vos dés pour vos jets de caractéristiques, attaques et
              sauvegardes
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Dice Selection */}
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-border/50 bg-gradient-card p-6 shadow-card">
                  <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                    Sélectionner un dé
                  </h2>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                    {diceTypes.map((dice) => (
                      <button
                        key={dice.sides}
                        onClick={() => setSelectedDice(dice)}
                        className={`flex h-16 flex-col items-center justify-center rounded-lg bg-gradient-to-br ${dice.color} text-white shadow-lg transition-all duration-200 ${
                          selectedDice.sides === dice.sides
                            ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "hover:scale-105"
                        }`}
                      >
                        <Dices className="h-5 w-5" />
                        <span className="text-sm font-bold">{dice.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        Nombre
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-display text-xl font-bold text-foreground">
                          {diceCount}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDiceCount(Math.min(10, diceCount + 1))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        Modificateur
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setModifier(modifier - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center font-display text-xl font-bold text-foreground">
                          {modifier >= 0 ? `+${modifier}` : modifier}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setModifier(modifier + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button
                      variant="gold"
                      size="lg"
                      onClick={rollDice}
                      disabled={isRolling}
                      className="min-w-32"
                    >
                      <Dices
                        className={`mr-2 h-5 w-5 ${isRolling ? "animate-spin" : ""}`}
                      />
                      {isRolling ? "Lancement..." : "Lancer"}
                    </Button>
                    <Button variant="outline" size="lg" onClick={resetRoll}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Result Display */}
                {currentResult && (
                  <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-card p-8 text-center shadow-gold">
                    <p className="text-sm uppercase tracking-wider text-muted-foreground">
                      {currentResult.dice}
                    </p>
                    <p className="mt-2 font-display text-7xl font-bold text-primary">
                      {currentResult.total}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {currentResult.rolls.map((roll, index) => (
                        <span
                          key={index}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold ${
                            roll === selectedDice.sides
                              ? "bg-emerald-500/20 text-emerald-400"
                              : roll === 1
                                ? "bg-red-500/20 text-red-400"
                                : "text-foreground"
                          }`}
                        >
                          {roll}
                        </span>
                      ))}
                      {currentResult.modifier !== 0 && (
                        <span className="flex h-10 items-center justify-center rounded-lg bg-primary/20 px-3 font-bold text-primary">
                          {currentResult.modifier > 0
                            ? `+${currentResult.modifier}`
                            : currentResult.modifier}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* History */}
              <div className="rounded-xl border border-border/50 bg-gradient-card p-6 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                  <History className="h-5 w-5" />
                  Historique
                </h2>
                {history.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Aucun lancer effectué
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                      >
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {result.dice}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            [{result.rolls.join(", ")}]
                          </p>
                        </div>
                        <span className="font-display text-2xl font-bold text-primary">
                          {result.total}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DiceRoller;
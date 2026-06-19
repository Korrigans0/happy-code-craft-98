import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Sword, Map, Users, BookOpen, Dices, ChevronRight, ChevronLeft, X, PartyPopper,
} from "lucide-react";

const STORAGE_KEY = "aetheria.onboarding.completed.v1";

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: React.ReactNode;
  cta?: { label: string; to?: string };
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Bienvenue dans Aetheria VTT",
    body: (
      <>
        <p>
          Aetheria VTT est votre table de jeu virtuelle pour <strong>Aetheria, D&amp;D 5e, Pathfinder 2e,
          Worlds Awakening</strong> et vos systèmes maison.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Ce tour rapide (≈1 minute) vous montre l'essentiel pour démarrer votre première campagne.
        </p>
      </>
    ),
  },
  {
    icon: Sword,
    title: "1. Créez votre première campagne",
    body: (
      <>
        <p>
          Cliquez sur <strong>« Nouvelle campagne »</strong>, choisissez un système de jeu, donnez-lui un nom
          et une bannière. Vous devenez automatiquement <strong>Maître du Jeu</strong>.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Vous pouvez créer jusqu'à 3 campagnes en plan gratuit.
        </p>
      </>
    ),
  },
  {
    icon: Users,
    title: "2. Invitez vos joueurs",
    body: (
      <>
        <p>
          Chaque campagne génère un <strong>code d'invitation</strong> à 12 caractères. Partagez-le —
          vos joueurs le saisissent sur <code className="bg-muted px-1 rounded">/campaigns</code> via
          « Rejoindre une campagne ».
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Jusqu'à 5 joueurs par campagne en plan gratuit.
        </p>
      </>
    ),
  },
  {
    icon: Map,
    title: "3. Le plateau virtuel",
    body: (
      <>
        <p>
          L'onglet <strong>Plateau</strong> est le cœur du jeu : importez une carte, placez des tokens,
          dessinez des murs dynamiques, allumez des lumières, activez le brouillard de guerre.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Tout est synchronisé en temps réel avec vos joueurs.
        </p>
      </>
    ),
  },
  {
    icon: BookOpen,
    title: "4. Personnages et Codex",
    body: (
      <>
        <p>
          Vos joueurs créent leurs personnages depuis <strong>Mes Personnages</strong> en utilisant la fiche
          dédiée à votre système. Le <strong>Codex</strong> regroupe créatures, sorts et objets.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          En tant que MJ, vous pouvez créer du contenu personnalisé (créatures, objets, sorts).
        </p>
      </>
    ),
  },
  {
    icon: Dices,
    title: "5. Lancez la partie !",
    body: (
      <>
        <p className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-amber-400" />
          <span>Tout est prêt. Démarrez une campagne, invitez vos joueurs et que l'aventure commence !</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Besoin d'aide ? Le <strong>Guide complet</strong> est accessible depuis le menu à tout moment.
        </p>
      </>
    ),
    cta: { label: "Créer ma première campagne", to: "/campaigns" },
  },
];

interface Props {
  /** Force le tour, ignore le flag localStorage. */
  force?: boolean;
  onClose?: () => void;
}

export function OnboardingTour({ force = false, onClose }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (force) {
      setStep(0);
      setOpen(true);
      return;
    }
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {
      /* localStorage indisponible (mode privé) → on ne montre pas */
    }
  }, [force]);

  const finish = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* noop */ }
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const next = useCallback(() => {
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }, []);
  const prev = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <button
          onClick={finish}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <div className="mb-4 rounded-full bg-primary/10 p-4 ring-1 ring-primary/30">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {current.title}
          </h2>
          <div className="mt-4 text-foreground/90 space-y-2 text-left">
            {current.body}
          </div>
        </div>

        {/* Indicateurs d'étape */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground/40"
              }`}
              aria-label={`Aller à l'étape ${i + 1}`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={finish} className="text-muted-foreground">
            Passer
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={prev} size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
              </Button>
            )}
            {!isLast ? (
              <Button onClick={next} size="sm">
                Suivant <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  finish();
                  if (current.cta?.to) navigate(current.cta.to);
                }}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {current.cta?.label ?? "Terminer"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Réinitialise le flag pour rejouer le tour. */
export function resetOnboarding() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

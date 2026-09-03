import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bug, ImagePlus, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const PROBLEM_TYPES = [
  { value: "bug", label: "Bug" },
  { value: "display", label: "Problème d'affichage" },
  { value: "feature", label: "Fonctionnalité qui ne fonctionne pas" },
  { value: "other", label: "Autre" },
] as const;

const MAX_DESCRIPTION = 2000;
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;

type Status = "idle" | "sending" | "success" | "error";

/** Bouton flottant global permettant de signaler un bug depuis n'importe quelle page. */
const BugReportButton = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [problemType, setProblemType] = useState<string>("bug");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState<{ dataUrl: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setProblemType("bug");
    setDescription("");
    setEmail("");
    setScreenshot(null);
    setErrorMessage(null);
    setStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) return;
    setErrorMessage(null);
  }, [open]);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Seules les images sont acceptées.");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setErrorMessage("La capture ne doit pas dépasser 4 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setErrorMessage(null);
      setScreenshot({ dataUrl: String(reader.result), name: file.name });
    };
    reader.onerror = () => setErrorMessage("Impossible de lire l'image sélectionnée.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (status === "sending") return;
    const trimmed = description.trim();
    if (!trimmed) {
      setErrorMessage("Merci de décrire le problème rencontré.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Adresse e-mail invalide.");
      return;
    }

    setStatus("sending");
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("report-bug", {
        body: {
          problemType,
          description: trimmed.slice(0, MAX_DESCRIPTION),
          reporterEmail: email.trim(),
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          platform: navigator.platform ?? "",
          screenSize: `${window.screen.width}x${window.screen.height} — fenêtre ${window.innerWidth}x${window.innerHeight} (dpr ${window.devicePixelRatio})`,
          language: navigator.language,
          screenshot: screenshot?.dataUrl ?? "",
        },
      });
      if (error || !data?.success) {
        throw new Error(String((data as { error?: string } | null)?.error ?? error?.message ?? "send_failed"));
      }
      setStatus("success");
      setProblemType("bug");
      setDescription("");
      setEmail("");
      setScreenshot(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Signaler un bug ou un problème"
        className={cn(
          "fixed left-3 z-40 flex items-center gap-2 rounded-full border border-primary/30",
          "bg-card/90 px-3 py-2 text-xs font-medium text-foreground/80 shadow-lg backdrop-blur",
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary hover:shadow-primary/20",
          "bottom-20 md:bottom-4 md:px-4 md:py-2.5 md:text-sm",
        )}
      >
        <Bug className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Signaler un bug ou un problème</span>
        <span className="sm:hidden">Signaler</span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {status === "success" ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">🐛 Signalement envoyé !</DialogTitle>
                <DialogDescription>
                  Merci pour votre retour. Votre signalement a bien été transmis à l'équipe et sera
                  examiné prochainement.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-heading">
                  <Bug className="h-5 w-5 text-primary" />
                  Signaler un bug ou un problème
                </DialogTitle>
                <DialogDescription>
                  Décrivez ce qui ne fonctionne pas. La page et les informations techniques sont
                  ajoutées automatiquement.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bug-type">Type de problème</Label>
                  <Select value={problemType} onValueChange={setProblemType}>
                    <SelectTrigger id="bug-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROBLEM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bug-description">
                    Description du problème <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="bug-description"
                    value={description}
                    maxLength={MAX_DESCRIPTION}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Que s'est-il passé ? Qu'attendiez-vous ?"
                    rows={5}
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {description.length}/{MAX_DESCRIPTION}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bug-email">Adresse e-mail (facultatif)</Label>
                  <Input
                    id="bug-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bug-screenshot">Capture d'écran (facultatif)</Label>
                  <input
                    id="bug-screenshot"
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                      <ImagePlus className="h-4 w-4" />
                      Ajouter une image
                    </Button>
                    {screenshot && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <img
                          src={screenshot.dataUrl}
                          alt="Aperçu de la capture"
                          className="h-10 w-16 rounded border border-border object-cover"
                        />
                        <span className="max-w-[8rem] truncate">{screenshot.name}</span>
                        <button
                          type="button"
                          aria-label="Retirer la capture"
                          onClick={() => {
                            setScreenshot(null);
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                  Page concernée : <span className="break-all">{location.pathname}</span>
                </p>

                {status === "error" && (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    ❌ Une erreur est survenue. Votre signalement n'a pas pu être envoyé. Veuillez
                    réessayer.
                  </p>
                )}
                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  disabled={status === "sending"}
                >
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={status === "sending" || !description.trim()}>
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Envoyer le signalement
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BugReportButton;

import { useState } from "react";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type RequestType = "withdrawal" | "data-rights" | "content-report" | "account-deletion";

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  subject: z.string().trim().min(2, "Précisez l’objet de la demande.").max(160),
  message: z.string().trim().min(10, "Décrivez votre demande en au moins 10 caractères.").max(4000),
  confirmed: z.literal(true, { errorMap: () => ({ message: "Vous devez confirmer l’exactitude de la demande." }) }),
});

const labels: Record<RequestType, { title: string; button: string }> = {
  withdrawal: { title: "Demande de rétractation", button: "Exercer mon droit de rétractation" },
  "data-rights": { title: "Exercice de mes droits", button: "Exercer mes droits" },
  "content-report": { title: "Signalement juridique", button: "Signaler ce contenu" },
  "account-deletion": { title: "Suppression de mon compte", button: "Demander la suppression" },
};

export default function LegalRequestForm({ type, compact = false }: { type: RequestType; compact?: boolean }) {
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "", confirmed: false });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const copy = labels[type];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending) return;
    const parsed = schema.safeParse(values);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Demande invalide."); return; }
    setSending(true); setError("");
    const { data, error: requestError } = await supabase.functions.invoke("legal-request", {
      body: { type, ...parsed.data, pageUrl: window.location.href },
    });
    setSending(false);
    if (requestError || !data?.success) { setError("La demande n’a pas pu être transmise. Réessayez ou écrivez à korrigans125@gmail.com."); return; }
    setSent(true);
    setValues({ name: "", email: "", subject: "", message: "", confirmed: false });
  };

  if (sent) return <div role="status" className="border border-primary/30 bg-primary/5 p-5 text-sm"><strong className="text-primary">Demande transmise.</strong><p className="mt-2 text-muted-foreground">Un accusé de réception a été enregistré. Conservez vos informations de demande.</p></div>;

  return (
    <form onSubmit={submit} className={compact ? "space-y-4" : "space-y-5 border border-border/60 bg-card/70 p-5 md:p-7"} noValidate>
      <h3 className="font-display text-lg font-semibold text-foreground">{copy.title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor={`${type}-name`}>Nom complet</Label><Input id={`${type}-name`} value={values.name} maxLength={120} onChange={(e) => setValues({ ...values, name: e.target.value })} required /></div>
        <div className="space-y-2"><Label htmlFor={`${type}-email`}>Adresse e-mail</Label><Input id={`${type}-email`} type="email" value={values.email} maxLength={255} onChange={(e) => setValues({ ...values, email: e.target.value })} required /></div>
      </div>
      <div className="space-y-2"><Label htmlFor={`${type}-subject`}>Objet</Label><Input id={`${type}-subject`} value={values.subject} maxLength={160} onChange={(e) => setValues({ ...values, subject: e.target.value })} placeholder={type === "content-report" ? "URL ou contenu concerné" : "Précisez votre demande"} required /></div>
      <div className="space-y-2"><Label htmlFor={`${type}-message`}>Détails de la demande</Label><Textarea id={`${type}-message`} value={values.message} maxLength={4000} rows={6} onChange={(e) => setValues({ ...values, message: e.target.value })} required /><p className="text-right text-xs text-muted-foreground">{values.message.length}/4000</p></div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
        <Checkbox checked={values.confirmed} onCheckedChange={(checked) => setValues({ ...values, confirmed: checked === true })} aria-label="Confirmer la demande" />
        <span>Je confirme que les informations fournies sont exactes et que cette demande me concerne ou que je suis autorisé à l’effectuer.</span>
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={sending}><>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{copy.button}</></Button>
      <p className="text-xs text-muted-foreground">Les informations sont utilisées uniquement pour traiter cette demande. Une preuve d’identité peut être demandée si nécessaire.</p>
    </form>
  );
}
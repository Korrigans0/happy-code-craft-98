import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COOKIE_SETTINGS_EVENT, readCookieConsent, saveCookieConsent } from "@/lib/cookieConsent";

export default function CookiePreferencesDialog() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState(false);
  useEffect(() => {
    const show = () => { setPreferences(readCookieConsent()?.preferences ?? false); setOpen(true); };
    window.addEventListener(COOKIE_SETTINGS_EVENT, show);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, show);
  }, []);
  const save = () => { saveCookieConsent(preferences); setOpen(false); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2 font-display"><Cookie className="h-5 w-5 text-primary" />Paramètres des cookies</DialogTitle><DialogDescription>Choisissez les stockages facultatifs utilisés sur cet appareil. Aucun traceur statistique ou publicitaire n’est actuellement installé.</DialogDescription></DialogHeader><div className="space-y-3">
    <div className="flex items-center justify-between border border-border/60 p-4"><div><p className="font-medium">Nécessaires</p><p className="text-xs text-muted-foreground">Session, sécurité et mémorisation de votre choix. Toujours actifs.</p></div><Switch checked disabled aria-label="Cookies nécessaires toujours actifs" /></div>
    <div className="flex items-center justify-between border border-border/60 p-4"><div className="pr-4"><p className="font-medium">Préférences</p><p className="text-xs text-muted-foreground">E-mail mémorisé, son, affichage du VTT et tutoriel sur cet appareil.</p></div><Switch checked={preferences} onCheckedChange={setPreferences} aria-label="Autoriser les préférences" /></div>
    <div className="flex items-center justify-between border border-border/60 p-4 opacity-70"><div><p className="font-medium">Statistiques et marketing</p><p className="text-xs text-muted-foreground">Aucun outil détecté ou activé.</p></div><Switch checked={false} disabled aria-label="Statistiques et marketing désactivés" /></div>
  </div><DialogFooter><Button variant="outline" onClick={() => { saveCookieConsent(false); setOpen(false); }}>Tout refuser</Button><Button onClick={save}>Enregistrer mes choix</Button></DialogFooter></DialogContent></Dialog>;
}
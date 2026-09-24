import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Check, Crown, Info, Minus, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageAmbiance from "@/components/fantasy/PageAmbiance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, openCustomerPortal } from "@/hooks/useSubscription";
import { getPaddle, resolvePaddlePrice } from "@/lib/paddle";
import PaymentTestModeBanner from "@/components/PaymentTestModeBanner";
import { SUBSCRIPTION_PLANS, PERIOD_BILLING, PERIOD_LABELS, formatEuro, monthlyEquivalent, savingsPercent, type BillingPeriod, type SubscriptionPlan } from "@/lib/subscriptions";

const comparison = [
  ["Campagnes actives", "3", "3", "20", "50"], ["Personnages actifs", "3", "20", "3", "50"], ["Joueurs par campagne", "5", "5", "10", "10"], ["Stockage", "5 Go", "10 Go", "15 Go", "30 Go"],
  ["Table virtuelle", true, true, true, true], ["Brouillard de guerre", true, true, true, true], ["Vision des tokens", true, true, true, true], ["Codex des systèmes pris en charge", true, true, true, true],
  ["Inventaire avancé", false, true, false, true], ["Portraits HD", false, true, false, true], ["Historique complet", false, true, false, true], ["Effets visuels", false, true, false, true],
  ["Lumières avancées", false, false, true, true], ["Murs avancés", false, false, true, true], ["Sauvegardes automatiques", false, false, true, true], ["Import de cartes optimisé", false, false, true, true], ["Avantages PJ et MJ réunis", false, false, false, true],
] as const;
const faq = [
  ["Aétheria est-il vraiment gratuit ?", "Oui. L’offre Aétheria reste gratuite à vie dans les limites affichées."],
  ["Puis-je changer de formule ?", "Oui, depuis le portail Paddle. Le prix, la période, les quotas et la date d’application sont présentés avant validation."],
  ["Puis-je passer du mensuel à l’annuel ?", "Oui, le changement de périodicité s’effectue dans le portail sécurisé du prestataire."],
  ["Comment résilier ?", "Le bouton Gérer mon abonnement ouvre le portail Paddle, où la résiliation peut être programmée."],
  ["Que se passe-t-il après une résiliation ?", "L’accès Premium reste disponible jusqu’à la fin de la période déjà payée, puis le compte revient au gratuit."],
  ["Mes campagnes sont-elles supprimées après une baisse d’offre ?", "Non. Rien n’est supprimé automatiquement. Les nouvelles créations sont bloquées tant que l’usage dépasse le nouveau quota."],
  ["Mes personnages sont-ils supprimés ?", "Non. Ils restent conservés ; vous devrez réduire votre usage avant de pouvoir en créer davantage."],
  ["Mes fichiers sont-ils supprimés ?", "Non. Aucun fichier n’est supprimé automatiquement après une résiliation ou un changement d’offre."],
  ["Comment fonctionne le stockage ?", "Le quota total dépend de l’offre. Les imports supplémentaires sont refusés lorsque le quota est atteint."],
  ["Qui traite le paiement ?", "Paddle agit comme prestataire de paiement et marchand officiel. Aétheria VTT ne reçoit pas vos données de carte."],
  ["Comment fonctionne le trimestriel ?", "Le total indiqué est facturé tous les trois mois et se renouvelle selon cette périodicité jusqu’à résiliation."],
  ["Comment fonctionne l’annuel ?", "Le total annuel est facturé en une fois. L’équivalent mensuel sert uniquement à comparer les offres."],
  ["Puis-je revenir au gratuit ?", "Oui. Si vos données dépassent les quotas gratuits, elles restent conservées mais les nouvelles créations ou importations sont bloquées."],
];

export default function Subscriptions() {
  const { user } = useAuth(); const navigate = useNavigate(); const { data: subscription } = useSubscription();
  const [period, setPeriod] = useState<BillingPeriod>("monthly"); const [selected, setSelected] = useState<SubscriptionPlan | null>(null); const [accepted, setAccepted] = useState(false); const [opening, setOpening] = useState(false);
  const currentPlan = subscription ? SUBSCRIPTION_PLANS.find((p) => p.id === subscription.tier) : undefined;
  const selectPlan = (plan: SubscriptionPlan) => {
    if (!user) { navigate("/sign-up"); return; }
    if (plan.id === "free") return;
    if (subscription?.tier !== "free") { void manage(); return; }
    setAccepted(false); setSelected(plan);
  };
  const manage = async () => { try { setOpening(true); await openCustomerPortal(); } catch (e) { toast.error(e instanceof Error ? e.message : "Portail indisponible"); } finally { setOpening(false); } };
  const checkout = async () => {
    if (!selected || !accepted || !user) return; const externalPriceId = selected.prices[period].priceId; if (!externalPriceId) return;
    try { setOpening(true); const [paddle, priceId] = await Promise.all([getPaddle(), resolvePaddlePrice(externalPriceId)]); if (!paddle) throw new Error("Paiement indisponible"); paddle.Checkout.open({ items: [{ priceId, quantity: 1 }], customer: user.email ? { email: user.email } : undefined, customData: { userId: user.id, plan: selected.id, billingPeriod: period }, settings: { successUrl: `${window.location.origin}/subscriptions?checkout=success` } }); setSelected(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Impossible d’ouvrir le paiement"); } finally { setOpening(false); }
  };
  const displayed = useMemo(() => SUBSCRIPTION_PLANS.map((plan) => ({ plan, price: plan.prices[period], saving: savingsPercent(plan, period) })), [period]);
  return <div className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden"><PaymentTestModeBanner /><PageAmbiance /><SEO title="Abonnements — Aétheria VTT" description="Comparez les offres Aétheria, Premium PJ, Premium MJ et Premium Mixte." path="/subscriptions" /><Header />
    <main className="relative flex-1"><section className="container mx-auto px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto mb-9 max-w-3xl text-center"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300"><Crown className="h-3.5 w-3.5" /> Offres Aétheria</div><h1 className="font-display text-4xl font-bold text-gradient-gold md:text-6xl">Choisissez votre voie</h1><p className="mt-4 text-slate-300">Quatre offres claires, sans fausse urgence et sans suppression automatique de vos créations.</p></div>
      {user && currentPlan && <div className="mx-auto mb-8 max-w-3xl rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-4 text-center text-sm text-slate-200"><strong>Votre offre actuelle : {currentPlan.name}</strong>{subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd ? ` · Fin prévue le ${new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR")}` : ""}</div>}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as BillingPeriod)} className="mb-10"><TabsList className="mx-auto grid h-auto w-full max-w-xl grid-cols-3 bg-slate-950/70 p-1"><TabsTrigger value="monthly">MENSUEL</TabsTrigger><TabsTrigger value="quarterly">TRIMESTRIEL</TabsTrigger><TabsTrigger value="annual" className="gap-2">ANNUEL <Badge className="hidden bg-amber-400 text-[9px] text-slate-950 sm:inline-flex">MEILLEURE ÉCONOMIE</Badge></TabsTrigger></TabsList></Tabs>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">{displayed.map(({ plan, price, saving }) => <article key={plan.id} className={`relative flex min-w-0 flex-col rounded-2xl border bg-[linear-gradient(160deg,rgba(16,30,53,.96),rgba(7,15,31,.98))] p-6 shadow-2xl ${plan.recommended ? "border-amber-400/60 xl:scale-[1.02]" : "border-cyan-300/20"}`}>
        {plan.recommended && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950"><Star className="mr-1 h-3 w-3" />RECOMMANDÉ</Badge>}
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border border-white/15" style={{ color: `hsl(${plan.hue} 85% 70%)`, background: `hsl(${plan.hue} 70% 30% / .2)` }}><plan.icon className="h-5 w-5" /></span><div><h2 className="font-display font-bold text-slate-100">{plan.name}</h2><p className="text-xs text-slate-400">{plan.tagline}</p></div></div>
        <div className="mt-6"><span className="font-display text-4xl font-bold text-amber-300">{formatEuro(price.cents)}</span><span className="ml-1 text-sm text-slate-400">{price.label}</span></div>
        {plan.id === "free" ? <p className="mt-2 min-h-10 text-xs text-slate-400">Gratuit à vie</p> : <div className="mt-2 min-h-10 text-xs text-slate-400"><p>{PERIOD_BILLING[period]}</p>{period !== "monthly" && <p>{formatEuro(monthlyEquivalent(plan, period))}/mois · économie calculée {saving} %</p>}</div>}
        <ul className="my-6 flex-1 space-y-2.5">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />{feature}</li>)}</ul>
        {plan.id === "free" ? <Button asChild variant="outline" className="min-h-11 w-full"><Link to={user ? "/dashboard" : "/sign-up"}>{user ? (subscription?.tier === "free" ? "Votre offre actuelle" : "Offre gratuite") : "Commencer gratuitement"}</Link></Button> : <Button className="min-h-11 w-full font-bold" disabled={opening || subscription?.tier === plan.id} onClick={() => selectPlan(plan)}>{subscription?.tier === plan.id ? "Votre offre actuelle" : !user ? "Créer un compte" : subscription?.tier === "free" ? `Passer à ${plan.name.replace("PREMIUM ", "Premium ")}` : "Changer d’offre"}</Button>}
      </article>)}</div>
      <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400"><Info className="h-4 w-4" />Paiements en mode test dans l’aperçu. La commercialisation réelle reste bloquée jusqu’à validation Paddle.</p>
    </section>
    <section className="container mx-auto px-4 py-12 md:px-6"><h2 className="mb-6 text-center font-display text-3xl font-bold text-slate-100">Comparez les offres</h2><div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50"><Table className="min-w-[720px]"><TableHeader><TableRow><TableHead>Fonction</TableHead>{SUBSCRIPTION_PLANS.map((p) => <TableHead key={p.id} className="text-center">{p.name}</TableHead>)}</TableRow></TableHeader><TableBody>{comparison.map((row) => <TableRow key={row[0]}><TableCell className="font-medium">{row[0]}</TableCell>{row.slice(1).map((value, i) => <TableCell key={i} className="text-center">{typeof value === "boolean" ? value ? <Check className="mx-auto h-4 w-4 text-cyan-300" aria-label="Inclus" /> : <Minus className="mx-auto h-4 w-4 text-slate-600" aria-label="Non inclus" /> : value}</TableCell>)}</TableRow>)}</TableBody></Table></div></section>
    <section className="container mx-auto max-w-4xl px-4 py-12 md:px-6"><h2 className="mb-6 text-center font-display text-3xl font-bold text-slate-100">Questions fréquentes</h2><Accordion type="single" collapsible className="rounded-xl border border-white/10 bg-slate-950/45 px-5">{faq.map(([q, a], i) => <AccordionItem key={q} value={`faq-${i}`}><AccordionTrigger className="text-left text-slate-100">{q}</AccordionTrigger><AccordionContent className="text-slate-400">{a}</AccordionContent></AccordionItem>)}</Accordion></section></main><Footer />
    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle className="font-display">Vérifier avant paiement</DialogTitle><DialogDescription>Le paiement ne s’ouvre qu’après votre acceptation explicite.</DialogDescription></DialogHeader>{selected && <div className="space-y-4 text-sm"><div className="rounded-lg border border-primary/30 bg-primary/5 p-4"><p className="font-display text-lg text-primary">{selected.name}</p><p className="mt-1 text-2xl font-bold">{formatEuro(selected.prices[period].cents)} <span className="text-sm font-normal text-muted-foreground">{selected.prices[period].label}</span></p><p className="mt-2 text-muted-foreground">{PERIOD_BILLING[period]} · renouvellement automatique jusqu’à résiliation.</p></div><div className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-3 text-muted-foreground"><ShieldCheck className="mr-2 inline h-4 w-4 text-amber-300" />Paddle traite le paiement. Aétheria VTT ne reçoit pas les données de carte.</div><p>Avant un changement ou une baisse d’offre, le portail affiche le nouveau prix, la période et la date d’application. Vos fichiers ne sont jamais supprimés automatiquement.</p><p>Vous bénéficiez d’une <Link className="text-primary underline" to="/politique-remboursement">garantie de remboursement de 30 jours</Link>. Le <Link className="text-primary underline" to="/retractation">droit de rétractation</Link> s’applique également lorsqu’il est prévu par la loi.</p><label className="flex cursor-pointer items-start gap-3"><Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} aria-label="Accepter les CGV et CGU" /><span>J’accepte les <Link to="/cgv" className="text-primary underline">Conditions Générales de Vente</Link> et les <Link to="/cgu" className="text-primary underline">Conditions Générales d’Utilisation</Link>.</span></label></div>}<DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Annuler</Button><Button disabled={!accepted || opening} onClick={checkout}>Continuer vers le paiement</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

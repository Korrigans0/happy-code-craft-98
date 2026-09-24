import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Scale } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageAmbiance from "@/components/fantasy/PageAmbiance";
import { Button } from "@/components/ui/button";

interface LegalLayoutProps {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
}

export default function LegalLayout({ title, description, path, children }: LegalLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PageAmbiance imageOpacity={0.1} noSides />
      <SEO title={`${title} — Aétheria VTT`} description={description} path={path} />
      <Header />
      <main className="relative flex-1 py-10 md:py-16">
        <article className="container mx-auto max-w-4xl px-4 md:px-6">
          <Button asChild variant="ghost" size="sm" className="mb-6 text-muted-foreground">
            <Link to="/"><ArrowLeft className="h-4 w-4" />Retour à l’accueil</Link>
          </Button>
          <header className="mb-10 border-b border-primary/20 pb-8">
            <div className="mb-3 flex items-center gap-2 text-sm text-primary">
              <Scale className="h-4 w-4" />Documents juridiques
            </div>
            <h1 className="font-display text-3xl font-bold text-gradient-gold md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
            <p className="mt-5 text-xs text-muted-foreground">Version : 1.0 · Dernière mise à jour : septembre 2026</p>
          </header>
          <div className="legal-content space-y-9 text-sm leading-7 text-foreground/90">{children}</div>
          <aside className="mt-12 border-l-2 border-primary/50 bg-card/40 p-4 text-xs leading-6 text-muted-foreground">
            Ces documents sont conçus pour être relus avant le lancement commercial. Ils ne remplacent pas un conseil juridique personnalisé.
          </aside>
        </article>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="mb-3 font-display text-xl font-semibold text-primary md:text-2xl">{title}</h2><div className="space-y-3">{children}</div></section>;
}

export function LegalList({ items }: { items: string[] }) {
  return <ul className="space-y-2 pl-5">{items.map((item) => <li key={item} className="list-disc marker:text-primary">{item}</li>)}</ul>;
}
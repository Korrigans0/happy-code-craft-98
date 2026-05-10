import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sparkles, Sword, Swords, BookOpen, Shield } from 'lucide-react';

const HeroSection = () => {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      {/* Atmospheric background with multiple layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/4 top-1/6 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[150px] animate-pulse-slow" />
        <div className="absolute right-1/4 bottom-1/6 h-96 w-96 rounded-full bg-feature-compendium/6 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/4 blur-[100px]" />
        {/* Subtle particle-like dots */}
        <div className="absolute top-20 left-[15%] h-1 w-1 rounded-full bg-primary/40 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-[20%] h-1.5 w-1.5 rounded-full bg-primary/30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-[30%] h-1 w-1 rounded-full bg-primary/35 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-60 right-[35%] h-0.5 w-0.5 rounded-full bg-primary/50 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container relative mx-auto px-4 text-center md:px-6">
        {/* Emblem with layered glow */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 scale-150 animate-pulse-slow rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute inset-0 scale-110 animate-pulse-slow rounded-full bg-primary/10 blur-xl" style={{ animationDelay: '1s' }} />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-card/50 backdrop-blur-sm">
              <Swords className="h-12 w-12 text-primary glow-gold animate-float" />
            </div>
            {/* Orbiting decorative elements */}
            <div className="absolute -top-2 -right-2 animate-float" style={{ animationDelay: '0.5s' }}>
              <Shield className="h-5 w-5 text-primary/40" />
            </div>
            <div className="absolute -bottom-1 -left-3 animate-float" style={{ animationDelay: '1.2s' }}>
              <Sparkles className="h-4 w-4 text-primary/30" />
            </div>
          </div>
        </div>

        <h2 className="font-display text-5xl font-bold text-gradient-gold md:text-6xl lg:text-7xl tracking-wide">
          Aetheria VTT
        </h2>
        
        {/* Decorative divider */}
        <div className="mx-auto mt-4 flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/40" />
          <Sparkles className="h-3 w-3 text-primary/60" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
        </div>
        
        <p className="mx-auto mt-4 max-w-lg text-sm uppercase tracking-[0.3em] text-primary/50 font-display">
          Table Virtuelle Immersive
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
          Explorez l'univers d'Aetheria. Invoquez des créatures du bestiaire sur la carte, 
          gérez vos campagnes et vivez des aventures épiques dans un VTT dédié.
        </p>

        {!loading && (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <>
                <Button variant="gold" size="lg" asChild className="shadow-gold group">
                  <Link to="/campaigns">
                    <Sword className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                    Lancer une session
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="group">
                  <Link to="/compendium">
                    <BookOpen className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Explorer le Codex
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="gold" size="lg" asChild className="shadow-gold group">
                  <Link to="/sign-in">
                    <Sparkles className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                    Entrer dans Aetheria
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="group">
                  <Link to="/compendium">
                    <BookOpen className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Explorer le Codex
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="mx-auto mt-16 flex max-w-md items-center justify-center gap-8 text-center">
          <div className="space-y-1">
            <p className="font-display text-2xl font-bold text-primary">∞</p>
            <p className="text-xs text-muted-foreground">Aventures</p>
          </div>
          <div className="h-8 w-px bg-border/50" />
          <div className="space-y-1">
            <p className="font-display text-2xl font-bold text-primary">WA</p>
            <p className="text-xs text-muted-foreground">Système natif</p>
          </div>
          <div className="h-8 w-px bg-border/50" />
          <div className="space-y-1">
            <p className="font-display text-2xl font-bold text-primary">VTT</p>
            <p className="text-xs text-muted-foreground">Immersif</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sparkles, Sword, BookOpen } from 'lucide-react';

const HeroSection = () => {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full opacity-20 blur-[180px]"
          style={{ background: "radial-gradient(circle, hsl(43,75%,50%) 0%, transparent 70%)" }} />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 opacity-10 blur-[120px]"
          style={{ background: "radial-gradient(circle, hsl(215,80%,40%) 0%, transparent 70%)" }} />
        {/* Floating particles */}
        <div className="absolute top-20 left-[15%] h-1 w-1 rounded-full bg-amber-400/40 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-[20%] h-1.5 w-1.5 rounded-full bg-amber-400/30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-[30%] h-1 w-1 rounded-full bg-amber-400/35 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-60 right-[35%] h-0.5 w-0.5 rounded-full bg-amber-400/50 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container relative mx-auto px-4 text-center md:px-6">
        {/* Logo principal */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 scale-125 animate-pulse-slow rounded-full blur-3xl opacity-30"
              style={{ background: "radial-gradient(circle, hsl(43,75%,50%) 0%, transparent 70%)" }} />
            <img
              src="/aetheria-logo.png"
              alt="Aetheria VTT"
              className="relative h-32 w-32 rounded-full object-cover animate-float"
              style={{
                filter: "drop-shadow(0 0 30px hsl(43,75%,50%,0.6)) drop-shadow(0 0 60px hsl(43,75%,50%,0.25))",
                animationDuration: "4s",
              }}
            />
          </div>
        </div>

        <h2 className="font-display text-5xl font-bold text-gradient-gold md:text-6xl lg:text-7xl tracking-wide">
          Aetheria VTT
        </h2>

        {/* Decorative divider */}
        <div className="mx-auto mt-5 flex items-center justify-center gap-4">
          <div className="h-px w-24" style={{ background: "linear-gradient(90deg, transparent, hsl(43,75%,50%,0.5))" }} />
          <Sparkles className="h-3.5 w-3.5 text-amber-500/70" />
          <div className="h-px w-24" style={{ background: "linear-gradient(270deg, transparent, hsl(43,75%,50%,0.5))" }} />
        </div>

        <p className="mx-auto mt-4 max-w-lg text-xs uppercase tracking-[0.3em] text-amber-500/50 font-display">
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
                <Button variant="outline" size="lg" asChild className="group border-amber-500/20 hover:border-amber-500/40">
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
                <Button variant="outline" size="lg" asChild className="group border-amber-500/20 hover:border-amber-500/40">
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
            <p className="font-display text-2xl font-bold text-gradient-gold">∞</p>
            <p className="text-xs text-muted-foreground">Aventures</p>
          </div>
          <div className="h-8 w-px bg-border/50" />
          <div className="space-y-1">
            <p className="font-display text-2xl font-bold text-gradient-gold">WA</p>
            <p className="text-xs text-muted-foreground">Système natif</p>
          </div>
          <div className="h-8 w-px bg-border/50" />
          <div className="space-y-1">
            <p className="font-display text-2xl font-bold text-gradient-gold">VTT</p>
            <p className="text-xs text-muted-foreground">Immersif</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

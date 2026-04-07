import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sparkles, User, Sword, Globe, BookOpen } from 'lucide-react';

const HeroSection = () => {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Atmospheric background */}
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/6 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-feature-compendium/5 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-[80px]" />
      </div>

      <div className="container relative mx-auto px-4 text-center md:px-6">
        {/* Emblem */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-slow rounded-full bg-primary/20 blur-2xl" />
            <Globe className="relative h-16 w-16 text-primary glow-gold animate-float" />
          </div>
        </div>

        <h2 className="font-display text-4xl font-bold text-gradient-gold md:text-5xl lg:text-6xl tracking-wide">
          Aetheria VTT
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm uppercase tracking-[0.3em] text-primary/60 font-display">
          Table Virtuelle Immersive
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
          Explorez l'univers d'Aetheria. Invoquez des créatures du bestiaire directement sur la carte, 
          gérez vos campagnes et vivez des aventures épiques dans un VTT dédié.
        </p>

        {!loading && (
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <>
                <Button variant="gold" size="lg" asChild className="shadow-gold">
                  <Link to="/campaigns">
                    <Sword className="mr-2 h-5 w-5" />
                    Lancer une session
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/compendium">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Explorer le Codex
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="gold" size="lg" asChild className="shadow-gold">
                  <Link to="/auth">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Entrer dans Aetheria
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/compendium">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Explorer le Codex
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
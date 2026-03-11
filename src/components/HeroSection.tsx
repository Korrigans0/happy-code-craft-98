import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sparkles, User, Sword } from 'lucide-react';

const HeroSection = () => {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-feature-compendium blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 text-center md:px-6">
        <h2 className="font-display text-3xl font-bold text-gradient-gold md:text-4xl lg:text-5xl">
          Bienvenue sur DragonTable
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          La table virtuelle ultime pour tous vos jeux de rôle. 
          D&D 5e, Call of Cthulhu, Worlds Awakening et bien d'autres — gérez vos campagnes, lancez des dés et vivez des aventures épiques.
        </p>

        {!loading && (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <>
                <Button variant="gold" size="lg" asChild>
                  <Link to="/characters">
                    <User className="mr-2 h-5 w-5" />
                    Mes Personnages
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/campaigns">
                    <Sword className="mr-2 h-5 w-5" />
                    Mes Campagnes
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="gold" size="lg" asChild>
                  <Link to="/auth">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Commencer l'aventure
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/compendium">
                    Explorer le Compendium
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

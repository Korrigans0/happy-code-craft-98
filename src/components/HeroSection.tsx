const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-feature-compendium blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 text-center md:px-6">
        <h2 className="font-display text-3xl font-bold text-gradient-gold md:text-4xl lg:text-5xl">
          Bienvenue sur DragonTable
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          La table virtuelle ultime pour vos aventures Dungeons & Dragons 5e. 
          Gérez vos campagnes, lancez des dés, et vivez des aventures épiques avec vos amis.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;

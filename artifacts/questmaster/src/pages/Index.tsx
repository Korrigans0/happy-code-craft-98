import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import GameSystemsSection from "@/components/GameSystemsSection";
import CampaignsSection from "@/components/CampaignsSection";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark animate-fade-in">
      <SEO
        title="Aetheria VTT — Table virtuelle Aetheria & Worlds Awakening"
        description="Aetheria VTT : table virtuelle immersive pour Aetheria et Worlds Awakening. Plateau, bestiaire, fiches de personnage, combats et dés en ligne."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Aetheria VTT",
          url: "https://aetheria-vtt.lovable.app/",
          description: "Table virtuelle immersive Aetheria & Worlds Awakening.",
        }}
      />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <GameSystemsSection />
        <CampaignsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

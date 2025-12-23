import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import CampaignsSection from "@/components/CampaignsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <CampaignsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

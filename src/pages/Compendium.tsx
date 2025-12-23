import { useState } from "react";
import { Search, Sparkles, Sword, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SpellsList from "@/components/compendium/SpellsList";
import MonstersList from "@/components/compendium/MonstersList";

const Compendium = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("spells");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-bold text-foreground">
              Compendium D&D 5e
            </h1>
            <p className="mt-2 text-muted-foreground">
              Accédez à tous les sorts et monstres
            </p>
          </div>

          <div className="mx-auto mb-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans le compendium..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 text-base"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2 bg-muted/50">
              <TabsTrigger value="spells" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sparkles className="h-4 w-4" />
                Sorts
              </TabsTrigger>
              <TabsTrigger value="monsters" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sword className="h-4 w-4" />
                Monstres
              </TabsTrigger>
            </TabsList>

            <TabsContent value="spells">
              <SpellsList searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="monsters">
              <MonstersList searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compendium;

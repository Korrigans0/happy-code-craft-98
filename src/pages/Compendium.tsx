import { useState } from "react";
import { Search, Sparkles, Sword, Gem, Swords, BookOpen, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SpellsList from "@/components/compendium/SpellsList";
import MonstersList from "@/components/compendium/MonstersList";
import ItemsList from "@/components/compendium/ItemsList";
import WACreaturesList from "@/components/compendium/WACreaturesList";
import WACodex from "@/components/compendium/WACodex";
import WAHistoire from "@/components/compendium/WAHistoire";

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
              Compendium
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sorts, monstres, objets et ressources — multi-système
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
            <TabsList className="mx-auto mb-8 flex w-full max-w-3xl flex-wrap gap-1 bg-muted/50 p-1">
              <TabsTrigger value="spells" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Sorts
              </TabsTrigger>
              <TabsTrigger value="monsters" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                <Sword className="h-3.5 w-3.5" />
                Monstres
              </TabsTrigger>
              <TabsTrigger value="items" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                <Gem className="h-3.5 w-3.5" />
                Objets
              </TabsTrigger>
              <TabsTrigger value="wa-bestiary" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                <Swords className="h-3.5 w-3.5" />
                Bestiaire WA
              </TabsTrigger>
              <TabsTrigger value="wa-codex" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                <BookOpen className="h-3.5 w-3.5" />
                Codex WA
              </TabsTrigger>
              <TabsTrigger value="wa-histoire" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                <Globe className="h-3.5 w-3.5" />
                Histoire WA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="spells">
              <SpellsList searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="monsters">
              <MonstersList searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="items">
              <ItemsList searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="wa-bestiary">
              <WACreaturesList searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="wa-codex">
              <WACodex />
            </TabsContent>

            <TabsContent value="wa-histoire">
              <WAHistoire />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compendium;

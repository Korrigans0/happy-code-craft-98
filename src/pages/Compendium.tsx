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
import CreateSpellDialog from "@/components/compendium/CreateSpellDialog";
import CreateMonsterDialog from "@/components/compendium/CreateMonsterDialog";
import CreateItemDialog from "@/components/compendium/CreateItemDialog";
import CreateWACreatureDialog from "@/components/compendium/CreateWACreatureDialog";
import { useAuth } from "@/hooks/useAuth";

const Compendium = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [systemTab, setSystemTab] = useState("dnd5e");
  const [dndTab, setDndTab] = useState("spells");
  const [waTab, setWaTab] = useState("wa-bestiary");
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

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
              Ressources multi-système — D&D 5e & Worlds Awakening
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

          {/* System-level tabs */}
          <Tabs value={systemTab} onValueChange={setSystemTab} className="w-full">
            <TabsList className="mx-auto mb-6 flex w-full max-w-md gap-2 bg-muted/50 p-1">
              <TabsTrigger
                value="dnd5e"
                className="flex-1 text-sm font-semibold data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                🐉 D&D 5e
              </TabsTrigger>
              <TabsTrigger
                value="wa"
                className="flex-1 text-sm font-semibold data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              >
                🌍 Worlds Awakening
              </TabsTrigger>
            </TabsList>

            {/* ===== D&D 5e ===== */}
            <TabsContent value="dnd5e">
              <Tabs value={dndTab} onValueChange={setDndTab} className="w-full">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <TabsList className="flex gap-1 bg-muted/50 p-1">
                    <TabsTrigger value="spells" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                      <Sparkles className="h-3.5 w-3.5" /> Sorts
                    </TabsTrigger>
                    <TabsTrigger value="monsters" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                      <Sword className="h-3.5 w-3.5" /> Monstres
                    </TabsTrigger>
                    <TabsTrigger value="items" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                      <Gem className="h-3.5 w-3.5" /> Objets
                    </TabsTrigger>
                  </TabsList>
                  {user && (
                    <div className="flex gap-2">
                      {dndTab === "spells" && <CreateSpellDialog onCreated={triggerRefresh} />}
                      {dndTab === "monsters" && <CreateMonsterDialog onCreated={triggerRefresh} />}
                      {dndTab === "items" && <CreateItemDialog onCreated={triggerRefresh} />}
                    </div>
                  )}
                </div>

                <TabsContent value="spells">
                  <SpellsList key={`spells-${refreshKey}`} searchQuery={searchQuery} />
                </TabsContent>
                <TabsContent value="monsters">
                  <MonstersList key={`monsters-${refreshKey}`} searchQuery={searchQuery} />
                </TabsContent>
                <TabsContent value="items">
                  <ItemsList key={`items-${refreshKey}`} searchQuery={searchQuery} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ===== Worlds Awakening ===== */}
            <TabsContent value="wa">
              <Tabs value={waTab} onValueChange={setWaTab} className="w-full">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <TabsList className="flex gap-1 bg-muted/50 p-1">
                    <TabsTrigger value="wa-bestiary" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:text-sm">
                      <Swords className="h-3.5 w-3.5" /> Bestiaire
                    </TabsTrigger>
                    <TabsTrigger value="wa-codex" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:text-sm">
                      <BookOpen className="h-3.5 w-3.5" /> Codex
                    </TabsTrigger>
                    <TabsTrigger value="wa-histoire" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:text-sm">
                      <Globe className="h-3.5 w-3.5" /> Histoire
                    </TabsTrigger>
                  </TabsList>
                  {user && waTab === "wa-bestiary" && (
                    <CreateWACreatureDialog onCreated={triggerRefresh} />
                  )}
                </div>

                <TabsContent value="wa-bestiary">
                  <WACreaturesList key={`wa-${refreshKey}`} searchQuery={searchQuery} />
                </TabsContent>
                <TabsContent value="wa-codex">
                  <WACodex />
                </TabsContent>
                <TabsContent value="wa-histoire">
                  <WAHistoire />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compendium;

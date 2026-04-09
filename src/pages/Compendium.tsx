import { useState } from "react";
import { Search, Swords, BookOpen, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WACreaturesList from "@/components/compendium/WACreaturesList";
import WACodex from "@/components/compendium/WACodex";
import WAHistoire from "@/components/compendium/WAHistoire";
import CreateWACreatureDialog from "@/components/compendium/CreateWACreatureDialog";
import { useAuth } from "@/hooks/useAuth";

const Compendium = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
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
              Ressources Worlds Awakening — Bestiaire, Codex & Histoire d'Aetheria
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

          <Tabs value={waTab} onValueChange={setWaTab} className="w-full">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <TabsList className="flex gap-1 bg-muted/50 p-1">
                <TabsTrigger value="wa-bestiary" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                  <Swords className="h-3.5 w-3.5" /> Bestiaire
                </TabsTrigger>
                <TabsTrigger value="wa-codex" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
                  <BookOpen className="h-3.5 w-3.5" /> Codex
                </TabsTrigger>
                <TabsTrigger value="wa-histoire" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compendium;

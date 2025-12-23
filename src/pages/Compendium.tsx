import { useState } from "react";
import { Search, BookOpen, Sword, Shield, Sparkles, FlaskConical, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CompendiumCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  itemCount: number;
  color: string;
}

const categories: CompendiumCategory[] = [
  {
    id: "spells",
    name: "Sorts",
    description: "Tous les sorts du Manuel des Joueurs et plus",
    icon: <Sparkles className="h-8 w-8" />,
    itemCount: 362,
    color: "from-purple-500/20 to-purple-600/20",
  },
  {
    id: "monsters",
    name: "Monstres",
    description: "Créatures du Manuel des Monstres",
    icon: <Sword className="h-8 w-8" />,
    itemCount: 450,
    color: "from-red-500/20 to-red-600/20",
  },
  {
    id: "items",
    name: "Objets Magiques",
    description: "Artefacts et objets enchantés",
    icon: <FlaskConical className="h-8 w-8" />,
    itemCount: 284,
    color: "from-amber-500/20 to-amber-600/20",
  },
  {
    id: "equipment",
    name: "Équipement",
    description: "Armes, armures et outils",
    icon: <Shield className="h-8 w-8" />,
    itemCount: 156,
    color: "from-slate-500/20 to-slate-600/20",
  },
  {
    id: "classes",
    name: "Classes",
    description: "Toutes les classes de personnage",
    icon: <BookOpen className="h-8 w-8" />,
    itemCount: 13,
    color: "from-emerald-500/20 to-emerald-600/20",
  },
  {
    id: "races",
    name: "Races",
    description: "Races jouables et leurs traits",
    icon: <Scroll className="h-8 w-8" />,
    itemCount: 48,
    color: "from-blue-500/20 to-blue-600/20",
  },
];

const Compendium = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              Accédez à toutes les règles, sorts, monstres et objets
            </p>
          </div>

          <div className="mx-auto mb-10 max-w-xl">
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                className={`group h-auto flex-col items-start gap-4 rounded-xl border border-border/50 bg-gradient-to-br ${category.color} p-6 text-left shadow-card transition-all duration-300 hover:border-primary/30 hover:bg-opacity-100`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-background/50 text-primary">
                    {category.icon}
                  </div>
                  <span className="rounded-full bg-background/50 px-3 py-1 text-sm font-medium text-muted-foreground">
                    {category.itemCount} entrées
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-border/50 bg-gradient-card p-8 text-center shadow-card">
            <BookOpen className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
              Bientôt disponible
            </h2>
            <p className="mt-2 text-muted-foreground">
              Le compendium complet avec recherche avancée, filtres et favoris
              arrive bientôt. Restez à l'écoute !
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compendium;
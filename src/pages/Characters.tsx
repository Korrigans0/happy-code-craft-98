import { useState } from "react";
import { Plus, Search, Filter, User, Shield, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  campaign?: string;
}

const mockCharacters: Character[] = [
  {
    id: "1",
    name: "Thalion Étoile-d'Argent",
    race: "Elfe",
    class: "Magicien",
    level: 8,
    hp: 45,
    maxHp: 52,
    ac: 14,
    campaign: "La Malédiction de Strahd",
  },
  {
    id: "2",
    name: "Grommash Brisefer",
    race: "Nain",
    class: "Guerrier",
    level: 6,
    hp: 68,
    maxHp: 68,
    ac: 18,
    campaign: "Mines Perdues de Phandelver",
  },
  {
    id: "3",
    name: "Lyra Chantelune",
    race: "Demi-Elfe",
    class: "Barde",
    level: 5,
    hp: 32,
    maxHp: 38,
    ac: 15,
  },
  {
    id: "4",
    name: "Kael le Silencieux",
    race: "Humain",
    class: "Rôdeur",
    level: 7,
    hp: 55,
    maxHp: 55,
    ac: 16,
    campaign: "La Malédiction de Strahd",
  },
];

const Characters = () => {
  const [characters] = useState<Character[]>(mockCharacters);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCharacters = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Mes Personnages
              </h1>
              <p className="text-muted-foreground">
                Créez et gérez vos héros d'aventure
              </p>
            </div>
            <Button variant="gold">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Personnage
            </Button>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un personnage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCharacters.map((char) => (
              <div
                key={char.id}
                className="group overflow-hidden rounded-xl border border-border/50 bg-gradient-card shadow-card transition-all duration-300 hover:border-primary/30"
              >
                <div className="relative h-32 bg-gradient-to-br from-primary/20 to-secondary/20">
                  <div className="absolute -bottom-8 left-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-muted">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="absolute right-3 top-3">
                    <Badge variant="default">Niv. {char.level}</Badge>
                  </div>
                </div>

                <div className="p-4 pt-10">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {char.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {char.race} • {char.class}
                  </p>

                  {char.campaign && (
                    <p className="mt-2 text-xs text-primary">{char.campaign}</p>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-red-400">
                      <Heart className="h-4 w-4" />
                      <span>
                        {char.hp}/{char.maxHp}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Shield className="h-4 w-4" />
                      <span>{char.ac}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-yellow-400">
                      <Zap className="h-4 w-4" />
                      <span>+{Math.floor((char.level - 1) / 4) + 2}</span>
                    </div>
                  </div>

                  <Button variant="join" size="sm" className="mt-4 w-full">
                    Voir la fiche
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Characters;
import { Wand2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
            <Wand2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-primary">
              DragonTable
            </h1>
            <p className="text-xs text-muted-foreground">Table Virtuelle D&D 5e</p>
          </div>
        </div>

        <Button variant="gold" size="default">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Campagne
        </Button>
      </div>
    </header>
  );
};

export default Header;

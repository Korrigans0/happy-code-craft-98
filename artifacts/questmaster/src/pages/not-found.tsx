import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-dark gap-6 text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
        <Compass className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: "8s" }} />
      </div>
      <div>
        <h1 className="font-display text-6xl font-bold text-primary mb-2">404</h1>
        <h2 className="font-display text-2xl font-semibold text-foreground mb-3">Page introuvable</h2>
        <p className="text-muted-foreground max-w-xs">
          Cette page n'existe pas ou a été déplacée dans les brumes d'Aetheria.
        </p>
      </div>
      <Button variant="gold" asChild>
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Link>
      </Button>
    </div>
  );
}

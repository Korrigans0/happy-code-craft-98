import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/useAuth";
import { campaignsApi, charactersApi } from "@/lib/api";
import {
  Map, Users, BookOpen, Library as LibraryIcon, Dices, Sparkles, LayoutDashboard, Crown,
} from "lucide-react";

const PAGES = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/campaigns", label: "Campagnes", icon: Map },
  { to: "/characters", label: "Personnages", icon: Users },
  { to: "/compendium", label: "Codex", icon: BookOpen },
  { to: "/library", label: "Bibliothèque", icon: LibraryIcon },
  { to: "/dice", label: "Lanceur de dés", icon: Dices },
  { to: "/systems", label: "Systèmes de jeu", icon: Sparkles },
  { to: "/subscriptions", label: "Abonnements", icon: Crown },
];

/** Recherche rapide globale (Ctrl/Cmd + K). */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["palette-campaigns", user?.id],
    queryFn: () => campaignsApi.list() as Promise<any[]>,
    enabled: !!user && open,
    staleTime: 60_000,
  });

  const { data: characters = [] } = useQuery({
    queryKey: ["palette-characters", user?.id],
    queryFn: () => charactersApi.list() as Promise<any[]>,
    enabled: !!user && open,
    staleTime: 60_000,
  });

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une page, une campagne, un personnage…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {PAGES.map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
              <p.icon className="mr-2 h-4 w-4" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {campaigns.length > 0 && (
          <CommandGroup heading="Campagnes">
            {campaigns.map((c) => (
              <CommandItem key={c.id} value={`campagne ${c.title}`} onSelect={() => go(`/campaigns/${c.id}`)}>
                <Map className="mr-2 h-4 w-4" />
                {c.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {characters.length > 0 && (
          <CommandGroup heading="Personnages">
            {characters.map((c) => (
              <CommandItem key={c.id} value={`personnage ${c.name}`} onSelect={() => go("/characters")}>
                <Users className="mr-2 h-4 w-4" />
                {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

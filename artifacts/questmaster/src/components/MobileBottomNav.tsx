import { Link, useLocation } from "react-router-dom";
import { Home, Sword, User, BookOpen, Crown } from "lucide-react";

const items = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/campaigns", label: "Campagnes", icon: Sword },
  { to: "/characters", label: "Persos", icon: User },
  { to: "/compendium", label: "Codex", icon: BookOpen },
  { to: "/subscriptions", label: "Premium", icon: Crown },
];

const isActive = (current: string, to: string) =>
  to === "/" ? current === "/" : current === to || current.startsWith(to + "/");

const MobileBottomNav = () => {
  const location = useLocation();

  // Masquer pendant le jeu (la table prend tout l'écran)
  if (location.pathname.startsWith("/campaigns/")) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = isActive(location.pathname, it.to);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_hsl(var(--primary))]" : ""}`} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;

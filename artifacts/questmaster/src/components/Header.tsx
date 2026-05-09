import {
  Menu, X, Sword, User, BookOpen, Dices,
  Home, LogIn, LogOut, UserCircle, Swords, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/lib/api";

const navLinks = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/campaigns", label: "Campagnes", icon: Map },
  { to: "/characters", label: "Personnages", icon: User },
  { to: "/compendium", label: "Codex", icon: BookOpen },
  { to: "/dice", label: "Dés", icon: Dices },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["headerProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try { return await profilesApi.getMe(user.id); } catch { return null; }
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "A";

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50">
      {/* ── Bande dorée fine en haut ── */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

      <div
        className="border-b border-white/5"
        style={{
          background: "linear-gradient(180deg, hsl(213, 55%, 18%) 0%, hsl(213, 52%, 16%) 100%)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 24px hsl(0,0%,0%,0.3), inset 0 -1px 0 hsl(43,67%,47%,0.15)",
        }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, hsl(43,67%,47%) 0%, hsl(35,80%,38%) 100%)",
                boxShadow: "0 0 16px hsl(43,67%,47%,0.3), inset 0 1px 0 hsl(43,80%,70%,0.3)",
              }}
            >
              <Swords className="h-5 w-5 text-slate-900" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-xl font-bold leading-none text-gradient-gold">
                Aetheria
              </h1>
              <p className="text-[9px] uppercase tracking-[3px] text-amber-500/50 mt-0.5">
                Table Virtuelle
              </p>
            </div>
          </Link>

          {/* ── Navigation desktop ── */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-amber-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  style={active ? {
                    background: "hsl(43,67%,47%,0.12)",
                    boxShadow: "inset 0 -2px 0 hsl(43,67%,47%,0.6)",
                  } : undefined}
                >
                  <link.icon className={`h-4 w-4 ${active ? "text-amber-400" : ""}`} />
                  {link.label}
                  {/* Point actif */}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Droite : profil + burger ── */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-amber-500/40 transition-all"
                  >
                    <Avatar className="h-10 w-10 border-2 border-amber-500/30">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback
                        className="font-display text-sm font-bold"
                        style={{
                          background: "linear-gradient(135deg, hsl(213,52%,28%) 0%, hsl(213,52%,22%) 100%)",
                          color: "hsl(43,67%,60%)",
                          border: "1px solid hsl(43,67%,47%,0.3)",
                        }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  style={{
                    background: "hsl(213,52%,18%)",
                    border: "1px solid hsl(43,67%,47%,0.2)",
                    boxShadow: "0 16px 48px hsl(0,0%,0%,0.5)",
                  }}
                >
                  {/* Profil header */}
                  <div className="flex items-center gap-2.5 p-3">
                    <Avatar className="h-9 w-9 border border-amber-500/30">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-amber-500/15 text-amber-400 text-xs font-display">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">
                        {profile?.display_name || "Aventurier"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-white/5" />

                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-slate-100">
                      <UserCircle className="h-4 w-4 text-amber-500/70" />
                      Mon Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/characters" className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-slate-100">
                      <User className="h-4 w-4 text-amber-500/70" />
                      Mes Personnages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/campaigns" className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-slate-100">
                      <Map className="h-4 w-4 text-amber-500/70" />
                      Mes Campagnes
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/5" />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                size="sm"
                style={{
                  background: "linear-gradient(135deg, hsl(43,67%,47%) 0%, hsl(35,80%,38%) 100%)",
                  color: "hsl(213,52%,12%)",
                  fontWeight: "700",
                  boxShadow: "0 0 16px hsl(43,67%,47%,0.25)",
                }}
                className="hidden sm:flex hover:opacity-90 transition-opacity"
              >
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Connexion
                </Link>
              </Button>
            )}

            {/* Burger mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-400 hover:text-slate-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Menu mobile ── */}
      {mobileMenuOpen && (
        <div
          className="md:hidden animate-fade-in"
          style={{
            background: "hsl(213,55%,16%)",
            borderBottom: "1px solid hsl(43,67%,47%,0.15)",
            boxShadow: "0 8px 32px hsl(0,0%,0%,0.4)",
          }}
        >
          <nav className="container mx-auto p-4 space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "text-amber-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                  style={active ? {
                    background: "hsl(43,67%,47%,0.1)",
                    borderLeft: "3px solid hsl(43,67%,47%)",
                  } : undefined}
                >
                  <link.icon className={`h-5 w-5 ${active ? "text-amber-400" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-white/5">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
                  >
                    <UserCircle className="h-5 w-5 text-slate-500" />
                    Mon Profil
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all mt-1"
                  >
                    <LogOut className="h-5 w-5" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, hsl(43,67%,47%) 0%, hsl(35,80%,38%) 100%)",
                    color: "hsl(213,52%,12%)",
                  }}
                >
                  <LogIn className="h-5 w-5" />
                  Connexion
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

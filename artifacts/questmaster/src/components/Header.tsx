import {
  Menu, X, User, BookOpen,
  Home, LogIn, LogOut, UserCircle, Map, Handshake, Crown, HelpCircle, Library as LibraryIcon
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
  { to: "/library", label: "Bibliothèque", icon: LibraryIcon },
  { to: "/guide", label: "Guide", icon: HelpCircle },
  { to: "/subscriptions", label: "Abonnements", icon: Crown },
  { to: "/partners", label: "Partenaires", icon: Handshake },
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
      try { return await profilesApi.getMe(); } catch { return null; }
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
      {/* Bande dorée fine */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(43,75%,50%) 30%, hsl(43,85%,65%) 50%, hsl(43,75%,50%) 70%, transparent)" }} />

      <div
        className="border-b border-amber-500/10"
        style={{
          background: "linear-gradient(180deg, hsl(215,70%,9%) 0%, hsl(215,68%,7%) 100%)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 4px 32px hsl(0,0%,0%,0.5), inset 0 -1px 0 hsl(43,75%,50%,0.12)",
        }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center transition-all duration-300 group-hover:scale-105">
              <img
                src="/aetheria-logo.png"
                alt="Aetheria"
                className="h-11 w-11 rounded-full object-cover"
                style={{ filter: "drop-shadow(0 0 12px hsl(43,75%,50%,0.45))" }}
              />
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
          <nav className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-amber-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                  style={active ? {
                    background: "hsl(43,75%,50%,0.10)",
                  } : undefined}
                >
                  <link.icon className={`h-4 w-4 ${active ? "text-amber-400" : ""}`} />
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full"
                      style={{ background: "linear-gradient(90deg, transparent, hsl(43,75%,55%), transparent)" }} />
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
                    className="relative h-10 w-10 rounded-full p-0 transition-all hover:ring-2 hover:ring-amber-500/40"
                  >
                    <Avatar className="h-10 w-10 border-2 border-amber-500/25">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback
                        className="font-display text-sm font-bold"
                        style={{
                          background: "linear-gradient(135deg, hsl(215,60%,18%) 0%, hsl(215,62%,13%) 100%)",
                          color: "hsl(43,75%,62%)",
                          border: "1px solid hsl(43,75%,50%,0.25)",
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
                    background: "hsl(215,68%,10%)",
                    border: "1px solid hsl(43,75%,50%,0.2)",
                    boxShadow: "0 20px 60px hsl(0,0%,0%,0.7)",
                  }}
                >
                  <div className="flex items-center gap-2.5 p-3">
                    <Avatar className="h-9 w-9 border border-amber-500/25">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs font-display" style={{ background: "hsl(43,75%,50%,0.15)", color: "hsl(43,75%,65%)" }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {profile?.display_name || "Aventurier"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-white/5" />

                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-slate-100">
                      <UserCircle className="h-4 w-4 text-amber-500/60" />
                      Mon Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/characters" className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-slate-100">
                      <User className="h-4 w-4 text-amber-500/60" />
                      Mes Personnages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/campaigns" className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-slate-100">
                      <Map className="h-4 w-4 text-amber-500/60" />
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
                  background: "linear-gradient(135deg, hsl(43,75%,50%) 0%, hsl(35,85%,40%) 100%)",
                  color: "hsl(215,70%,8%)",
                  fontWeight: "700",
                  boxShadow: "0 0 20px hsl(43,75%,50%,0.30)",
                }}
                className="hidden sm:flex hover:opacity-90 transition-opacity"
              >
                <Link to="/sign-in">
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
            background: "hsl(215,68%,8%)",
            borderBottom: "1px solid hsl(43,75%,50%,0.12)",
            boxShadow: "0 8px 40px hsl(0,0%,0%,0.6)",
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
                    background: "hsl(43,75%,50%,0.10)",
                    borderLeft: "3px solid hsl(43,75%,50%)",
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
                  to="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, hsl(43,75%,50%) 0%, hsl(35,85%,40%) 100%)",
                    color: "hsl(215,70%,8%)",
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

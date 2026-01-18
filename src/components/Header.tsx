import { Wand2, Menu, X, Sword, User, BookOpen, Dices, Home, LogIn, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/campaigns", label: "Campagnes", icon: Sword },
  { to: "/characters", label: "Personnages", icon: User },
  { to: "/compendium", label: "Compendium", icon: BookOpen },
  { to: "/dice", label: "Dés", icon: Dices },
];

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
}

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  // Fetch profile for avatar
  const { data: profile } = useQuery({
    queryKey: ['headerProfile', user?.id],
    queryFn: async (): Promise<ProfileData | null> => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles' as any)
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as unknown as ProfileData | null;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = profile?.display_name 
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
            <Wand2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-primary">
              DragonTable
            </h1>
            <p className="text-xs text-muted-foreground">Table Virtuelle D&D 5e</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border border-primary/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{profile?.display_name || 'Aventurier'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Mon Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/characters" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Mes Personnages
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/campaigns" className="flex items-center cursor-pointer">
                    <Sword className="mr-2 h-4 w-4" />
                    Mes Campagnes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="gold" size="default" asChild>
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Connexion
              </Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="border-t border-border/50 bg-background/95 p-4 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <UserCircle className="h-5 w-5" />
                  Mon Profil
                </Link>
                <Button variant="outline" size="default" className="mt-2 w-full" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button variant="gold" size="default" className="mt-2 w-full" asChild>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Connexion
                </Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;

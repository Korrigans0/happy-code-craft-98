import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CharacterCard from "@/components/characters/CharacterCard";
import CharacterForm from "@/components/characters/CharacterForm";
import CharacterSheet from "@/components/characters/CharacterSheet";
import type { Tables } from "@/integrations/supabase/types";

type Character = Tables<"characters">;

const Characters = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch characters for current user
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["characters", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Character[];
    },
    enabled: !!user,
  });

  // Create character
  const createMutation = useMutation({
    mutationFn: async (character: Partial<Character>) => {
      if (!user) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("characters")
        .insert({
          name: character.name || "Nouveau Personnage",
          race: character.race || "Humain",
          class: character.class || "Guerrier",
          subclass: character.subclass,
          level: character.level || 1,
          background: character.background,
          alignment: character.alignment,
          backstory: character.backstory,
          personality_traits: character.personality_traits,
          ideals: character.ideals,
          bonds: character.bonds,
          flaws: character.flaws,
          appearance: character.appearance,
          strength: character.strength || 10,
          dexterity: character.dexterity || 10,
          constitution: character.constitution || 10,
          intelligence: character.intelligence || 10,
          wisdom: character.wisdom || 10,
          charisma: character.charisma || 10,
          hp: character.hp || 10,
          max_hp: character.max_hp || 10,
          armor_class: character.armor_class || 10,
          speed: character.speed || 30,
          gold: character.gold || 0,
          campaign: character.campaign,
          skills: character.skills || [],
          languages: character.languages || ["Commun"],
          inventory: character.inventory,
          equipped_weapon_id: character.equipped_weapon_id,
          equipped_armor_id: character.equipped_armor_id,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters", user?.id] });
      toast({
        title: "Personnage créé",
        description: "Votre personnage a été créé avec succès.",
      });
      setIsFormOpen(false);
      setSelectedCharacter(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le personnage.",
        variant: "destructive",
      });
      console.error("Create error:", error);
    },
  });

  // Update character
  const updateMutation = useMutation({
    mutationFn: async (character: Partial<Character>) => {
      const { data, error } = await supabase
        .from("characters")
        .update(character)
        .eq("id", character.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters", user?.id] });
      toast({
        title: "Personnage mis à jour",
        description: "Les modifications ont été enregistrées.",
      });
      setIsFormOpen(false);
      setIsSheetOpen(false);
      setSelectedCharacter(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le personnage.",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });

  // Delete character
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters", user?.id] });
      toast({
        title: "Personnage supprimé",
        description: "Le personnage a été supprimé.",
      });
      setDeleteConfirmOpen(false);
      setCharacterToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le personnage.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    },
  });

  const handleSave = (characterData: Partial<Character>) => {
    if (selectedCharacter?.id) {
      updateMutation.mutate({ ...characterData, id: selectedCharacter.id });
    } else {
      createMutation.mutate(characterData);
    }
  };

  const handleEdit = (character: Character) => {
    setSelectedCharacter(character);
    setIsFormOpen(true);
    setIsSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    setCharacterToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (characterToDelete) {
      deleteMutation.mutate(characterToDelete);
    }
  };

  const handleViewSheet = (character: Character) => {
    setSelectedCharacter(character);
    setIsSheetOpen(true);
  };

  const handleNewCharacter = () => {
    setSelectedCharacter(null);
    setIsFormOpen(true);
  };

  const filteredCharacters = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.race.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Button variant="gold" onClick={handleNewCharacter}>
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

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl border border-border/50 bg-muted"
                />
              ))}
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                Aucun personnage
              </h3>
              <p className="mt-2 text-muted-foreground">
                Créez votre premier héros pour commencer l'aventure !
              </p>
              <Button variant="gold" className="mt-4" onClick={handleNewCharacter}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un personnage
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewSheet={handleViewSheet}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Character Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
          <CharacterForm
            character={selectedCharacter}
            onSave={handleSave}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedCharacter(null);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Character Sheet View */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
          {selectedCharacter && (
            <CharacterSheet
              character={selectedCharacter}
              onEdit={() => handleEdit(selectedCharacter)}
              onClose={() => {
                setIsSheetOpen(false);
                setSelectedCharacter(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le personnage ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le personnage sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Characters;

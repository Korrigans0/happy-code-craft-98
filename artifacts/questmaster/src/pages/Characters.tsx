import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { charactersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Loader2, Swords, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CharacterCard from "@/components/characters/CharacterCard";
import CharacterForm from "@/components/characters/CharacterForm";
import SheetRouter from "@/components/characters/sheets/SheetRouter";
import AetheriaCharacterSheet from "@/components/characters/AetheriaCharacterSheet";
import PageAmbiance from "@/components/fantasy/PageAmbiance";

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  subclass?: string | null;
  level: number;
  background?: string | null;
  alignment?: string | null;
  backstory?: string | null;
  personality_traits?: string | null;
  ideals?: string | null;
  bonds?: string | null;
  flaws?: string | null;
  appearance?: string | null;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  hp: number;
  max_hp: number;
  armor_class: number;
  speed: number;
  gold: number;
  campaign?: string | null;
  /** Système de jeu (Aetheria, D&D 5e, Pathfinder 2e, …). Ajouté avec le multi-système. */
  system?: string | null;
  /** Données propres au système (jsonb côté DB). */
  system_data?: Record<string, unknown> | null;
  skills?: any;
  languages?: any;
  inventory?: string | null;
  equipped_weapon_id?: string | null;
  equipped_armor_id?: string | null;
  user_id: string;
  created_at: string;
}

// ── Sélecteur de système (multi-système) ───────────────────
// Affiche tous les systèmes du registre `src/lib/systems/`.
// Aetheria reste le système phare (mis en avant), les autres ouvrent le
// CharacterForm générique avec leur configuration propre.
import { SYSTEM_LIST } from "@/lib/systems";

interface SystemSelectorProps {
  onSelect: (systemId: string) => void;
  onCancel: () => void;
}

const SystemSelector = ({ onSelect, onCancel }: SystemSelectorProps) => (
  <div className="flex h-full flex-col bg-gradient-dark">
    <div className="flex items-center justify-between border-b border-border p-4">
      <h2 className="font-display text-xl font-bold text-foreground">
        Créer un Personnage
      </h2>
      <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
    </div>
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <p className="text-center text-muted-foreground">
        Choisissez le système de jeu de votre personnage
      </p>
      <div className="mx-auto grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {SYSTEM_LIST.map((sys) => {
          const tone = sys.featured
            ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70 hover:bg-amber-500/10"
            : sys.partner
            ? "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 hover:bg-blue-500/10"
            : sys.custom
            ? "border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60 hover:bg-violet-500/10"
            : "border-border bg-card hover:border-primary/50 hover:bg-card/80";
          return (
            <button
              key={sys.id}
              onClick={() => onSelect(sys.id)}
              className={`group flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${tone}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/60 text-2xl">
                  {sys.emoji}
                </div>
                <div>
                  <p className="font-display text-base font-bold text-foreground">
                    {sys.label}
                    {sys.featured && <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Phare</span>}
                    {sys.partner && <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">Partenaire</span>}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{sys.defaultRollHint}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{sys.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

// ── Page principale ─────────────────────────────────────────
const Characters = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

  // États des modales
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAetheriaFormOpen, setIsAetheriaFormOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  /** Système sélectionné lors de la création (Aetheria, D&D 5e, Pathfinder 2e, etc.). */
  const [pendingSystem, setPendingSystem] = useState<string>("Aetheria");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/sign-in');
    }
  }, [user, authLoading, navigate]);

  // Fetch personnages
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["characters", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return charactersApi.list();
    },
    enabled: !!user,
  });

  // Créer personnage
  const createMutation = useMutation({
    mutationFn: async (character: Partial<Character>) => {
      if (!user) throw new Error("Non authentifié");
      return charactersApi.create(character);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters", user?.id] });
      toast({ title: "Personnage créé ✓" });
      setIsFormOpen(false);
      setIsAetheriaFormOpen(false);
      setSelectedCharacter(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le personnage.", variant: "destructive" });
    },
  });

  // Mettre à jour personnage
  const updateMutation = useMutation({
    mutationFn: async (character: Partial<Character>) => {
      if (!character.id) throw new Error("ID manquant");
      if (!user) throw new Error("Non authentifié");
      return charactersApi.update(character.id, character);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters", user?.id] });
      toast({ title: "Personnage mis à jour ✓" });
      setIsFormOpen(false);
      setIsAetheriaFormOpen(false);
      setIsSheetOpen(false);
      setSelectedCharacter(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour.", variant: "destructive" });
    },
  });

  // Supprimer personnage
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Non authentifié");
      return charactersApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters", user?.id] });
      toast({ title: "Personnage supprimé" });
      setDeleteConfirmOpen(false);
      setCharacterToDelete(null);
    },
  });

  // ── Handlers ───────────────────────────────────────────────

  const handleSave = useCallback((characterData: Partial<Character>) => {
    if (selectedCharacter?.id) {
      updateMutation.mutate({ ...characterData, id: selectedCharacter.id });
    } else {
      createMutation.mutate(characterData);
    }
  }, [selectedCharacter, updateMutation, createMutation]);

  const handleNewCharacter = useCallback(() => {
    setSelectedCharacter(null);
    setIsSelectorOpen(true);
  }, []);

  const handleSystemSelect = useCallback((systemId: string) => {
    setIsSelectorOpen(false);
    setPendingSystem(systemId);
    // Aetheria a sa propre fiche dédiée. Tous les autres systèmes
    // (WA, D&D 5e, Pathfinder 2e, L'Appel de Cthulhu, Personnalisé)
    // passent par le CharacterForm générique configuré via le registre.
    if (systemId === "Aetheria") {
      setIsAetheriaFormOpen(true);
    } else {
      setIsFormOpen(true);
    }
  }, []);

  const handleEdit = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setIsSheetOpen(false);
    // Priorité au nouveau champ `system`, fallback sur l'ancien marqueur (`campaign === "Aetheria"`
    // ou inventory.__aetheria) pour rester compatible avec les fiches créées avant le multi-système.
    const sys = character.system as string | undefined;
    const isAetheria = sys
      ? sys === "Aetheria"
      : character.campaign === "Aetheria" ||
        (() => { try { return JSON.parse(character.inventory || "{}").__aetheria; } catch { return false; } })();
    setPendingSystem(sys || (isAetheria ? "Aetheria" : "Worlds Awakening"));
    if (isAetheria) {
      setIsAetheriaFormOpen(true);
    } else {
      setIsFormOpen(true);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    setCharacterToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleViewSheet = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setIsSheetOpen(true);
  }, []);

  const isAetheriaCharacter = useCallback((character: Character) => {
    if (character.campaign === "Aetheria") return true;
    try {
      const data = JSON.parse(character.inventory || "{}");
      return data.__aetheria === true;
    } catch {
      return false;
    }
  }, []);

  const uniqueClasses = useMemo(
    () => [...new Set(characters.map(c => c.class))].sort(),
    [characters]
  );
  const filteredCharacters = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return characters.filter(c =>
      (c.name.toLowerCase().includes(q) ||
       c.class.toLowerCase().includes(q) ||
       c.race.toLowerCase().includes(q)) &&
      (classFilter === "all" || c.class === classFilter)
    );
  }, [characters, searchQuery, classFilter]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-dark">
      <PageAmbiance />
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Mes Personnages</h1>
              <p className="text-muted-foreground">Créez et gérez vos héros d'aventure</p>
            </div>
            <Button variant="gold" onClick={handleNewCharacter}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Personnage
            </Button>
          </div>

          {/* Filtres */}
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant={classFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setClassFilter("all")}
              >
                Toutes
              </Button>
              {uniqueClasses.map(cls => (
                <Button
                  key={cls}
                  variant={classFilter === cls ? "default" : "outline"}
                  size="sm"
                  onClick={() => setClassFilter(cls)}
                >
                  {cls}
                </Button>
              ))}
            </div>
          </div>

          {/* Liste personnages */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 animate-pulse rounded-xl border border-border/50 bg-muted" />
              ))}
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 flex gap-4">
                <div className="rounded-full bg-amber-500/10 p-4 border border-amber-500/20">
                  <span className="text-3xl">⚔️</span>
                </div>
                <div className="rounded-full bg-blue-500/10 p-4 border border-blue-500/20">
                  <span className="text-3xl">🌍</span>
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">Aucun personnage</h3>
              <p className="mt-2 text-muted-foreground">Créez votre premier héros pour commencer l'aventure !</p>
              <Button variant="gold" className="mt-4" onClick={handleNewCharacter}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un personnage
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCharacters.map(character => (
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

      {/* ── SÉLECTEUR DE SYSTÈME ─────────────────────────── */}
      <Sheet open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
          <SystemSelector
            onSelect={handleSystemSelect}
            onCancel={() => setIsSelectorOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ── FORMULAIRE GÉNÉRIQUE (multi-système hors Aetheria) ─ */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
          <CharacterForm
            character={selectedCharacter}
            gameSystem={pendingSystem}
            onSave={handleSave}
            onCancel={() => { setIsFormOpen(false); setSelectedCharacter(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* ── FORMULAIRE AETHERIA ──────────────────────────── */}
      <Sheet open={isAetheriaFormOpen} onOpenChange={setIsAetheriaFormOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
          {isAetheriaFormOpen && (
            <AetheriaCharacterSheet
              character={selectedCharacter || {} as Character}
              onSave={handleSave}
              onClose={() => { setIsAetheriaFormOpen(false); setSelectedCharacter(null); }}
              editable={true}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* ── FICHE DE VISUALISATION (routeur multi-système) ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-3xl">
          {selectedCharacter && (
            <SheetRouter
              character={selectedCharacter}
              editable={true}
              onEdit={() => handleEdit(selectedCharacter)}
              onSave={(data) => updateMutation.mutate({ ...data, id: selectedCharacter.id })}
              onClose={() => { setIsSheetOpen(false); setSelectedCharacter(null); }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* ── CONFIRMATION SUPPRESSION ─────────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le personnage ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le personnage sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={() => characterToDelete && deleteMutation.mutate(characterToDelete)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Characters;

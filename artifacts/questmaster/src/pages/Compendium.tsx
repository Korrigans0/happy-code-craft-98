// Compendium — page de codex multi-systèmes.
//
// Chaque système possède son propre onglet et son propre contenu :
// - Aetheria   : bestiaire + codex lore + matchups (composants existants)
// - WA         : bestiaire WA + codex + histoire (composants existants)
// - D&D 5e     : monstres + sorts + objets magiques (tables filtrées par system)
// - Pathfinder : monstres + sorts + objets magiques (tables filtrées par system)
// - Homebrew   : créations personnelles MJ (toutes tables, scope = custom_personal)
//
// Le filtre par système empêche toute contamination entre univers.

import { useState, useCallback } from "react";
import { Search, Swords, BookOpen, Globe, Skull, Sparkles, Map, Scroll, Users, Shield, Gem, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WACreaturesList from "@/components/compendium/WACreaturesList";
import WACodex from "@/components/compendium/WACodex";
import WAHistoire from "@/components/compendium/WAHistoire";
import AetheriaBestiary from "@/components/compendium/AetheriaBestiary";
import AetheriaMatchups from "@/components/compendium/AetheriaMatchups";
import MonstersList from "@/components/compendium/MonstersList";
import SpellsList from "@/components/compendium/SpellsList";
import ItemsList from "@/components/compendium/ItemsList";
import CreateMonsterDialog from "@/components/compendium/CreateMonsterDialog";
import CreateSpellDialog from "@/components/compendium/CreateSpellDialog";
import CreateItemDialog from "@/components/compendium/CreateItemDialog";
import GlyphesCodex from "@/components/compendium/GlyphesCodex";
import { useAuth } from "@/hooks/useAuth";
import { RACES, FACTIONS, KINGDOMS, CONTINENTS, PRIMORDIAL_FORCES } from "@/lib/aetheria-data";
import { SYSTEM_LIST } from "@/lib/systems";
import SEO from "@/components/SEO";
import PageAmbiance from "@/components/fantasy/PageAmbiance";

const COMPENDIUM_SEO = (
  <SEO
    title="Compendium multi-systèmes — Aetheria VTT"
    description="Codex cloisonné par système : Aetheria, D&D 5e, Pathfinder 2e, Worlds Awakening, Homebrew. Bestiaire, sorts, objets et règles."
    path="/compendium"
    jsonLd={{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Compendium Aetheria VTT",
      url: "https://aetheria-vtt.lovable.app/compendium",
    }}
  />
);

// ── Codex Aetheria : placeholder lore (inchangé) ───────────
const AetheriaLore = () => (
  <div className="space-y-6">
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 text-2xl">📖</div>
      <div>
        <h3 className="font-display text-lg font-semibold text-amber-400">Codex Aetheria</h3>
        <p className="mt-1 text-sm text-muted-foreground">Forces primordiales, continents, races et grandes factions de l'univers d'Aetheria.</p>
      </div>
    </div>
    <div>
      <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-400" /> Les 6 Forces Primordiales</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PRIMORDIAL_FORCES.map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
            <span className="text-xl">{f.emoji}</span>
            <div><p className="text-sm font-semibold">{f.name}</p><p className="text-xs text-muted-foreground">{f.aspects}</p></div>
          </div>
        ))}
      </div>
    </div>
    <div>
      <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2"><Map className="h-4 w-4 text-blue-400" /> Continents</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {CONTINENTS.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card/50 p-4">
            <div className="flex items-center gap-2 mb-1"><span className="text-lg">{c.emoji}</span><span className="font-semibold text-sm">{c.name}</span></div>
            <p className="text-xs text-muted-foreground">{c.subtitle}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
          </div>
        ))}
      </div>
    </div>
    <div>
      <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-green-400" /> Races ({RACES.length})</h3>
      <div className="flex flex-wrap gap-2">
        {RACES.map((r) => (
          <div key={r.id} className="flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1" title={r.tagline}>
            <span>{r.emoji}</span><span className="text-xs font-medium">{r.name}</span>
          </div>
        ))}
      </div>
    </div>
    <div>
      <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-red-400" /> Factions</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {FACTIONS.map((f) => (
          <div key={f.id} className="rounded-lg border border-border bg-card/50 p-3">
            <div className="flex items-center gap-2 mb-1"><span className="text-lg">{f.emoji}</span><span className="font-semibold text-sm">{f.name}</span></div>
            <p className="text-xs text-amber-400 italic mb-1">"{f.tagline}"</p>
            <p className="text-xs text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
    <div>
      <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2"><Globe className="h-4 w-4 text-purple-400" /> Royaumes</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {KINGDOMS.map((k) => (
          <div key={k.id} className="rounded-lg border border-border bg-card/50 p-3">
            <div className="flex items-center gap-2 mb-1"><span className="text-lg">{k.emoji}</span><span className="font-semibold text-sm">{k.name}</span><span className="text-xs text-muted-foreground">— {k.continent}</span></div>
            <p className="text-xs text-muted-foreground">{k.nature}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Codex générique pour D&D / Pathfinder / Cthulhu / Homebrew ──────
// Affiche monstres + sorts + objets filtrés par système, avec création possible.
const SystemCodex = ({
  system,
  searchQuery,
  canCreate,
}: {
  system: string;
  searchQuery: string;
  canCreate: boolean;
}) => {
  const [tab, setTab] = useState<"monsters" | "spells" | "items">("monsters");
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TabsList className="flex gap-1 bg-muted/50 p-1">
          <TabsTrigger value="monsters" className="text-xs sm:text-sm flex items-center gap-1.5">
            <Skull className="h-3.5 w-3.5" /> Bestiaire
          </TabsTrigger>
          <TabsTrigger value="spells" className="text-xs sm:text-sm flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5" /> Sorts
          </TabsTrigger>
          <TabsTrigger value="items" className="text-xs sm:text-sm flex items-center gap-1.5">
            <Gem className="h-3.5 w-3.5" /> Objets
          </TabsTrigger>
        </TabsList>
        {canCreate && (
          <div className="flex flex-wrap gap-2">
            {tab === "monsters" && <CreateMonsterDialog defaultSystem={system} onCreated={triggerRefresh} />}
            {tab === "spells" && <CreateSpellDialog defaultSystem={system} onCreated={triggerRefresh} />}
            {tab === "items" && <CreateItemDialog defaultSystem={system} onCreated={triggerRefresh} />}
          </div>
        )}
      </div>
      <TabsContent value="monsters"><MonstersList key={`m-${refreshKey}`} searchQuery={searchQuery} system={system} /></TabsContent>
      <TabsContent value="spells"><SpellsList key={`s-${refreshKey}`} searchQuery={searchQuery} system={system} /></TabsContent>
      <TabsContent value="items"><ItemsList key={`i-${refreshKey}`} searchQuery={searchQuery} system={system} /></TabsContent>
    </Tabs>
  );
};

// ── Page principale ────────────────────────────────────────
const Compendium = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [system, setSystem] = useState<string>("Aetheria");
  const [aetheriaTab, setAetheriaTab] = useState("aetheria-bestiary");
  const [waTab, setWaTab] = useState("wa-bestiary");
  const [refreshKey] = useState(0);

  // L'ordre d'affichage des systèmes (Aetheria phare, WA, D&D, PF2e, Cthulhu, Homebrew).
  const visibleSystems = SYSTEM_LIST;

  return (
    <div className="relative flex min-h-screen flex-col">
      <PageAmbiance />
      {COMPENDIUM_SEO}
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-bold text-foreground">Compendium</h1>
            <p className="mt-2 text-muted-foreground">Codex cloisonné par système de jeu — aucun contenu ne contamine un autre univers.</p>
          </div>

          <div className="mx-auto mb-6 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans le compendium..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 text-base"
              />
            </div>
          </div>

          {/* Sélecteur système */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {visibleSystems.map((s) => {
              const active = system === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSystem(s.id)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-primary bg-primary/15 text-primary shadow-md"
                      : "border-border bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <span className="text-base">{s.emoji}</span>
                  <span>{s.label}</span>
                  {s.featured && <span className="ml-1 text-[10px] text-primary">PHARE</span>}
                  {s.partner && <span className="ml-1 text-[10px] text-blue-400">PARTENAIRE</span>}
                  {s.custom && <span className="ml-1 text-[10px] text-amber-400">LIBRE</span>}
                </button>
              );
            })}
          </div>

          {/* Contenu spécifique par système */}
          {system === "Aetheria" && (
            <Tabs value={aetheriaTab} onValueChange={setAetheriaTab} className="w-full">
              <TabsList className="flex gap-1 bg-muted/50 p-1 mb-6">
                <TabsTrigger value="aetheria-bestiary" className="text-xs sm:text-sm flex items-center gap-1.5">
                  <Skull className="h-3.5 w-3.5" /> Bestiaire
                </TabsTrigger>
                <TabsTrigger value="aetheria-codex" className="text-xs sm:text-sm flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Codex & Lore
                </TabsTrigger>
                <TabsTrigger value="aetheria-matchups" className="text-xs sm:text-sm flex items-center gap-1.5">
                  <Swords className="h-3.5 w-3.5" /> Matchups
                </TabsTrigger>
              </TabsList>
              <TabsContent value="aetheria-bestiary"><AetheriaBestiary isGM={false} /></TabsContent>
              <TabsContent value="aetheria-codex"><AetheriaLore /></TabsContent>
              <TabsContent value="aetheria-matchups"><AetheriaMatchups /></TabsContent>
            </Tabs>
          )}

          {system === "Worlds Awakening" && (
            <Tabs value={waTab} onValueChange={setWaTab} className="w-full">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <TabsList className="flex gap-1 bg-muted/50 p-1">
                  <TabsTrigger value="wa-bestiary" className="text-xs sm:text-sm flex items-center gap-1.5">
                    <Swords className="h-3.5 w-3.5" /> Bestiaire
                  </TabsTrigger>
                  <TabsTrigger value="wa-codex" className="text-xs sm:text-sm flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Codex
                  </TabsTrigger>
                  <TabsTrigger value="wa-histoire" className="text-xs sm:text-sm flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Histoire
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="wa-bestiary"><WACreaturesList key={`wa-${refreshKey}`} searchQuery={searchQuery} /></TabsContent>
              <TabsContent value="wa-codex"><WACodex /></TabsContent>
              <TabsContent value="wa-histoire"><WAHistoire /></TabsContent>
            </Tabs>
          )}

          {(system === "D&D 5e" || system === "Pathfinder 2e" || system === "Call of Cthulhu") && (
            <SystemCodex system={system} searchQuery={searchQuery} canCreate={!!user} />
          )}

          {system === "Personnalisé" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 flex items-start gap-4">
                <Scroll className="h-8 w-8 text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-display text-lg font-semibold text-amber-400">Codex Homebrew</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vos créations personnelles : créatures, sorts et objets Homebrew. Lors de la création,
                    vous choisissez si votre contenu reste privé ou s'il est partagé avec la communauté
                    Aetheria VTT (visible par tous).
                  </p>
                </div>
              </div>
              <SystemCodex system="Personnalisé" searchQuery={searchQuery} canCreate={!!user} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compendium;

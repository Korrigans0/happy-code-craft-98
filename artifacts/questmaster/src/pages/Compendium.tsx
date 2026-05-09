import { useState } from "react";
import {
  Search, Swords, BookOpen, Globe, Skull,
  Sparkles, Map, Scroll, Users, Shield, ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WACreaturesList from "@/components/compendium/WACreaturesList";
import WACodex from "@/components/compendium/WACodex";
import WAHistoire from "@/components/compendium/WAHistoire";
import CreateWACreatureDialog from "@/components/compendium/CreateWACreatureDialog";
import AetheriaBestiary from "@/components/compendium/AetheriaBestiary";
import AetheriaMatchups from "@/components/compendium/AetheriaMatchups";
import { useAuth } from "@/hooks/useAuth";
import { RACES, FACTIONS, KINGDOMS, CONTINENTS, PRIMORDIAL_FORCES } from "@/lib/aetheria-data";

// ── Placeholder Codex Aetheria ──────────────────────────────
const AetheriaCodexPlaceholder = () => (
  <div className="space-y-6">

    {/* Bannière "En construction" */}
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 text-2xl">
        📖
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-amber-400">
          Codex Aetheria — En construction
        </h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Le Codex complet d'Aetheria est en cours de rédaction. Races, classes, règles et lore
          seront disponibles ici très prochainement. En attendant, voici un aperçu du monde.
        </p>
      </div>
    </div>

    {/* Forces primordiales */}
    <div>
      <h3 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        Les 6 Forces Primordiales
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PRIMORDIAL_FORCES.map(f => (
          <div key={f.id} className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
            <span className="text-xl">{f.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{f.name}</p>
              <p className="text-xs text-muted-foreground">{f.aspects}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Continents */}
    <div>
      <h3 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <Map className="h-4 w-4 text-blue-400" />
        Les Continents
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {CONTINENTS.map(c => (
          <div
            key={c.id}
            className={`rounded-lg border p-4 ${
              (c as { special?: boolean }).special
                ? "border-purple-500/40 bg-purple-500/5"
                : "border-border bg-card/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{c.emoji}</span>
              <span className="font-semibold text-foreground text-sm">{c.name}</span>
              {(c as { special?: boolean }).special && (
                <span className="text-xs text-purple-400 border border-purple-500/40 rounded px-1">
                  Mystère
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{c.subtitle}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.description}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Races — aperçu */}
    <div>
      <h3 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-green-400" />
        Les Races ({RACES.length} peuples)
      </h3>
      <div className="space-y-2">
        {(["commune", "elementaire", "rare"] as const).map(cat => (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {cat === "commune" ? "Peuples Communs" : cat === "elementaire" ? "Peuples Élémentaires" : "Peuples Rares"}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {RACES.filter(r => r.category === cat).map(r => (
                <div
                  key={r.id}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1"
                  title={r.tagline}
                >
                  <span>{r.emoji}</span>
                  <span className="text-xs text-foreground font-medium">{r.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Factions */}
    <div>
      <h3 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-red-400" />
        Les Grandes Factions
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {FACTIONS.map(f => (
          <div key={f.id} className="rounded-lg border border-border bg-card/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{f.emoji}</span>
              <span className="font-semibold text-foreground text-sm">{f.name}</span>
            </div>
            <p className="text-xs text-amber-400 italic mb-1">"{f.tagline}"</p>
            <p className="text-xs text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Royaumes */}
    <div>
      <h3 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <Globe className="h-4 w-4 text-purple-400" />
        Les Royaumes d'Edrasil
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {KINGDOMS.map(k => (
          <div key={k.id} className="rounded-lg border border-border bg-card/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{k.emoji}</span>
              <span className="font-semibold text-foreground text-sm">{k.name}</span>
              <span className="text-xs text-muted-foreground">— {k.continent}</span>
            </div>
            <p className="text-xs text-muted-foreground">{k.nature}</p>
            <p className="text-xs text-amber-400 mt-1">👑 {k.ruler.split("—")[0].trim()}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Call to action */}
    <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-5 text-center">
      <Scroll className="h-8 w-8 text-slate-400 mx-auto mb-2" />
      <p className="text-sm text-slate-400">
        Le Codex complet avec les règles, les classes et les capacités arrive bientôt.
      </p>
      <p className="text-xs text-slate-500 mt-1">
        En attendant, consulte le bestiaire Aetheria pour créer tes premières créatures.
      </p>
    </div>
  </div>
);

// ── Page principale ─────────────────────────────────────────
const Compendium = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mainTab, setMainTab] = useState<"aetheria" | "wa">("aetheria");
  const [aetheriaTab, setAetheriaTab] = useState("aetheria-bestiary");
  const [waTab, setWaTab] = useState("wa-bestiary");
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6">

          {/* Titre */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-bold text-foreground">
              Compendium
            </h1>
            <p className="mt-2 text-muted-foreground">
              Ressources pour Aetheria et Worlds Awakening
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="mx-auto mb-8 max-w-xl">
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

          {/* ── SÉLECTEUR PRINCIPAL AETHERIA / WA ─────────── */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-xl border border-border bg-muted/30 p-1 gap-1">

              {/* Bouton Aetheria */}
              <button
                onClick={() => setMainTab("aetheria")}
                className={`flex items-center gap-3 rounded-lg px-6 py-3 transition-all font-semibold text-sm ${
                  mainTab === "aetheria"
                    ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-lg">⚔️</span>
                <div className="text-left">
                  <div>Aetheria</div>
                  <div className={`text-xs font-normal ${mainTab === "aetheria" ? "text-amber-100" : "text-muted-foreground"}`}>
                    Bestiaire & Codex
                  </div>
                </div>
              </button>

              {/* Bouton WA */}
              <button
                onClick={() => setMainTab("wa")}
                className={`flex items-center gap-3 rounded-lg px-6 py-3 transition-all font-semibold text-sm ${
                  mainTab === "wa"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-lg">🌍</span>
                <div className="text-left">
                  <div>Worlds Awakening</div>
                  <div className={`text-xs font-normal ${mainTab === "wa" ? "text-blue-100" : "text-muted-foreground"}`}>
                    Bestiaire, Codex & Histoire
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* ── CÔTÉ AETHERIA ─────────────────────────────── */}
          {mainTab === "aetheria" && (
            <Tabs value={aetheriaTab} onValueChange={setAetheriaTab} className="w-full">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <TabsList className="flex gap-1 bg-muted/50 p-1">
                  <TabsTrigger
                    value="aetheria-bestiary"
                    className="flex items-center gap-1.5 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white sm:text-sm"
                  >
                    <Skull className="h-3.5 w-3.5" />
                    Bestiaire
                  </TabsTrigger>
                  <TabsTrigger
                    value="aetheria-codex"
                    className="flex items-center gap-1.5 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white sm:text-sm"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Codex & Lore
                  </TabsTrigger>
                  <TabsTrigger
                    value="aetheria-matchups"
                    className="flex items-center gap-1.5 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white sm:text-sm"
                  >
                    <Swords className="h-3.5 w-3.5" />
                    Matchups
                  </TabsTrigger>
                </TabsList>
                {user && aetheriaTab === "aetheria-bestiary" && (
                  <div className="text-xs text-muted-foreground">
                    Tu peux ajouter des créatures depuis le bestiaire ci-dessous
                  </div>
                )}
              </div>

              <TabsContent value="aetheria-bestiary">
                <AetheriaBestiary isGM={!!user} />
              </TabsContent>

              <TabsContent value="aetheria-codex">
                <AetheriaCodexPlaceholder />
              </TabsContent>

              <TabsContent value="aetheria-matchups">
                <AetheriaMatchups />
              </TabsContent>
            </Tabs>
          )}

          {/* ── CÔTÉ WORLDS AWAKENING ─────────────────────── */}
          {mainTab === "wa" && (
            <Tabs value={waTab} onValueChange={setWaTab} className="w-full">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <TabsList className="flex gap-1 bg-muted/50 p-1">
                  <TabsTrigger
                    value="wa-bestiary"
                    className="flex items-center gap-1.5 text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white sm:text-sm"
                  >
                    <Swords className="h-3.5 w-3.5" />
                    Bestiaire WA
                  </TabsTrigger>
                  <TabsTrigger
                    value="wa-codex"
                    className="flex items-center gap-1.5 text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white sm:text-sm"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Codex
                  </TabsTrigger>
                  <TabsTrigger
                    value="wa-histoire"
                    className="flex items-center gap-1.5 text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white sm:text-sm"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Histoire
                  </TabsTrigger>
                </TabsList>
                {user && waTab === "wa-bestiary" && (
                  <CreateWACreatureDialog onCreated={triggerRefresh} />
                )}
              </div>

              <TabsContent value="wa-bestiary">
                <WACreaturesList key={`wa-${refreshKey}`} searchQuery={searchQuery} />
              </TabsContent>
              <TabsContent value="wa-codex">
                <WACodex />
              </TabsContent>
              <TabsContent value="wa-histoire">
                <WAHistoire />
              </TabsContent>
            </Tabs>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compendium;

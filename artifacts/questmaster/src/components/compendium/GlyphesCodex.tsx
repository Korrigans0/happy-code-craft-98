// Présente les 3 époques (Nouvel Empire, Présent, Futur) en onglets de
// premier niveau. Seul "Nouvel Empire" est rempli ; les autres affichent un
// placeholder "en développement". Système isolé : ne mélange jamais avec un
// autre univers.

import { Link } from "react-router-dom";
import { ExternalLink, Sparkles, Hourglass, Rocket } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CARACTERISTIQUES, NIVEAUX_DES, DIFFICULTES, RICHESSES, SENS,
  DONS, RACES, ACTIONS_HEROIQUES, APTITUDES, ETATS,
  IMMERSION_TABLE, MAGNITUDE_DEGATS, GLYPHES_CONNUS,
  ARMES_CATEGORIES, ARMURES_CATEGORIES, OBJETS_QUALITE,
  FACTIONS, ATLAS,
} from "@/pages/systems/glyphes/data";

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-amber-500/20 bg-[hsl(215,60%,11%)]/60 p-4">
    {title && <h3 className="mb-2 font-display text-base font-semibold text-amber-300">{title}</h3>}
    <div className="text-sm leading-relaxed text-slate-300">{children}</div>
  </div>
);

const Table = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
  <div className="overflow-x-auto rounded-lg border border-amber-500/20">
    <table className="w-full text-sm">
      <thead className="bg-amber-500/10 text-amber-300">
        <tr>{head.map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody className="text-slate-300">
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 ? "bg-white/[0.02]" : ""}>
            {row.map((c, j) => <td key={j} className="border-t border-white/5 px-3 py-2 align-top">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-3 font-display text-lg font-semibold text-amber-300">{children}</h3>
);

const ComingSoonEra = ({
  icon: Icon, title, subtitle, desc,
}: { icon: typeof Hourglass; title: string; subtitle: string; desc: string }) => (
  <div className="mx-auto max-w-2xl rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[hsl(215,60%,12%)] to-[hsl(215,68%,8%)] p-8 text-center">
    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
      <Icon className="h-8 w-8 text-amber-400" />
    </div>
    <div className="text-xs font-semibold uppercase tracking-widest text-amber-400/70">{subtitle}</div>
    <h3 className="mt-2 font-display text-2xl font-bold text-gradient-gold">{title}</h3>
    <p className="mt-4 text-sm leading-relaxed text-slate-300">{desc}</p>
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-500/10 px-4 py-2 text-xs font-semibold text-slate-300">
      <Hourglass className="h-3.5 w-3.5 animate-pulse" />
      En développement — disponible prochainement.
    </div>
  </div>
);

const NouvelEmpireCodex = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Sparkles className="h-7 w-7 shrink-0 text-amber-400" />
        <div>
          <h3 className="font-display text-lg font-semibold text-amber-300">Codex Glyphes — Nouvel Empire</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Médiéval fantastique. Caractéristiques, races, dons, aptitudes, magie d'évocation, équipement et factions.
            Système indépendant — aucun contenu d'un autre univers ne s'y mélange.
          </p>
        </div>
      </div>
      <Link
        to="/systems/glyphes/nouvel-empire"
        className="inline-flex items-center gap-1.5 self-start rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30"
      >
        Page complète <ExternalLink className="h-3 w-3" />
      </Link>
    </div>

    <Tabs defaultValue="bases" className="w-full">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
        <TabsTrigger value="bases" className="text-xs">Bases</TabsTrigger>
        <TabsTrigger value="races" className="text-xs">Races</TabsTrigger>
        <TabsTrigger value="dons" className="text-xs">Dons</TabsTrigger>
        <TabsTrigger value="aptitudes" className="text-xs">Aptitudes</TabsTrigger>
        <TabsTrigger value="actions" className="text-xs">Actions héroïques</TabsTrigger>
        <TabsTrigger value="etats" className="text-xs">États</TabsTrigger>
        <TabsTrigger value="magie" className="text-xs">Magie</TabsTrigger>
        <TabsTrigger value="equipement" className="text-xs">Équipement</TabsTrigger>
        <TabsTrigger value="monde" className="text-xs">Monde</TabsTrigger>
      </TabsList>

      {/* BASES */}
      <TabsContent value="bases" className="mt-4 space-y-5">
        <Card title="Caractéristiques">
          <div className="grid gap-2 sm:grid-cols-2">
            {CARACTERISTIQUES.map((c) => (
              <div key={c.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-base font-bold text-amber-300">{c.key}</span>
                  <span className="text-sm font-semibold">{c.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Niveaux de dé : <span className="font-mono text-amber-300">{NIVEAUX_DES.join(" → ")}</span>
          </p>
        </Card>
        <div>
          <SectionTitle>Tableau des Difficultés</SectionTitle>
          <Table
            head={["Niveau", "Valeur", "Description"]}
            rows={DIFFICULTES.map((d) => [d.td, d.valeur, d.desc])}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <SectionTitle>Richesses</SectionTitle>
            <Table head={["Pièce", "Taux"]} rows={RICHESSES.map((r) => [r.piece, r.taux])} />
          </div>
          <div>
            <SectionTitle>Sens</SectionTitle>
            <Table head={["Sens", "Formule"]} rows={SENS.map((s) => [s.sens, s.formule])} />
          </div>
        </div>
      </TabsContent>

      {/* RACES */}
      <TabsContent value="races" className="mt-4">
        <div className="grid gap-3 md:grid-cols-2">
          {RACES.map((r) => (
            <Card key={r.nom} title={r.nom}>
              <p className="mb-2 italic text-muted-foreground">{r.desc}</p>
              <ul className="list-disc space-y-1 pl-5 text-xs">
                {r.traits.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* DONS */}
      <TabsContent value="dons" className="mt-4 space-y-4">
        {DONS.map((g) => (
          <div key={g.cat}>
            <SectionTitle>{g.cat}</SectionTitle>
            <div className="grid gap-2 md:grid-cols-2">
              {g.items.map((d) => (
                <div key={d.nom} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-sm font-semibold text-amber-300">{d.nom}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </TabsContent>

      {/* APTITUDES */}
      <TabsContent value="aptitudes" className="mt-4 space-y-4">
        {APTITUDES.map((g) => (
          <div key={g.cat}>
            <SectionTitle>{g.cat}</SectionTitle>
            <Table
              head={["Aptitude", "Caractéristique", "Effet"]}
              rows={g.items.map((a) => [a.nom, a.carac, a.desc])}
            />
          </div>
        ))}
      </TabsContent>

      {/* ACTIONS HÉROÏQUES */}
      <TabsContent value="actions" className="mt-4">
        <Table
          head={["Nom", "Coût", "Effet"]}
          rows={ACTIONS_HEROIQUES.map((a) => [a.nom, a.cout, a.desc])}
        />
      </TabsContent>

      {/* ÉTATS */}
      <TabsContent value="etats" className="mt-4">
        <Table head={["État", "Effet"]} rows={ETATS.map((e) => [e.etat, e.effet])} />
      </TabsContent>

      {/* MAGIE */}
      <TabsContent value="magie" className="mt-4 space-y-5">
        <div>
          <SectionTitle>Table d'Immersion</SectionTitle>
          <Table
            head={["Coût", "Portée", "Magnitude", "Zone"]}
            rows={IMMERSION_TABLE.map((i) => [i.cout, i.portee, i.magnitude, i.zone])}
          />
        </div>
        <div>
          <SectionTitle>Magnitude des dégâts</SectionTitle>
          <Table
            head={["Résilience cible", "Coût d'immersion"]}
            rows={MAGNITUDE_DEGATS.map((m) => [m.resilience, m.cout])}
          />
        </div>
        <div>
          <SectionTitle>Glyphes connus</SectionTitle>
          <div className="grid gap-2 md:grid-cols-3">
            {GLYPHES_CONNUS.map((g) => (
              <Card key={g.nom} title={g.nom}>{g.desc}</Card>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* ÉQUIPEMENT */}
      <TabsContent value="equipement" className="mt-4 space-y-5">
        <div>
          <SectionTitle>Armes</SectionTitle>
          <Table
            head={["Catégorie", "Description", "Exemples"]}
            rows={ARMES_CATEGORIES.map((a) => [a.cat, a.desc, a.exemples])}
          />
        </div>
        <div>
          <SectionTitle>Armures</SectionTitle>
          <Table
            head={["Catégorie", "Protection", "Esquive", "Notes"]}
            rows={ARMURES_CATEGORIES.map((a) => [a.cat, a.protection, a.bonus, a.desc])}
          />
        </div>
        <div>
          <SectionTitle>Objets de qualité</SectionTitle>
          <Table
            head={["Objet", "Prix", "Effet"]}
            rows={OBJETS_QUALITE.map((o) => [o.type, o.prix, o.effet])}
          />
        </div>
      </TabsContent>

      {/* MONDE */}
      <TabsContent value="monde" className="mt-4 space-y-5">
        <div>
          <SectionTitle>Factions</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {FACTIONS.map((f) => (
              <Card key={f.nom} title={f.nom}>{f.desc}</Card>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Atlas des Territoires Libres</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {ATLAS.map((a) => (
              <Card key={a.lieu} title={a.lieu}>{a.desc}</Card>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

export default GlyphesCodex;

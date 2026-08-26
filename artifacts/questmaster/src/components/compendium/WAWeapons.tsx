// Grimoire des armes & équipements — Worlds Awakening.
// Données officielles du codex WA (armes de contact, à distance, magiques,
// équipements). Strictement cloisonné au système Worlds Awakening.

import { useMemo } from "react";
import { Swords, Target, Wand2, Shield } from "lucide-react";
import {
  WA_WEAPONS_CONTACT,
  WA_WEAPONS_RANGED,
  WA_WEAPONS_MAGIC,
  WA_EQUIPMENTS,
} from "@/lib/game-systems";

interface WAWeaponsProps {
  searchQuery?: string;
}

type Row = Record<string, string>;

const Section = ({
  title,
  icon: Icon,
  accent,
  columns,
  rows,
}: {
  title: string;
  icon: typeof Swords;
  accent: string;
  columns: { key: string; label: string }[];
  rows: Row[];
}) => {
  if (rows.length === 0) return null;
  return (
    <section className="rounded-xl border border-border/50 bg-gradient-card p-4 shadow-card">
      <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-foreground">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        {title}
        <span className="text-xs font-normal text-muted-foreground">({rows.length})</span>
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-2 font-semibold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-border/30 last:border-0 hover:bg-card/60">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-2 py-2 ${c.key === "name" ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {row[c.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const WAWeapons = ({ searchQuery = "" }: WAWeaponsProps) => {
  const q = searchQuery.trim().toLowerCase();
  const filter = useMemo(
    () => (rows: Row[]) =>
      q ? rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q))) : rows,
    [q],
  );

  const contact = filter(WA_WEAPONS_CONTACT as unknown as Row[]);
  const ranged = filter(WA_WEAPONS_RANGED as unknown as Row[]);
  const magic = filter(WA_WEAPONS_MAGIC as unknown as Row[]);
  const equipment = filter(WA_EQUIPMENTS as unknown as Row[]);
  const total = contact.length + ranged.length + magic.length + equipment.length;

  const meleeCols = [
    { key: "name", label: "Arme" },
    { key: "use", label: "Usage" },
    { key: "type", label: "Type" },
    { key: "req", label: "Prérequis" },
    { key: "test", label: "Test" },
    { key: "damage", label: "Dégâts" },
    { key: "price", label: "Prix" },
  ];
  const rangedCols = [
    { key: "name", label: "Arme" },
    { key: "use", label: "Usage" },
    { key: "type", label: "Type" },
    { key: "range", label: "Portée" },
    { key: "req", label: "Prérequis" },
    { key: "test", label: "Test" },
    { key: "damage", label: "Dégâts" },
    { key: "price", label: "Prix" },
  ];
  const equipCols = [
    { key: "name", label: "Équipement" },
    { key: "bonus", label: "Effet" },
    { key: "use", label: "Emplacement" },
    { key: "price", label: "Prix" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-5">
        <h2 className="font-display text-lg font-semibold text-blue-300">Grimoire des armes — Worlds Awakening</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Armes de contact, armes à distance, sceptres magiques et équipements du codex officiel
          Worlds Awakening. Monnaie : NX.
        </p>
      </div>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune arme ne correspond à votre recherche.
        </p>
      ) : (
        <>
          <Section title="Armes de contact" icon={Swords} accent="bg-red-500/20 text-red-400" columns={meleeCols} rows={contact} />
          <Section title="Armes à distance" icon={Target} accent="bg-emerald-500/20 text-emerald-400" columns={rangedCols} rows={ranged} />
          <Section title="Armes magiques (sceptres)" icon={Wand2} accent="bg-purple-500/20 text-purple-400" columns={rangedCols} rows={magic} />
          <Section title="Équipements" icon={Shield} accent="bg-amber-500/20 text-amber-400" columns={equipCols} rows={equipment} />
        </>
      )}
    </div>
  );
};

export default WAWeapons;

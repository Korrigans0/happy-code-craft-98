import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Edit, Save, User, Camera } from "lucide-react";
import { RACES, CLASSES, GAME_RULES, getAffinity } from "@/lib/aetheria-data";
import type { Tables } from "@/integrations/supabase/types";

type Character = Tables<"characters">;

interface AetheriaSheetProps {
  character: Character;
  onEdit?: () => void;
  onClose?: () => void;
  onSave?: (data: Partial<Character>) => void;
  editable?: boolean;
}

// ── Helpers visuels ─────────────────────────────────────────

const parchment = {
  background: `
    radial-gradient(ellipse at 15% 10%, #f5e8c8 0%, transparent 55%),
    radial-gradient(ellipse at 85% 90%, #e8d4a8 0%, transparent 55%),
    linear-gradient(160deg, #f0deb0 0%, #e8cfa0 30%, #dfc090 60%, #e8cfa0 100%)
  `,
  border: "2px solid #8B6914",
  boxShadow: "0 0 0 1px #c9a227, 0 0 0 5px #3a2010, 0 0 0 7px #8B6914, 0 20px 60px #00000066",
};

const sectionTitle = (label: string) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0 6px" }}>
    <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #c9a227aa)" }} />
    <span style={{
      fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "2px",
      color: "#8B6914", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const,
    }}>❖ {label} ❖</span>
    <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, #c9a227aa)" }} />
  </div>
);

const diamond = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0" }}>
    <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #c9a22766)" }} />
    <div style={{ width: "6px", height: "6px", background: "#c9a227", transform: "rotate(45deg)" }} />
    <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, #c9a22766)" }} />
  </div>
);

const fieldStyle = {
  background: "transparent",
  border: "none",
  borderBottom: "1px solid #8B6914",
  borderRadius: "0",
  fontFamily: "'IM Fell English', Georgia, serif",
  fontSize: "12px",
  color: "#1a0e00",
  padding: "1px 4px",
  outline: "none",
  width: "100%",
};

const labelStyle = {
  fontFamily: "'Cinzel', serif",
  fontSize: "10px",
  color: "#5a4a2a",
  whiteSpace: "nowrap" as const,
};

function Field({ label, value, onChange, type = "text", disabled = false }: {
  label: string; value: string | number; onChange?: (v: string) => void;
  type?: string; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "3px" }}>
      {label && <span style={labelStyle}>{label} :</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled || !onChange}
        style={{ ...fieldStyle, flex: 1 }}
      />
    </div>
  );
}

function StatBox({ label, value, onChange, color, bg }: {
  label: string; value: number; onChange?: (v: number) => void;
  color: string; bg: string;
}) {
  const mod = Math.floor((value - 10) / 2);
  return (
    <div style={{ flex: 1, border: `2px solid ${color}`, borderRadius: "6px", overflow: "hidden", boxShadow: `0 2px 8px ${color}33` }}>
      <div style={{ background: `linear-gradient(135deg, ${bg}, ${color})`, padding: "5px 4px", textAlign: "center" }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", fontWeight: "700", color: "#f0d080", textShadow: "0 1px 2px #000", letterSpacing: "1px" }}>
          {label}
        </span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.6)", padding: "4px" }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange?.(parseInt(e.target.value) || 0)}
          disabled={!onChange}
          style={{ ...fieldStyle, textAlign: "center", fontSize: "20px", fontWeight: "700", color, borderBottom: `1px solid ${color}66`, padding: "2px" }}
        />
        <div style={{ fontSize: "9px", textAlign: "center", color: "#5a4a2a", fontFamily: "'Cinzel', serif", marginTop: "1px" }}>
          {mod >= 0 ? `+${mod}` : mod}
        </div>
      </div>
    </div>
  );
}

function DiceSelector({ value, onChange, name }: { value: string; onChange?: (v: string) => void; name: string }) {
  const dices = ["1d6", "1d8", "1d10"];
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
      <span style={{ ...labelStyle, fontSize: "9px" }}>Type:</span>
      {dices.map(d => (
        <label key={d} style={{ display: "flex", alignItems: "center", gap: "2px", cursor: "pointer" }}>
          <input
            type="radio"
            name={name}
            value={d}
            checked={value === d}
            onChange={() => onChange?.(d)}
            disabled={!onChange}
            style={{ accentColor: "#8B1A1A" }}
          />
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: value === d ? "#8B1A1A" : "#5a4a2a", fontWeight: value === d ? "700" : "400" }}>
            {d}
          </span>
        </label>
      ))}
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────

export default function AetheriaCharacterSheet({ character, onEdit, onClose, onSave, editable = false }: AetheriaSheetProps) {

  // Parser les données stockées en JSON dans les champs existants
  const parseAetheriaData = () => {
    try {
      const raw = character.inventory || "";
      const parsed = JSON.parse(raw);
      if (parsed.__aetheria) return parsed;
    } catch {}
    return null;
  };

  const aetheriaData = parseAetheriaData();

  const [editing, setEditing] = useState(editable);
  const [data, setData] = useState({
    // Identité — champs directs
    nom: character.name || "",
    race: character.race || "Humain",
    classe: character.class || "Artilleur Arcanique",
    sousClasse: character.subclass || "",
    niveau: character.level || 1,
    // Histoire
    histoire: character.backstory || "",
    ambition: character.personality_traits || "",
    peur: character.flaws || "",
    lienAetheria: character.bonds || "",
    // État
    pvActuel: character.hp || 10,
    pvMax: character.max_hp || 10,
    pe: aetheriaData?.pe || 0,
    peMax: aetheriaData?.peMax || 5,
    // Stats Aetheria — mappées sur les colonnes existantes
    force: character.strength || 0,
    agilite: character.dexterity || 0,
    esprit: character.intelligence || 0,
    endurance: character.constitution || 0,
    // Défenses
    defPhys: character.armor_class || 10,
    defMag: aetheriaData?.defMag || 10,
    redPhys: aetheriaData?.redPhys || 0,
    redMag: aetheriaData?.redMag || 0,
    // Armes
    armePrincipale: aetheriaData?.armePrincipale || "",
    armePrincipaleType: aetheriaData?.armePrincipaleType || "1d8",
    armePrincipaleBonus: aetheriaData?.armePrincipaleBonus || "",
    armeSecondaire: aetheriaData?.armeSecondaire || "",
    armeSecondaireType: aetheriaData?.armeSecondaireType || "1d6",
    armeSecondaireBonus: aetheriaData?.armeSecondaireBonus || "",
    // Armure
    armureType: aetheriaData?.armureType || "",
    armureReduction: aetheriaData?.armureReduction || "",
    armureEffet: aetheriaData?.armureEffet || "",
    // Compétences
    competence1: aetheriaData?.competence1 || "",
    competence2: aetheriaData?.competence2 || "",
    // Familier
    familierNom: aetheriaData?.familierNom || "",
    familierType: aetheriaData?.familierType || "",
    familierEffet: aetheriaData?.familierEffet || "",
    // Classe
    capacitesActuelles: aetheriaData?.capacitesActuelles || "",
    evolution: aetheriaData?.evolution || "",
    choix1: aetheriaData?.choix1 || "",
    choix2: aetheriaData?.choix2 || "",
    choix3: aetheriaData?.choix3 || "",
    // Inventaire
    inventaire: aetheriaData?.inventaireItems || ["", "", ""],
    or: character.gold?.toString() || "0",
    // Notes
    notes: character.appearance || "",
  });

  const set = (key: string, value: string | number | string[]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!onSave) return;
    // Sérialiser les données Aetheria dans le champ inventory
    const aetheriaPayload = {
      __aetheria: true,
      pe: data.pe, peMax: data.peMax,
      defMag: data.defMag, redPhys: data.redPhys, redMag: data.redMag,
      armePrincipale: data.armePrincipale, armePrincipaleType: data.armePrincipaleType, armePrincipaleBonus: data.armePrincipaleBonus,
      armeSecondaire: data.armeSecondaire, armeSecondaireType: data.armeSecondaireType, armeSecondaireBonus: data.armeSecondaireBonus,
      armureType: data.armureType, armureReduction: data.armureReduction, armureEffet: data.armureEffet,
      competence1: data.competence1, competence2: data.competence2,
      familierNom: data.familierNom, familierType: data.familierType, familierEffet: data.familierEffet,
      capacitesActuelles: data.capacitesActuelles, evolution: data.evolution,
      choix1: data.choix1, choix2: data.choix2, choix3: data.choix3,
      inventaireItems: data.inventaire,
    };
    onSave({
      name: data.nom,
      race: data.race,
      class: data.classe,
      subclass: data.sousClasse,
      level: Number(data.niveau),
      backstory: data.histoire,
      personality_traits: data.ambition,
      flaws: data.peur,
      bonds: data.lienAetheria,
      hp: Number(data.pvActuel),
      max_hp: Number(data.pvMax),
      strength: Number(data.force),
      dexterity: Number(data.agilite),
      intelligence: Number(data.esprit),
      constitution: Number(data.endurance),
      armor_class: Number(data.defPhys),
      gold: Number(data.or),
      appearance: data.notes,
      inventory: JSON.stringify(aetheriaPayload),
      campaign: "Aetheria",
    });
    setEditing(false);
  };

  // Affinité race/classe
  const affinity = getAffinity(
    RACES.find(r => r.name === data.race)?.id || "",
    CLASSES.find(c => c.name === data.classe)?.id || ""
  );

  const inp = editing ? undefined : undefined; // editing controls onChange

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Header actions */}
      <div className="flex items-center justify-between border-b border-slate-700 p-3">
        <div className="flex items-center gap-3">
          {character.avatar_url ? (
            <img src={character.avatar_url} alt={data.nom} className="h-12 w-12 rounded-full object-cover border-2 border-amber-500/40" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-500/40">
              <User className="h-6 w-6 text-amber-400" />
            </div>
          )}
          <div>
            <p className="font-display font-bold text-amber-400">{data.nom || "Nouveau Personnage"}</p>
            <p className="text-xs text-slate-400">{data.race} • {data.classe} • Niv. {data.niveau}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <Button size="sm" onClick={handleSave} className="bg-amber-600 hover:bg-amber-500 text-white">
              <Save className="mr-1 h-4 w-4" /> Sauvegarder
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="border-amber-500/40 text-amber-400">
              <Edit className="mr-1 h-4 w-4" /> Modifier
            </Button>
          )}
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* ── FICHE PARCHEMIN ─────────────────────────── */}
          <div style={{ ...parchment, borderRadius: "4px", padding: "16px", maxWidth: "700px", margin: "0 auto" }}>

            {/* Coins décoratifs */}
            {[["top:4px", "left:4px", "top", "left"], ["top:4px", "right:4px", "top", "right"], ["bottom:4px", "left:4px", "bottom", "left"], ["bottom:4px", "right:4px", "bottom", "right"]].map(([t, lr, bt, rl], i) => (
              <div key={i} style={{
                position: "absolute", [bt]: "4px", [rl]: "4px",
                width: "16px", height: "16px",
                borderTop: i < 2 ? "2px solid #c9a227" : "none",
                borderBottom: i >= 2 ? "2px solid #c9a227" : "none",
                borderLeft: [0, 2].includes(i) ? "2px solid #c9a227" : "none",
                borderRight: [1, 3].includes(i) ? "2px solid #c9a227" : "none",
              }} />
            ))}

            {/* ── EN-TÊTE ────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #0d1f3c, #1a3a6b, #0d1f3c)",
                border: "2px solid #c9a227",
                boxShadow: "0 0 0 1px #8B6914, 0 4px 20px #00000066",
                borderRadius: "4px", padding: "6px 36px", position: "relative",
              }}>
                <div style={{ position: "absolute", left: "-14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "26px", background: "#0a1628", clipPath: "polygon(0 50%, 100% 0, 100% 100%)" }} />
                <div style={{ position: "absolute", right: "-14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "26px", background: "#0a1628", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
                <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "28px", fontWeight: "900", color: "#f0d060", textShadow: "0 0 20px #c9a22744, 0 2px 4px #000", letterSpacing: "5px" }}>
                  AETHERIA
                </h1>
              </div>
            </div>

            {/* ── IDENTITÉ ───────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 2fr 0.8fr", gap: "8px", marginBottom: "6px" }}>
              {[
                { label: "Nom", key: "nom" },
                { label: "Race", key: "race" },
                { label: "Classe", key: "classe" },
                { label: "Sous-classe", key: "sousClasse" },
                { label: "Niveau", key: "niveau", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <span style={{ ...labelStyle, fontSize: "9px", display: "block", marginBottom: "1px" }}>{f.label}</span>
                  {f.key === "race" && editing ? (
                    <select value={data.race} onChange={e => set("race", e.target.value)}
                      style={{ ...fieldStyle, fontSize: "11px" }}>
                      {RACES.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  ) : f.key === "classe" && editing ? (
                    <select value={data.classe} onChange={e => set("classe", e.target.value)}
                      style={{ ...fieldStyle, fontSize: "11px" }}>
                      {CLASSES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type || "text"}
                      value={data[f.key as keyof typeof data] as string}
                      onChange={editing ? e => set(f.key, e.target.value) : undefined}
                      readOnly={!editing}
                      style={{ ...fieldStyle, fontSize: "11px" }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Affinité race/classe */}
            {affinity && affinity.bonusChoices.length > 0 && (
              <div style={{ marginBottom: "6px", padding: "4px 8px", borderRadius: "4px", background: "rgba(139, 105, 20, 0.1)", border: "1px solid #c9a22744" }}>
                <span style={{ ...labelStyle, fontSize: "9px" }}>✦ Affinité {affinity.level} : {affinity.loreReason}</span>
              </div>
            )}

            {diamond()}

            {/* ── HISTOIRE & ÉTAT ────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", marginBottom: "4px" }}>
              <div>
                {sectionTitle("Histoire & Motivations")}
                {[
                  { label: "Histoire", key: "histoire" },
                  { label: "Ambition", key: "ambition" },
                  { label: "Peur / Faiblesse", key: "peur" },
                  { label: "Lien avec Aetheria", key: "lienAetheria" },
                ].map(f => (
                  <Field key={f.key} label={f.label} value={data[f.key as keyof typeof data] as string}
                    onChange={editing ? v => set(f.key, v) : undefined} />
                ))}
              </div>

              {/* État du personnage */}
              <div style={{ border: "2px solid #8B6914", borderRadius: "4px", padding: "10px", background: "rgba(255,245,220,0.7)", minWidth: "150px" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "#3a2a10", textAlign: "center", marginBottom: "8px", letterSpacing: "1px", borderBottom: "1px solid #c9a22766", paddingBottom: "4px" }}>
                  État du Personnage
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", color: "#8B1A1A", fontWeight: "700" }}>PV</span>
                  <input type="number" value={data.pvActuel} onChange={editing ? e => set("pvActuel", e.target.value) : undefined}
                    style={{ width: "34px", textAlign: "center", background: "#fff8ee", border: "1px solid #8B6914", borderRadius: "3px", fontFamily: "'Cinzel', serif", fontSize: "13px", color: "#8B1A1A", fontWeight: "700" }} />
                  <span style={{ color: "#8B6914" }}>/</span>
                  <input type="number" value={data.pvMax} onChange={editing ? e => set("pvMax", e.target.value) : undefined}
                    style={{ width: "34px", textAlign: "center", background: "#fff8ee", border: "1px solid #8B6914", borderRadius: "3px", fontFamily: "'Cinzel', serif", fontSize: "13px", color: "#8B1A1A", fontWeight: "700" }} />
                </div>
                {/* Barre PV */}
                <div style={{ height: "4px", background: "#e8d4a8", borderRadius: "2px", marginBottom: "6px", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "2px", background: data.pvActuel / data.pvMax > 0.5 ? "#2D5A1B" : data.pvActuel / data.pvMax > 0.25 ? "#8B6914" : "#8B1A1A", width: `${Math.min(100, (Number(data.pvActuel) / Number(data.pvMax)) * 100)}%`, transition: "width 0.3s" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "#1A3A6B", fontWeight: "700" }}>PE</span>
                  <input type="number" value={data.pe} onChange={editing ? e => set("pe", e.target.value) : undefined}
                    style={{ width: "30px", textAlign: "center", background: "#eef4ff", border: "1px solid #1A3A6B88", borderRadius: "3px", fontFamily: "'Cinzel', serif", fontSize: "12px", color: "#1A3A6B", fontWeight: "700" }} />
                  <span style={{ color: "#8B6914" }}>/</span>
                  <input type="number" value={data.peMax} onChange={editing ? e => set("peMax", e.target.value) : undefined}
                    style={{ width: "30px", textAlign: "center", background: "#eef4ff", border: "1px solid #1A3A6B88", borderRadius: "3px", fontFamily: "'Cinzel', serif", fontSize: "12px", color: "#1A3A6B", fontWeight: "700" }} />
                </div>
              </div>
            </div>

            {diamond()}

            {/* ── CARACTÉRISTIQUES ───────────────────────── */}
            {sectionTitle("Caractéristiques")}
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
              {[
                { key: "force", label: "Force", color: "#8B1A1A", bg: "#5a0e0e" },
                { key: "agilite", label: "Agilité", color: "#2D5A1B", bg: "#1a3a0e" },
                { key: "esprit", label: "Esprit", color: "#1A3A6B", bg: "#0e2040" },
                { key: "endurance", label: "Endurance", color: "#6B3A1A", bg: "#3a1e0e" },
              ].map(s => (
                <StatBox key={s.key} label={s.label} value={data[s.key as keyof typeof data] as number}
                  onChange={editing ? v => set(s.key, v) : undefined}
                  color={s.color} bg={s.bg} />
              ))}
            </div>

            {diamond()}

            {/* ── DÉFENSES + RÉDUCTION ───────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: "10px", marginBottom: "6px" }}>
              <div>
                {sectionTitle("Défenses")}
                <Field label="DEF Physique" value={data.defPhys}
                  onChange={editing ? v => set("defPhys", v) : undefined} />
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <Field label="DEF Magique" value={data.defMag}
                    onChange={editing ? v => set("defMag", v) : undefined} />
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "#5a4a2a", whiteSpace: "nowrap" }}>(Max: <strong>16</strong>)</span>
                </div>
              </div>
              <div style={{ background: "linear-gradient(to bottom, transparent, #c9a22766, transparent)" }} />
              <div>
                {sectionTitle("Réduction de Dégâts")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <Field label="Physique" value={data.redPhys}
                    onChange={editing ? v => set("redPhys", v) : undefined} />
                  <Field label="Magique" value={data.redMag}
                    onChange={editing ? v => set("redMag", v) : undefined} />
                </div>
              </div>
            </div>

            {diamond()}

            {/* ── ARMES + ARMURE ─────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: "10px", marginBottom: "6px" }}>
              <div>
                {sectionTitle("Armes")}
                <Field label="Arme principale" value={data.armePrincipale}
                  onChange={editing ? v => set("armePrincipale", v) : undefined} />
                <DiceSelector name="arme1" value={data.armePrincipaleType}
                  onChange={editing ? v => set("armePrincipaleType", v) : undefined} />
                <Field label="Bonus" value={data.armePrincipaleBonus}
                  onChange={editing ? v => set("armePrincipaleBonus", v) : undefined} />
                <div style={{ marginTop: "6px" }} />
                <Field label="Arme secondaire" value={data.armeSecondaire}
                  onChange={editing ? v => set("armeSecondaire", v) : undefined} />
                <DiceSelector name="arme2" value={data.armeSecondaireType}
                  onChange={editing ? v => set("armeSecondaireType", v) : undefined} />
                <Field label="Bonus" value={data.armeSecondaireBonus}
                  onChange={editing ? v => set("armeSecondaireBonus", v) : undefined} />
              </div>

              <div style={{ background: "linear-gradient(to bottom, transparent, #c9a22766, transparent)" }} />

              <div>
                {sectionTitle("Armure")}
                <Field label="Type" value={data.armureType}
                  onChange={editing ? v => set("armureType", v) : undefined} />
                <Field label="Réduction" value={data.armureReduction}
                  onChange={editing ? v => set("armureReduction", v) : undefined} />
                <Field label="Effet / Contrainte" value={data.armureEffet}
                  onChange={editing ? v => set("armureEffet", v) : undefined} />

                {/* Compétences */}
                <div style={{ marginTop: "8px", padding: "6px 8px", background: "linear-gradient(135deg, #8B1A1A, #5a0e0e)", borderRadius: "3px", border: "1px solid #c9a22766" }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "#f0d060", letterSpacing: "1px" }}>❖ Compétences ❖</span>
                </div>
                {[["competence1", "+1"], ["competence2", "+1"]].map(([key, prefix]) => (
                  <div key={key} style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "3px" }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", color: "#2D5A1B", fontWeight: "700" }}>{prefix}</span>
                    <input value={data[key as keyof typeof data] as string}
                      onChange={editing ? e => set(key, e.target.value) : undefined}
                      readOnly={!editing}
                      style={{ ...fieldStyle, flex: 1 }} />
                  </div>
                ))}

                {/* Familier */}
                <div style={{ marginTop: "8px", padding: "6px 8px", background: "linear-gradient(135deg, #8B1A1A, #5a0e0e)", borderRadius: "3px", border: "1px solid #c9a22766" }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "#f0d060", letterSpacing: "1px" }}>❖ Familier / Monture ❖</span>
                </div>
                <Field label="Nom" value={data.familierNom}
                  onChange={editing ? v => set("familierNom", v) : undefined} />
                <Field label="Type" value={data.familierType}
                  onChange={editing ? v => set("familierType", v) : undefined} />
                <Field label="Effet" value={data.familierEffet}
                  onChange={editing ? v => set("familierEffet", v) : undefined} />
              </div>
            </div>

            {diamond()}

            {/* ── COMPÉTENCES DE CLASSE + RÈGLES ─────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: "10px" }}>
              <div>
                <div style={{ background: "linear-gradient(135deg, #0d1f3c, #1a3a6b)", border: "1px solid #c9a227", borderRadius: "4px", padding: "4px 10px", marginBottom: "6px", textAlign: "center" }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "#f0d060", letterSpacing: "2px" }}>❖ Compétences de Classe ❖</span>
                </div>
                <Field label="Capacités actuelles" value={data.capacitesActuelles}
                  onChange={editing ? v => set("capacitesActuelles", v) : undefined} />
                <div style={{ marginTop: "4px" }}>
                  <Field label="✦ Évolution" value={data.evolution}
                    onChange={editing ? v => set("evolution", v) : undefined} />
                </div>
                {[["choix1", "Choix 1"], ["choix2", "Choix 2"], ["choix3", "Choix 3"]].map(([key, label]) => (
                  <div key={key} style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "3px", paddingLeft: "6px" }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "#c9a227" }}>✧</span>
                    <Field label={label} value={data[key as keyof typeof data] as string}
                      onChange={editing ? v => set(key, v) : undefined} />
                  </div>
                ))}

                {/* Inventaire */}
                <div style={{ marginTop: "8px" }}>
                  {sectionTitle("Inventaire")}
                  {(data.inventaire as string[]).map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "3px" }}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "#c9a227" }}>✧</span>
                      <input value={item}
                        onChange={editing ? e => {
                          const inv = [...(data.inventaire as string[])];
                          inv[i] = e.target.value;
                          set("inventaire", inv);
                        } : undefined}
                        readOnly={!editing}
                        style={{ ...fieldStyle, flex: 1 }} />
                    </div>
                  ))}
                  <Field label="Or" value={data.or}
                    onChange={editing ? v => set("or", v) : undefined} />
                </div>
              </div>

              <div style={{ background: "linear-gradient(to bottom, transparent, #c9a22766, transparent)" }} />

              <div>
                {/* Règles tour de jeu */}
                <div style={{ background: "linear-gradient(135deg, #0d1f3c, #1a3a6b)", border: "1px solid #c9a227", borderRadius: "4px", padding: "4px 10px", marginBottom: "6px", textAlign: "center" }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "#f0d060", letterSpacing: "2px" }}>❖ Règles — Tour de Jeu ❖</span>
                </div>
                <div style={{ background: "linear-gradient(135deg, #0d1f3c, #1a3a6b, #0d1f3c)", border: "1px solid #c9a22788", borderRadius: "4px", padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                  {[
                    { icon: "⚡", label: "1 Mouvement", color: "#7dd3fc" },
                    { icon: "⚔️", label: "1 Action", color: "#86efac" },
                    { icon: "🪨", label: "1 Action Granite", color: "#fbbf24" },
                    { icon: "🛡️", label: "1 Réaction", color: "#f9a8d4" },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px" }}>{item.icon}</span>
                      <div style={{ flex: 1, height: "1px", background: `${item.color}44` }} />
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", color: item.color, fontWeight: "600" }}>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div style={{ marginTop: "10px" }}>
                  {sectionTitle("Notes")}
                  <textarea
                    value={data.notes}
                    onChange={editing ? e => set("notes", e.target.value) : undefined}
                    readOnly={!editing}
                    rows={4}
                    style={{ width: "100%", background: "rgba(255,245,220,0.5)", border: "1px solid #8B691444", borderRadius: "4px", fontFamily: "'IM Fell English', Georgia, serif", fontSize: "11px", color: "#1a0e00", padding: "6px", outline: "none", resize: "vertical" as const }}
                    placeholder="Notes libres..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <div style={{ display: "inline-block", width: "14px", height: "14px", background: "linear-gradient(135deg, #1A3A6B, #4a7acc)", border: "1px solid #c9a227", transform: "rotate(45deg)", boxShadow: "0 0 8px #1A3A6B88" }} />
            </div>

          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

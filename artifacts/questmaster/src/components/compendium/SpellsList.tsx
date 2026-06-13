import { useState, useEffect } from "react";
import { compendiumApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Clock, Target, Layers } from "lucide-react";

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  classes: string[];
}

interface SpellsListProps {
  searchQuery: string;
  system?: string;
}

const SpellsList = ({ searchQuery, system }: SpellsListProps) => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

  useEffect(() => {
    fetchSpells();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system]);

  const fetchSpells = async () => {
    setLoading(true);
    try {
      const data = await compendiumApi.getSpells(system);
      setSpells((data as Spell[]) || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredSpells = spells.filter((spell) => {
    const matchesSearch = spell.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spell.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || spell.level.toString() === levelFilter;
    const matchesSchool = schoolFilter === "all" || spell.school === schoolFilter;
    const matchesClass = classFilter === "all" || spell.classes.includes(classFilter);
    return matchesSearch && matchesLevel && matchesSchool && matchesClass;
  });

  const schools = [...new Set(spells.map(s => s.school))];
  const classes = [...new Set(spells.flatMap(s => s.classes))];

  const getLevelLabel = (level: number) => {
    if (level === 0) return "Tour de magie";
    return `Niveau ${level}`;
  };

  const getSchoolColor = (school: string) => {
    const colors: Record<string, string> = {
      "Évocation": "bg-red-500/20 text-red-400 border-red-500/30",
      "Abjuration": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Illusion": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Divination": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "Transmutation": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    return colors[school] || "bg-muted text-muted-foreground border-border";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">Tous niveaux</SelectItem>
            <SelectItem value="0">Tour de magie</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
              <SelectItem key={l} value={l.toString()}>Niveau {l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={schoolFilter} onValueChange={setSchoolFilter}>
          <SelectTrigger className="w-[160px] bg-muted/50 border-border/50">
            <SelectValue placeholder="École" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">Toutes écoles</SelectItem>
            {schools.map(school => (
              <SelectItem key={school} value={school}>{school}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[160px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">Toutes classes</SelectItem>
            {classes.map(cls => (
              <SelectItem key={cls} value={cls}>{cls}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filteredSpells.length} sort{filteredSpells.length > 1 ? "s" : ""} trouvé{filteredSpells.length > 1 ? "s" : ""}
      </p>

      {/* Spells grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSpells.map((spell) => (
          <div
            key={spell.id}
            className="group cursor-pointer rounded-xl border border-border/50 bg-gradient-card p-5 shadow-card transition-all duration-300 hover:border-primary/30"
            onClick={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">
                    {spell.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {getLevelLabel(spell.level)}
                  </p>
                </div>
              </div>
              <Badge className={`shrink-0 ${getSchoolColor(spell.school)}`}>
                {spell.school}
              </Badge>
            </div>

            {expandedSpell === spell.id && (
              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {spell.casting_time}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    {spell.range}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    {spell.components}
                  </div>
                  <div className="text-muted-foreground">
                    {spell.duration}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {spell.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {spell.classes.map(cls => (
                    <Badge key={cls} variant="outline" className="text-xs border-border/50">
                      {cls}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSpells.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-gradient-card p-8 text-center shadow-card">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Aucun sort trouvé avec ces critères
          </p>
        </div>
      )}
    </div>
  );
};

export default SpellsList;

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import { X, Save, Sword, Shield, BookOpen, User, Dices, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSystemConfig, WA_ASCENDANCE_BONUSES, WA_CLASS_BONUSES, WA_ASCENDANCE_META, WA_CLASS_META, WA_STATS, WA_WEAPONS_CONTACT, WA_WEAPONS_RANGED, WA_WEAPONS_MAGIC, WA_EQUIPMENTS } from "@/lib/game-systems";
import { getSystem, SYSTEM_LIST } from "@/lib/systems";
import { waMaxHp, waDefPhy, waDefMag, waMaxPm, waMagicStat, WA_MAX_LEVEL } from "@/lib/systems/wa-rules";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AvatarCropDialog from "@/components/profile/AvatarCropDialog";

type Character = any;

interface CharacterFormProps {
  character?: Character | null;
  onSave: (character: Partial<Character>) => void;
  onCancel: () => void;
  /** Système initial quand on crée un nouveau personnage (Aetheria, D&D 5e, …). */
  gameSystem?: string;
}


const CharacterForm = ({ character, onSave, onCancel, gameSystem }: CharacterFormProps) => {
  // Système actif : priorité à la fiche existante, sinon le système passé en prop,
  // sinon WA (compat ascendante — l'ancien formulaire était mono-WA).
  const initialSystem = character?.system || gameSystem || "Worlds Awakening";
  const initialSystemConfig = getSystemConfig(initialSystem);
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Character>>({
    name: "",
    system: initialSystem,
    race: initialSystemConfig.races[0] || "",
    class: initialSystemConfig.classes[0] || "",
    subclass: "",
    level: 1,
    background: "",
    alignment: "",
    backstory: "",
    personality_traits: "",
    ideals: "",
    bonds: "",
    flaws: "",
    appearance: "",
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
    hp: 10,
    max_hp: 10,
    armor_class: 10,
    speed: 30,
    gold: 0,
    campaign: initialSystem,
    saving_throws: [],
    ...character,
  });

  // Recalculé à chaque rendu en fonction du système actif de la fiche.
  const systemConfig = getSystemConfig(formData.system as string);
  const systemDef = getSystem(formData.system as string);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [comparison, setComparison] = useState<{ before: string | null; after: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (comparison?.before?.startsWith('blob:')) URL.revokeObjectURL(comparison.before);
      if (comparison?.after?.startsWith('blob:')) URL.revokeObjectURL(comparison.after);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (character) {
      setFormData({ ...character });
    }
  }, [character]);

  // Bornes de niveau propres au système (WA : 1–8).
  const minLevel = systemDef.minLevel ?? 1;
  const maxLevel = systemDef.maxLevel ?? 20;

  // Worlds Awakening : les valeurs dérivées sont entièrement formulaires
  // (PV, Def PHY, Def MAG, PM). On les recalcule à la source dès qu'une
  // donnée d'entrée change, ce qui corrige les PV « bloqués ».
  const isWA = (formData.system as string) === "Worlds Awakening";
  useEffect(() => {
    if (!isWA) return;
    setFormData((prev) => {
      const level = Math.min(WA_MAX_LEVEL, Math.max(1, prev.level || 1));
      const con = prev.constitution ?? 0;
      const sag = prev.wisdom ?? 0;
      const magStat = waMagicStat(prev.class);
      const magValue = magStat === "SAG" ? sag : (prev.intelligence ?? 0);
      const maxHp = waMaxHp(prev.class, level, con);
      const defPhy = waDefPhy(con, level);
      const defMag = waDefMag(sag, level);
      const pmMax = waMaxPm(magValue, level);
      const prevHp = prev.hp ?? maxHp;
      const next = {
        ...prev,
        level,
        max_hp: maxHp,
        hp: Math.min(prevHp, maxHp),
        armor_class: defPhy,
        initiative: defMag,
        system_data: { ...(prev.system_data ?? {}), pm_max: pmMax, magic_stat: magStat },
      };
      const unchanged =
        prev.level === next.level &&
        prev.max_hp === next.max_hp &&
        prev.hp === next.hp &&
        prev.armor_class === next.armor_class &&
        prev.initiative === next.initiative &&
        (prev.system_data?.pm_max ?? null) === pmMax;
      return unchanged ? prev : next;
    });
  }, [
    isWA,
    formData.class,
    formData.level,
    formData.constitution,
    formData.wisdom,
    formData.intelligence,
  ]);

  // ── Caractéristiques & défenses pilotées par le système ────────────────────
  // Les valeurs sont écrites dans system_data.stats (lu par toutes les fiches)
  // ET dans les colonnes historiques quand une correspondance existe.
  const setStat = (stat: StatDef, raw: number) => {
    setFormData((prev) => ({ ...prev, ...writeStatPatch(prev, stat, raw) }));
  };

  const getDefense = (key: string, fallback: number) => readDefense(formData, key, fallback);

  const setDefense = (key: string, value: number) => {
    setFormData((prev) => {
      const sysData = (prev.system_data as Record<string, any>) ?? {};
      const next: Partial<Character> = {
        ...prev,
        system_data: { ...sysData, defenses: { ...(sysData.defenses ?? {}), [key]: value } },
      };
      // Miroir historique : CA / Déf. PHY -> armor_class, Déf. MAG -> initiative.
      if (key === "ac" || key === "phy_def") next.armor_class = value;
      if (key === "mag_def") next.initiative = value;
      return next;
    });
  };

  // PV conseillés par les calculs du système (hors WA, géré à part).
  const suggestedMaxHp = (() => {
    const calc = getCalculations(formData.system as string);
    const stats = readStats(formData, systemDef);
    const mods: Record<string, number> = {};
    for (const s of systemDef.stats) mods[s.key] = calc.statModifier(s, stats[s.key]);
    return Math.max(
      1,
      calc.maxHp({
        level: formData.level ?? 1,
        stats: mods,
        subclass: formData.subclass,
        systemData: (formData.system_data as Record<string, unknown>) ?? {},
      }),
    );
  })();

  const statModeLabel = (() => {
    const modes = new Set(systemDef.stats.map((s) => s.mode));
    if (modes.size !== 1) return "valeurs mixtes";
    const m = systemDef.stats[0].mode;
    return m === "score" ? "scores" : m === "percentage" ? "pourcentages" : "modificateurs";
  })();


  const updateField = <K extends keyof Character>(field: K, value: Character[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const handleSubmit = () => {
    onSave(formData);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 5 Mo");
      return;
    }
    setPendingAvatarFile(file);
    setCropOpen(true);
    if (event.target) event.target.value = '';
  };

  const cancelCrop = () => {
    setCropOpen(false);
    setPendingAvatarFile(null);
  };

  const confirmCrop = async (blob: Blob) => {
    const previousUrl: string | null = formData.avatar_url ?? null;
    const previousPath = (() => {
      if (!previousUrl) return null;
      const marker = '/storage/v1/object/public/character-avatars/';
      const idx = previousUrl.indexOf(marker);
      return idx === -1 ? null : previousUrl.substring(idx + marker.length).split('?')[0];
    })();

    setIsUploadingAvatar(true);
    let newPath: string | null = null;
    try {
      const folder = user?.id ?? 'anon';
      newPath = `${folder}/character-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from('character-avatars')
        .upload(newPath, blob, { upsert: true, contentType: 'image/png', cacheControl: '3600' });
      if (upErr) {
        const lower = upErr.message?.toLowerCase() ?? '';
        let friendly = "Impossible d'envoyer la nouvelle image. Avatar précédent conservé.";
        if (lower.includes('exceed') || lower.includes('payload') || lower.includes('too large')) {
          friendly = 'Image trop volumineuse pour le serveur. Avatar précédent conservé.';
        } else if (lower.includes('mime') || lower.includes('content-type')) {
          friendly = 'Format non accepté par le serveur. Avatar précédent conservé.';
        } else if (lower.includes('permission') || lower.includes('unauthorized') || lower.includes('not authorized')) {
          friendly = "Vous n'avez pas l'autorisation d'envoyer cet avatar. Avatar précédent conservé.";
        } else if (lower.includes('network') || lower.includes('failed to fetch')) {
          friendly = "Problème réseau pendant l'envoi. Avatar précédent conservé.";
        }
        throw new Error(friendly);
      }

      const { data: pub } = supabase.storage.from('character-avatars').getPublicUrl(newPath);
      updateField('avatar_url', pub.publicUrl);

      let beforeSnapshot: string | null = null;
      if (previousUrl) {
        try {
          const r = await fetch(previousUrl);
          if (r.ok) beforeSnapshot = URL.createObjectURL(await r.blob());
        } catch {
          beforeSnapshot = previousUrl;
        }
      }
      const afterSnapshot = URL.createObjectURL(blob);
      setComparison((prev) => {
        if (prev?.before?.startsWith('blob:')) URL.revokeObjectURL(prev.before);
        if (prev?.after?.startsWith('blob:')) URL.revokeObjectURL(prev.after);
        return { before: beforeSnapshot, after: afterSnapshot };
      });

      if (previousPath && previousPath !== newPath) {
        await supabase.storage.from('character-avatars').remove([previousPath]).catch(() => null);
      }
      cancelCrop();
    } catch (err) {
      const msg = err instanceof Error && err.message
        ? err.message
        : "Échec du téléchargement. Avatar précédent conservé.";
      toast.error(msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const dismissComparison = () => {
    setComparison((prev) => {
      if (prev?.before?.startsWith('blob:')) URL.revokeObjectURL(prev.before);
      if (prev?.after?.startsWith('blob:')) URL.revokeObjectURL(prev.after);
      return null;
    });
  };

  const removeAvatar = async () => {
    const url: string | null = formData.avatar_url ?? null;
    if (url) {
      const marker = '/storage/v1/object/public/character-avatars/';
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        const path = url.substring(idx + marker.length).split('?')[0];
        await supabase.storage.from('character-avatars').remove([path]).catch(() => null);
      }
    }
    updateField("avatar_url", null);
    dismissComparison();
  };

  return (
    <div className="flex h-full flex-col bg-gradient-dark">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="font-display text-xl font-bold text-foreground truncate">
            {character ? "Modifier le Personnage" : "Créer un Personnage"}
          </h2>
          {/* Badge système : visuel de l'identité de jeu (Aetheria, D&D, …). */}
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <span>{systemDef.emoji}</span>
            <span>{systemDef.shortLabel}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button variant="gold" size="sm" onClick={handleSubmit}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Base</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Dices className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              <span className="hidden sm:inline">Équip.</span>
            </TabsTrigger>
            <TabsTrigger value="lore" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Lore</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover border-4 border-primary/30"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted border-4 border-border">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Avatar du Personnage</Label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {formData.avatar_url ? "Changer" : "Ajouter"}
                  </Button>
                  {formData.avatar_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeAvatar}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. Max 5MB.</p>
              </div>
            </div>

            {comparison && (
              <div className="rounded-lg border border-primary/30 bg-secondary/40 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Avant / Après</p>
                  <Button type="button" variant="ghost" size="sm" onClick={dismissComparison} className="h-7 px-2">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    {comparison.before ? (
                      <img src={comparison.before} alt="avant" className="h-20 w-20 rounded-full object-cover border-2 border-border opacity-80" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border-2 border-border">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Avant</span>
                  </div>
                  <div className="text-2xl text-primary">→</div>
                  <div className="flex flex-col items-center gap-2">
                    <img src={comparison.after} alt="après" className="h-20 w-20 rounded-full object-cover border-2 border-primary shadow-[0_0_18px_hsl(var(--primary)/0.4)]" />
                    <span className="text-xs uppercase tracking-wide text-primary">Après</span>
                  </div>
                </div>
              </div>
            )}

            <AvatarCropDialog
              file={pendingAvatarFile}
              open={cropOpen}
              onCancel={cancelCrop}
              onConfirm={confirmCrop}
              isUploading={isUploadingAvatar}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du Personnage</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Entrez le nom..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Niveau</Label>
                <Input
                  id="level"
                  type="number"
                  min={minLevel}
                  max={maxLevel}
                  value={formData.level || 1}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || minLevel;
                    updateField("level", Math.min(maxLevel, Math.max(minLevel, v)));
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  Niveaux {minLevel}–{maxLevel} ({systemDef.shortLabel})
                </p>
              </div>


              {/* Sélecteur de système — affiché uniquement à la création (pas lors de l'édition). */}
              {!character?.id && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Système de jeu</Label>
                  <Select
                    value={(formData.system as string) || initialSystem}
                    onValueChange={(v) => {
                      const cfg = getSystemConfig(v);
                      // On réinitialise race/classe/sous-classe aux premières valeurs du nouveau système.
                      setFormData((prev) => ({
                        ...prev,
                        system: v,
                        race: cfg.races[0] || "",
                        class: cfg.classes[0] || "",
                        subclass: "",
                      }));
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SYSTEM_LIST.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.emoji} {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">{systemDef.description}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>{systemConfig.raceLabel}</Label>
                {systemConfig.races.length > 0 ? (
                  <Select
                    value={formData.race || systemConfig.races[0]}
                    onValueChange={(v) => updateField("race", v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {systemConfig.races.map((race) => (
                        <SelectItem key={race} value={race}>{race}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.race || ""}
                    onChange={(e) => updateField("race", e.target.value)}
                    placeholder={`Saisir une ${systemConfig.raceLabel.toLowerCase()}...`}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>{systemConfig.classLabel}</Label>
                {systemConfig.classes.length > 0 ? (
                  <Select
                    value={formData.class || systemConfig.classes[0]}
                    onValueChange={(v) => {
                      updateField("class", v);
                      updateField("subclass", "");
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {systemConfig.classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.class || ""}
                    onChange={(e) => updateField("class", e.target.value)}
                    placeholder={`Saisir une ${systemConfig.classLabel.toLowerCase()}...`}
                  />
                )}
              </div>

              {/* Sous-classe / Tenue — uniquement si le système en a. */}
              {(() => {
                const subs = systemConfig.subclassesByClass?.[formData.class || ""] || [];
                if (!systemConfig.hasTenues && subs.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <Label>{systemConfig.subclassLabel}</Label>
                    {subs.length > 0 ? (
                      <Select
                        value={formData.subclass || ""}
                        onValueChange={(v) => updateField("subclass", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Choisir une ${systemConfig.subclassLabel.toLowerCase()}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {subs.map((sub) => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.subclass || ""}
                        onChange={(e) => updateField("subclass", e.target.value)}
                        placeholder={`${systemConfig.subclassLabel}...`}
                      />
                    )}
                  </div>
                );
              })()}

              <div className="space-y-2">
                <Label htmlFor="campaign">Campagne</Label>
                <Input
                  id="campaign"
                  value={formData.campaign || ""}
                  onChange={(e) => updateField("campaign", e.target.value)}
                  placeholder="Nom de la campagne..."
                />
              </div>
            </div>
          </TabsContent>

          {/* Stats — pilotées par la définition du système actif */}
          <TabsContent value="stats" className="space-y-6">
            <div className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Caractéristiques — {systemDef.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isWA ? (
                    <>
                      Les bonus proviennent de l'ascendance ({formData.race}) et de la classe ({formData.class}).
                      {WA_ASCENDANCE_META[formData.race || ""]?.freePoints > 0 && (
                        <> Vous avez <span className="font-bold text-primary">{WA_ASCENDANCE_META[formData.race || ""]?.freePoints ?? 0}</span> point(s) libre(s) à répartir.</>
                      )}
                    </>
                  ) : (
                    <>
                      Valeurs bornées par les règles de {systemDef.shortLabel} ({statModeLabel}).
                      Jet par défaut : {systemDef.defaultRollHint}.
                    </>
                  )}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {systemDef.stats.map((stat) => {
                  const ascBonus = isWA ? (WA_ASCENDANCE_BONUSES[formData.race || ""]?.[stat.key] ?? 0) : 0;
                  const classBonus = isWA ? (WA_CLASS_BONUSES[formData.class || ""]?.[stat.key] ?? 0) : 0;
                  const totalBase = ascBonus + classBonus;
                  const currentVal = readStat(formData, stat);
                  const modifier = (systemDef.calculations ?? DEFAULT_CALCULATIONS).statModifier(stat, currentVal);

                  return (
                    <div key={stat.key} className="flex flex-col items-center rounded-lg border border-border bg-card p-3" title={stat.longLabel}>
                      <Label className="mb-1 text-center text-xs text-muted-foreground">
                        {stat.longLabel ?? stat.label}
                      </Label>
                      {isWA && (
                        <span className="text-[10px] text-muted-foreground">
                          Base: {totalBase >= 0 ? `+${totalBase}` : totalBase}
                        </span>
                      )}
                      <Input
                        type="number"
                        min={stat.min}
                        max={stat.max}
                        className="my-1 h-10 w-16 text-center text-lg font-bold"
                        value={currentVal}
                        onChange={(e) => setStat(stat, parseInt(e.target.value))}
                      />
                      <span className="text-xs font-semibold text-primary">{stat.label}</span>
                      {stat.mode !== "modifier" && (
                        <span className="text-[10px] text-muted-foreground">
                          {stat.mode === "percentage"
                            ? `½ ${Math.floor(currentVal / 2)} • ⅕ ${Math.floor(currentVal / 5)}`
                            : `mod. ${modifier >= 0 ? `+${modifier}` : modifier}`}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {stat.min} → {stat.max}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Combat stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <Label className="text-red-400">Points de Vie</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      className="h-10 w-20 text-center"
                      value={formData.hp ?? 10}
                      onChange={(e) => updateField("hp", parseInt(e.target.value) || 0)}
                    />
                    <span className="text-muted-foreground">/</span>
                    <Input
                      type="number"
                      className="h-10 w-20 text-center"
                      value={formData.max_hp ?? 10}
                      onChange={(e) => updateField("max_hp", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  {isWA ? (
                    WA_CLASS_META[formData.class || ""] && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Dé de vie : {WA_CLASS_META[formData.class || ""]?.hitDie} — PV recalculés
                        automatiquement (max du DV au niv. 1, puis meilleur jet par niveau selon la CON).
                        PM max : {(formData.system_data?.pm_max ?? 0) as number}.
                      </p>
                    )
                  ) : (
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>PV conseillés ({systemDef.shortLabel}) : {suggestedMaxHp}</span>
                      <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]"
                        onClick={() => setFormData((p) => ({ ...p, max_hp: suggestedMaxHp, hp: suggestedMaxHp }))}>
                        Appliquer
                      </Button>
                    </p>
                  )}
                </div>

                {systemDef.defenses.map((def) => (
                  <div key={def.key} className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                    <Label className="text-blue-400">{def.label}</Label>
                    <Input
                      type="number"
                      className="mt-2 h-10 w-20 text-center"
                      value={getDefense(def.key, def.default)}
                      onChange={(e) => setDefense(def.key, parseInt(e.target.value) || 0)}
                    />
                    {def.hint && <p className="mt-1 text-[10px] text-muted-foreground">{def.hint}</p>}
                  </div>
                ))}

                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <Label className="text-primary">{systemDef.currency} (Monnaie)</Label>
                  <Input
                    type="number"
                    className="mt-2 h-10 w-24 text-center"
                    value={formData.gold || 0}
                    onChange={(e) => updateField("gold", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>


          {/* Equipment — WA manual with reference tables */}
          <TabsContent value="equipment" className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                Notez vos armes, armures et équipements manuellement avec leurs bonus. Référez-vous aux tableaux ci-dessous.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sword className="h-4 w-4 text-red-400" />
                  Arme (Main Principale)
                </Label>
                <Input
                  value={formData.hit_dice || ""}
                  onChange={(e) => updateField("hit_dice", e.target.value)}
                  placeholder="Ex: Epée Longue (1d8, FOR+0)"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  Équipement (Main Secondaire)
                </Label>
                <Input
                  value={formData.spellcasting_ability || ""}
                  onChange={(e) => updateField("spellcasting_ability", e.target.value)}
                  placeholder="Ex: Bouclier (+1 Def PHY)"
                />
              </div>
            </div>

            {/* Reference: Armes de Contact */}
            <details className="rounded-lg border border-border">
              <summary className="cursor-pointer p-3 text-sm font-semibold text-foreground hover:bg-muted/50">
                📋 Référence : Armes de Contact
              </summary>
              <div className="overflow-x-auto p-3">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border text-muted-foreground">
                    <th className="p-1 text-left">Nom</th><th className="p-1">Utilisation</th><th className="p-1">Dégât</th><th className="p-1">Test</th><th className="p-1">Prix</th>
                  </tr></thead>
                  <tbody>
                    {WA_WEAPONS_CONTACT.map((w) => (
                      <tr key={w.name} className="border-b border-border/50">
                        <td className="p-1 font-medium text-foreground">{w.name}</td>
                        <td className="p-1 text-center text-muted-foreground">{w.use}</td>
                        <td className="p-1 text-center text-primary">{w.damage}</td>
                        <td className="p-1 text-center text-muted-foreground">{w.test}</td>
                        <td className="p-1 text-center text-muted-foreground">{w.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            {/* Reference: Armes à Distance */}
            <details className="rounded-lg border border-border">
              <summary className="cursor-pointer p-3 text-sm font-semibold text-foreground hover:bg-muted/50">
                📋 Référence : Armes à Distance
              </summary>
              <div className="overflow-x-auto p-3">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border text-muted-foreground">
                    <th className="p-1 text-left">Nom</th><th className="p-1">Portée</th><th className="p-1">Dégât</th><th className="p-1">Test</th><th className="p-1">Prix</th>
                  </tr></thead>
                  <tbody>
                    {WA_WEAPONS_RANGED.map((w) => (
                      <tr key={w.name} className="border-b border-border/50">
                        <td className="p-1 font-medium text-foreground">{w.name}</td>
                        <td className="p-1 text-center text-muted-foreground">{w.range}</td>
                        <td className="p-1 text-center text-primary">{w.damage}</td>
                        <td className="p-1 text-center text-muted-foreground">{w.test}</td>
                        <td className="p-1 text-center text-muted-foreground">{w.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            {/* Reference: Armes Magiques */}
            <details className="rounded-lg border border-border">
              <summary className="cursor-pointer p-3 text-sm font-semibold text-foreground hover:bg-muted/50">
                📋 Référence : Armes Magiques
              </summary>
              <div className="overflow-x-auto p-3">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border text-muted-foreground">
                    <th className="p-1 text-left">Nom</th><th className="p-1">Type</th><th className="p-1">Portée</th><th className="p-1">Dégât</th><th className="p-1">Prix</th>
                  </tr></thead>
                  <tbody>
                    {WA_WEAPONS_MAGIC.map((w) => (
                      <tr key={w.name} className="border-b border-border/50">
                        <td className="p-1 font-medium text-foreground">{w.name}</td>
                        <td className="p-1 text-center text-muted-foreground">{w.type}</td>
                        <td className="p-1 text-center text-muted-foreground">{w.range}</td>
                        <td className="p-1 text-center text-primary">{w.damage}</td>
                        <td className="p-1 text-center text-muted-foreground">{w.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            {/* Reference: Équipements */}
            <details className="rounded-lg border border-border">
              <summary className="cursor-pointer p-3 text-sm font-semibold text-foreground hover:bg-muted/50">
                📋 Référence : Équipements
              </summary>
              <div className="overflow-x-auto p-3">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border text-muted-foreground">
                    <th className="p-1 text-left">Nom</th><th className="p-1">Bonus</th><th className="p-1">Utilisation</th><th className="p-1">Prix</th>
                  </tr></thead>
                  <tbody>
                    {WA_EQUIPMENTS.map((e) => (
                      <tr key={e.name} className="border-b border-border/50">
                        <td className="p-1 font-medium text-foreground">{e.name}</td>
                        <td className="p-1 text-center text-primary">{e.bonus}</td>
                        <td className="p-1 text-center text-muted-foreground">{e.use}</td>
                        <td className="p-1 text-center text-muted-foreground">{e.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            <div className="space-y-2">
              <Label>Inventaire & Notes d'équipement</Label>
              <Textarea
                value={formData.inventory || ""}
                onChange={(e) => updateField("inventory", e.target.value)}
                placeholder="Listez vos objets, équipements, bonus d'amélioration..."
                rows={6}
              />
            </div>
          </TabsContent>

          {/* Lore */}
          <TabsContent value="lore" className="space-y-6">
            <div className="space-y-2">
              <Label>Apparence</Label>
              <Textarea
                value={formData.appearance || ""}
                onChange={(e) => updateField("appearance", e.target.value)}
                placeholder="Décrivez l'apparence de votre personnage..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Histoire / Backstory</Label>
              <Textarea
                value={formData.backstory || ""}
                onChange={(e) => updateField("backstory", e.target.value)}
                placeholder="Racontez l'histoire de votre personnage, ses origines, ses motivations..."
                rows={6}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Traits de Personnalité</Label>
                <Textarea
                  value={formData.personality_traits || ""}
                  onChange={(e) => updateField("personality_traits", e.target.value)}
                  placeholder="Comment se comporte votre personnage..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Idéaux</Label>
                <Textarea
                  value={formData.ideals || ""}
                  onChange={(e) => updateField("ideals", e.target.value)}
                  placeholder="Ce en quoi votre personnage croit..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Liens</Label>
                <Textarea
                  value={formData.bonds || ""}
                  onChange={(e) => updateField("bonds", e.target.value)}
                  placeholder="Les personnes ou lieux importants..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Défauts</Label>
                <Textarea
                  value={formData.flaws || ""}
                  onChange={(e) => updateField("flaws", e.target.value)}
                  placeholder="Les faiblesses de votre personnage..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </ScrollArea>
    </div>
  );
};

export default CharacterForm;

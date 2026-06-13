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
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          {character ? "Modifier le Personnage" : "Créer un Personnage"}
        </h2>
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
                  min={1}
                  max={20}
                  value={formData.level || 1}
                  onChange={(e) => updateField("level", parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Ascendance</Label>
                <Select
                  value={formData.race || systemConfig.races[0]}
                  onValueChange={(v) => updateField("race", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConfig.races.map((race) => (
                      <SelectItem key={race} value={race}>
                        {race}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Classe</Label>
                <Select
                  value={formData.class || systemConfig.classes[0]}
                  onValueChange={(v) => {
                    updateField("class", v);
                    updateField("subclass", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConfig.classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tenue</Label>
                <Select
                  value={formData.subclass || ""}
                  onValueChange={(v) => updateField("subclass", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une tenue..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(WA_TENUES[formData.class || ""] || []).map((tenue) => (
                      <SelectItem key={tenue} value={tenue}>
                        {tenue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

          {/* Stats — WA modifier-based */}
          <TabsContent value="stats" className="space-y-6">
            <div className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Bonus de caractéristiques</h3>
                <p className="text-xs text-muted-foreground">
                  Les bonus proviennent de l'ascendance ({formData.race}) et de la classe ({formData.class}).
                  {WA_ASCENDANCE_META[formData.race || ""]?.freePoints > 0 && (
                    <> Vous avez <span className="font-bold text-primary">{WA_ASCENDANCE_META[formData.race || ""]?.freePoints ?? 0}</span> point(s) libre(s) à répartir.</>
                  )}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {WA_STATS.map((stat) => {
                  const ascBonus = WA_ASCENDANCE_BONUSES[formData.race || ""]?.[stat as string] ?? 0;
                  const classBonus = WA_CLASS_BONUSES[formData.class || ""]?.[stat as string] ?? 0;
                  const totalBase = ascBonus + classBonus;
                  const fieldMap: Record<string, keyof Character> = {
                    FOR: "strength", DEX: "dexterity", CON: "constitution",
                    INT: "intelligence", SAG: "wisdom", CHA: "charisma"
                  };
                  const labelMap: Record<string, string> = {
                    FOR: "Force", DEX: "Dextérité", CON: "Constitution",
                    INT: "Intelligence", SAG: "Sagesse", CHA: "Charisme"
                  };
                  const field = fieldMap[stat as string] as keyof Character;
                  const currentVal = ((formData as Record<string, unknown>)[field as string] as number) ?? 0;

                  return (
                    <div key={stat} className="flex flex-col items-center rounded-lg border border-border bg-card p-3">
                      <Label className="mb-1 text-xs text-muted-foreground">{labelMap[stat as string]}</Label>
                      <span className="text-[10px] text-muted-foreground">
                        Base: {totalBase >= 0 ? `+${totalBase}` : totalBase}
                      </span>
                      <Input
                        type="number"
                        className="my-1 h-10 w-14 text-center text-lg font-bold"
                        value={currentVal}
                        onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
                      />
                      <span className="text-xs font-semibold text-primary">
                        {stat}
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
                      value={formData.hp || 10}
                      onChange={(e) => updateField("hp", parseInt(e.target.value) || 10)}
                    />
                    <span className="text-muted-foreground">/</span>
                    <Input
                      type="number"
                      className="h-10 w-20 text-center"
                      value={formData.max_hp || 10}
                      onChange={(e) => updateField("max_hp", parseInt(e.target.value) || 10)}
                    />
                  </div>
                  {WA_CLASS_META[formData.class || ""] && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Dé de vie : {WA_CLASS_META[formData.class || ""]?.hitDie}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                  <Label className="text-blue-400">Def PHY</Label>
                  <Input
                    type="number"
                    className="mt-2 h-10 w-20 text-center"
                    value={formData.armor_class || 10}
                    onChange={(e) => updateField("armor_class", parseInt(e.target.value) || 10)}
                  />
                </div>

                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                  <Label className="text-purple-400">Def MAG</Label>
                  <Input
                    type="number"
                    className="mt-2 h-10 w-20 text-center"
                    value={formData.initiative || 10}
                    onChange={(e) => updateField("initiative", parseInt(e.target.value) || 10)}
                  />
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <Label className="text-primary">NX (Monnaie)</Label>
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

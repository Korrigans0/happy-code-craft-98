import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Eye, Pencil, Copy, EyeOff, UserPlus, UserMinus, Trash2, Store, Users2, Sparkles, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { pregensApi, type PregenEntry } from "@/lib/pregens";

interface PregenSectionProps {
  campaignId: string;
  campaignSystem: string;
  isGM: boolean;
  members: any[];
}

const describe = (c: Record<string, any>) =>
  [c.class, c.race, c.level ? `Niveau ${c.level}` : null].filter(Boolean).join(" — ");

const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const STAT_LABELS: [string, string][] = [
  ["strength", "FOR"], ["dexterity", "DEX"], ["constitution", "CON"],
  ["intelligence", "INT"], ["wisdom", "SAG"], ["charisma", "CHA"],
];

const PregenPreview = ({ entry, onClose, footer }: { entry: PregenEntry | null; onClose: () => void; footer?: React.ReactNode }) => {
  const c = entry?.character;
  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {c && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16 border border-primary/40">
                  <AvatarImage src={c.avatar_url ?? undefined} alt={c.name} />
                  <AvatarFallback>{initials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <DialogTitle className="font-display">{c.name}</DialogTitle>
                  <DialogDescription>
                    {describe(c)}{c.subclass ? ` · ${c.subclass}` : ""}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {STAT_LABELS.map(([k, l]) => (
                <div key={k} className="rounded-md border border-border bg-muted/40 p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                  <div className="font-display text-lg text-foreground">{c[k] ?? "—"}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">PV {c.hp ?? "—"}/{c.max_hp ?? "—"}</Badge>
              <Badge variant="outline">Défense {c.armor_class ?? "—"}</Badge>
              {c.background && <Badge variant="outline">{c.background}</Badge>}
            </div>
            {(c.appearance || c.backstory) && (
              <div className="space-y-2 text-sm text-muted-foreground">
                {c.appearance && <p>{c.appearance}</p>}
                {c.backstory && <p className="whitespace-pre-line">{c.backstory}</p>}
              </div>
            )}
            {footer && <DialogFooter className="gap-2">{footer}</DialogFooter>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PregenSection = ({ campaignId, campaignSystem, isGM, members }: PregenSectionProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<PregenEntry | null>(null);
  const [toClaim, setToClaim] = useState<PregenEntry | null>(null);
  const [toDelete, setToDelete] = useState<PregenEntry | null>(null);
  const [toAssign, setToAssign] = useState<PregenEntry | null>(null);
  const [assignUser, setAssignUser] = useState("");
  const [toPublish, setToPublish] = useState<PregenEntry | null>(null);
  const [pubTitle, setPubTitle] = useState("");
  const [pubDesc, setPubDesc] = useState("");

  const queryKey = ["pregens", campaignId];
  const { data: pregens = [] } = useQuery({ queryKey, queryFn: () => pregensApi.list(campaignId) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["campaignMembers", campaignId] });
    queryClient.invalidateQueries({ queryKey: ["campaignCharacters", campaignId] });
    queryClient.invalidateQueries({ queryKey: ["myCharacters"] });
  };
  const onError = (e: any) => toast({ title: "Action impossible", description: e?.message, variant: "destructive" });

  const run = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: refresh,
    onError,
  });

  const players = useMemo(() => members.filter((m: any) => m.role === "player"), [members]);
  const iHaveOne = pregens.some((p) => p.assigned.some((a) => a.is_me));

  const isTaken = (p: PregenEntry) => !p.character.pregen_allow_multiple && p.assigned.length > 0;

  if (!isGM && pregens.length === 0) return null;

  const createUrl = `/characters?pregen=${campaignId}&system=${encodeURIComponent(campaignSystem)}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          {isGM ? "Personnages pré-tirés" : "Personnages pré-tirés disponibles"}
        </h3>
        {isGM && (
          <Button size="sm" variant="gold" onClick={() => navigate(createUrl)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Créer un personnage pré-tiré
          </Button>
        )}
      </div>

      {pregens.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun pré-tiré pour l'instant. Créez-en un ou ajoutez-en un depuis votre bibliothèque.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pregens.map((p) => {
            const c = p.character;
            const taken = isTaken(p);
            const mine = p.assigned.some((a) => a.is_me);
            return (
              <Card key={c.id} className="border-border bg-card/80 transition-colors hover:border-primary/40">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-primary/30">
                      <AvatarImage src={c.avatar_url ?? undefined} alt={c.name} />
                      <AvatarFallback>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold text-foreground">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{describe(c)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {isGM && (
                      <Badge variant={c.pregen_available ? "default" : "outline"}>
                        {c.pregen_available ? "Disponible" : "Non disponible"}
                      </Badge>
                    )}
                    {c.pregen_allow_multiple && <Badge variant="outline"><Users2 className="mr-1 h-3 w-3" />Usage multiple</Badge>}
                    {mine && <Badge className="bg-primary/20 text-primary"><Check className="mr-1 h-3 w-3" />Votre choix</Badge>}
                    {!isGM && taken && !mine && <Badge variant="secondary">Déjà attribué</Badge>}
                  </div>

                  {isGM && p.assigned.length > 0 && (
                    <div className="space-y-1 text-xs">
                      {p.assigned.map((a) => (
                        <div key={a.user_id} className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Attribué à : <span className="text-foreground">{a.display_name}</span></span>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => run.mutate(() => pregensApi.unassign(c.id, a.user_id))}>
                            <UserMinus className="mr-1 h-3 w-3" /> Retirer l'attribution
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {isGM ? (
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setPreview(p)}><Eye className="mr-1 h-3.5 w-3.5" />Voir</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`${createUrl}&edit=${c.id}`)}><Pencil className="mr-1 h-3.5 w-3.5" />Modifier</Button>
                      <Button size="sm" variant="outline" onClick={() => run.mutate(() => pregensApi.duplicate(c.id))}><Copy className="mr-1 h-3.5 w-3.5" />Dupliquer</Button>
                      <Button size="sm" variant="outline"
                        onClick={() => run.mutate(() => pregensApi.update(c.id, { pregen_available: !c.pregen_available }))}>
                        {c.pregen_available ? <><EyeOff className="mr-1 h-3.5 w-3.5" />Masquer</> : <><Eye className="mr-1 h-3.5 w-3.5" />Rendre disponible</>}
                      </Button>
                      <Button size="sm" variant="outline" disabled={taken} onClick={() => { setAssignUser(""); setToAssign(p); }}>
                        <UserPlus className="mr-1 h-3.5 w-3.5" />Attribuer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setPubTitle(c.name); setPubDesc(""); setToPublish(p); }}>
                        <Store className="mr-1 h-3.5 w-3.5" />Publier dans la Boutique
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(p)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" />Supprimer
                      </Button>
                      <label className="flex w-full items-center gap-2 pt-1 text-xs text-muted-foreground">
                        <Switch checked={!!c.pregen_allow_multiple}
                          onCheckedChange={(v) => run.mutate(() => pregensApi.update(c.id, { pregen_allow_multiple: v }))} />
                        Autoriser plusieurs joueurs à le choisir
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setPreview(p)}><Eye className="mr-1 h-3.5 w-3.5" />Voir</Button>
                      <Button size="sm" variant="gold" disabled={taken || iHaveOne} onClick={() => setToClaim(p)}>
                        Choisir ce personnage
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PregenPreview entry={preview} onClose={() => setPreview(null)}
        footer={!isGM && preview && !isTaken(preview) && !iHaveOne ? (
          <Button variant="gold" onClick={() => { setToClaim(preview); setPreview(null); }}>Choisir ce personnage</Button>
        ) : undefined} />

      <AlertDialog open={!!toClaim} onOpenChange={(o) => !o && setToClaim(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Choisir ce personnage</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous choisir « {toClaim?.character.name} »
              {toClaim?.character.class ? `, ${toClaim.character.class}` : ""}
              {toClaim?.character.level ? ` niveau ${toClaim.character.level}` : ""}, pour cette campagne ?
              Vous recevrez votre propre copie de la fiche.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const id = toClaim!.character.id;
              setToClaim(null);
              run.mutate(() => pregensApi.claim(id), {
                onSuccess: () => toast({ title: "Personnage choisi ✓", description: "Il apparaît maintenant dans vos personnages." }),
              });
            }}>Choisir ce personnage</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce pré-tiré ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le modèle « {toDelete?.character.name} » sera supprimé. Les fiches déjà choisies par vos joueurs sont conservées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => {
              const id = toDelete!.character.id; setToDelete(null);
              run.mutate(() => pregensApi.remove(id));
            }}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!toAssign} onOpenChange={(o) => !o && setToAssign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer « {toAssign?.character.name} »</DialogTitle>
            <DialogDescription>Le joueur reçoit sa propre copie de la fiche ; votre modèle reste intact.</DialogDescription>
          </DialogHeader>
          <Select value={assignUser} onValueChange={setAssignUser}>
            <SelectTrigger><SelectValue placeholder="Choisir un joueur" /></SelectTrigger>
            <SelectContent>
              {players.map((m: any) => (
                <SelectItem key={m.user_id} value={m.user_id}>{m.display_name || "Joueur"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToAssign(null)}>Annuler</Button>
            <Button disabled={!assignUser || run.isPending} onClick={() => {
              const id = toAssign!.character.id; setToAssign(null);
              run.mutate(() => pregensApi.assign(id, assignUser));
            }}>Attribuer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toPublish} onOpenChange={(o) => !o && setToPublish(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publier dans la Boutique</DialogTitle>
            <DialogDescription>
              Une copie de la fiche actuelle est publiée. Votre pré-tiré reste privé dans cette campagne ;
              vous pourrez masquer ou supprimer la publication depuis la Boutique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Titre</Label><Input value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={pubDesc} onChange={(e) => setPubDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToPublish(null)}>Garder privé</Button>
            <Button disabled={!pubTitle.trim()} onClick={() => {
              const id = toPublish!.character.id; setToPublish(null);
              run.mutate(() => pregensApi.publish(id, pubTitle, pubDesc), {
                onSuccess: () => toast({ title: "Publié dans la Boutique ✓" }),
              });
            }}><Store className="mr-1.5 h-4 w-4" />Publier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PregenSection;

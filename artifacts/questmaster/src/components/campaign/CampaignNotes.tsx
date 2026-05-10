import { useState } from "react";
import { useUser } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Plus, BookOpen, Edit, Trash2, Lock, Eye, Calendar } from "lucide-react";

interface CampaignNotesProps {
  campaignId: string;
  isGM: boolean;
}

const CampaignNotes = ({ campaignId, isGM }: CampaignNotesProps) => {
  const { user: clerkUser } = useUser();
  const userId = clerkUser?.id ?? "";
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "", is_gm_only: false });

  // Fetch notes
  const { data: notes = [] } = useQuery({
    queryKey: ["campaignNotes", campaignId],
    queryFn: () => campaignsApi.getNotes(campaignId),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newNote) => {
      return campaignsApi.createNote(campaignId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignNotes", campaignId] });
      setIsCreateOpen(false);
      setNewNote({ title: "", content: "", is_gm_only: false });
      toast({ title: "Note créée" });
    },
  });

  // Update note
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string; is_gm_only: boolean }) => {
      return campaignsApi.updateNote(campaignId, data.id, {
        title: data.title,
        content: data.content,
        is_gm_only: data.is_gm_only,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignNotes", campaignId] });
      setEditingNote(null);
      toast({ title: "Note mise à jour" });
    },
  });

  // Delete note
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return campaignsApi.deleteNote(campaignId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignNotes", campaignId] });
      toast({ title: "Note supprimée" });
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Journal de Campagne</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote(n => ({ ...n, title: e.target.value }))}
                  placeholder="Titre de la note"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(n => ({ ...n, content: e.target.value }))}
                  placeholder="Contenu de la note..."
                  rows={6}
                />
              </div>
              {isGM && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="gm-only" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Visible uniquement par le MJ
                  </Label>
                  <Switch
                    id="gm-only"
                    checked={newNote.is_gm_only}
                    onCheckedChange={(c) => setNewNote(n => ({ ...n, is_gm_only: c }))}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
              <Button onClick={() => createMutation.mutate(newNote)}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notes List */}
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-4 pr-4">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium text-foreground">Aucune note</h4>
              <p className="text-sm text-muted-foreground">Créez votre première note pour garder trace de vos aventures</p>
            </div>
          ) : (
            notes.map((note) => (
              <Card key={note.id} className="bg-gradient-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      {note.is_gm_only && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="mr-1 h-3 w-3" />
                          MJ
                        </Badge>
                      )}
                    </div>
                    {(note.user_id === userId || isGM) && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.content || "Pas de contenu"}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(note.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(o) => !o && setEditingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={editingNote.title}
                  onChange={(e) => setEditingNote((n: any) => ({ ...n, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea
                  value={editingNote.content || ""}
                  onChange={(e) => setEditingNote((n: any) => ({ ...n, content: e.target.value }))}
                  rows={6}
                />
              </div>
              {isGM && (
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Visible uniquement par le MJ
                  </Label>
                  <Switch
                    checked={editingNote.is_gm_only}
                    onCheckedChange={(c) => setEditingNote((n: any) => ({ ...n, is_gm_only: c }))}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)}>Annuler</Button>
            <Button onClick={() => updateMutation.mutate(editingNote)}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignNotes;

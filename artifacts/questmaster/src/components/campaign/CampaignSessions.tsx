import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar, CheckCircle, Clock, Edit, Trash2, Play, Bell, MailCheck } from "lucide-react";


interface CampaignSessionsProps {
  campaignId: string;
  isGM: boolean;
}

const CampaignSessions = ({ campaignId, isGM }: CampaignSessionsProps) => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    notes: "",
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["campaignSessions", campaignId],
    queryFn: () => campaignsApi.getSessions(campaignId),
  });

  // Delivery status of the automatic e-mails, per session.
  const { data: notifications = [] } = useQuery({
    queryKey: ["sessionNotifications", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_email_notifications")
        .select("session_id, kind, status")
        .eq("campaign_id", campaignId);
      if (error) return [];
      return data ?? [];
    },
  });

  const notifStats = useMemo(() => {
    const map = new Map<string, { sent: number; failed: number }>();
    for (const n of notifications as any[]) {
      const entry = map.get(n.session_id) ?? { sent: 0, failed: 0 };
      if (n.status === "failed") entry.failed++;
      else if (n.status === "sent") entry.sent++;
      map.set(n.session_id, entry);
    }
    return map;
  }, [notifications]);

  // Fire-and-forget: an e-mail failure must never break session management.
  const notifySession = useCallback(
    async (sessionId: string, kind: "created" | "rescheduled") => {
      try {
        const { error } = await supabase.functions.invoke("notify-session", {
          body: { sessionId, kind },
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["sessionNotifications", campaignId] });
        toast({
          title: kind === "rescheduled" ? "Participants prévenus du changement" : "Invitations envoyées",
          description: "Les joueurs ont reçu un e-mail avec la date et l'heure de la session.",
        });
      } catch (e) {
        console.error("notify-session failed", e);
        toast({
          title: "Notification e-mail indisponible",
          description: "La session est enregistrée, mais l'e-mail n'a pas pu être envoyé.",
          variant: "destructive",
        });
      }
    },
    [campaignId, queryClient],
  );

  const createMutation = useMutation({
    mutationFn: async (data: typeof newSession) => {
      const nextNumber = sessions.length > 0 ? Math.max(...(sessions as any[]).map((s: any) => s.session_number || 0)) + 1 : 1;
      return campaignsApi.createSession(campaignId, {
        ...data,
        scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null,
        session_number: nextNumber,
        title: data.title || `Session ${nextNumber}`,
      });
    },
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ["campaignSessions", campaignId] });
      setIsCreateOpen(false);
      setNewSession({ title: "", description: "", scheduled_at: "", notes: "" });
      toast({ title: "Session créée" });
      if (created?.id && created?.scheduled_at) void notifySession(created.id, "created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const previous = (sessions as any[]).find((s) => s.id === data.id);
      const nextIso = data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null;
      const prevTime = previous?.scheduled_at ? new Date(previous.scheduled_at).getTime() : null;
      const nextTime = nextIso ? new Date(nextIso).getTime() : null;
      // Only a real schedule change (> 5 min) warrants a new e-mail.
      const rescheduled =
        !!nextTime && (prevTime === null || Math.abs(nextTime - prevTime) > 5 * 60 * 1000);
      const updated = await campaignsApi.updateSession(campaignId, data.id, {
        title: data.title,
        description: data.description,
        notes: data.notes,
        scheduled_at: nextIso,
      });
      return { updated, rescheduled };
    },
    onSuccess: ({ rescheduled }: any) => {
      queryClient.invalidateQueries({ queryKey: ["campaignSessions", campaignId] });
      const id = editingSession?.id;
      setEditingSession(null);
      toast({ title: "Session mise à jour" });
      if (rescheduled && id) void notifySession(id, "rescheduled");
    },
  });


  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return campaignsApi.deleteSession(campaignId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignSessions", campaignId] });
      toast({ title: "Session supprimée" });
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return campaignsApi.markSessionComplete(campaignId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignSessions", campaignId] });
      toast({ title: "Session terminée !" });
    },
  });

  const { completedCount, upcomingCount } = useMemo(() => {
    let c = 0, u = 0;
    for (const s of sessions as any[]) {
      if (s.completed_at) c++; else u++;
    }
    return { completedCount: c, upcomingCount: u };
  }, [sessions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sessions de Jeu</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} terminées · {upcomingCount} à venir
          </p>
        </div>
        {isGM && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Planifier une session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={newSession.title}
                    onChange={(e) => setNewSession(s => ({ ...s, title: e.target.value }))}
                    placeholder="Session 1 - L'aventure commence"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession(s => ({ ...s, description: e.target.value }))}
                    placeholder="Résumé de ce qui est prévu..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date prévue</Label>
                  <Input
                    type="datetime-local"
                    value={newSession.scheduled_at}
                    onChange={(e) => setNewSession(s => ({ ...s, scheduled_at: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                <Button onClick={() => createMutation.mutate(newSession)}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-3 pr-4">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium text-foreground">Aucune session</h4>
              <p className="text-sm text-muted-foreground">Planifiez votre première session de jeu</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isCompleted = !!session.completed_at;
              const isUpcoming = session.scheduled_at && new Date(session.scheduled_at) > new Date() && !isCompleted;

              return (
                <Card key={session.id} className={`bg-gradient-card border-border ${isCompleted ? "opacity-70" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm ${
                          isCompleted 
                            ? "bg-green-500/20 text-green-400" 
                            : isUpcoming 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          #{session.session_number}
                        </div>
                        <div>
                          <CardTitle className="text-base">{session.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {isCompleted && (
                              <Badge className="bg-green-500/20 text-green-400 text-xs">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Terminée
                              </Badge>
                            )}
                            {isUpcoming && (
                              <Badge className="bg-primary/20 text-primary text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                À venir
                              </Badge>
                            )}
                            {session.scheduled_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(session.scheduled_at).toLocaleDateString("fr-FR", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isGM && (
                        <div className="flex items-center gap-1">
                          {!isCompleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-400 hover:text-green-300"
                              onClick={() => markCompleteMutation.mutate(session.id)}
                              title="Marquer comme terminée"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingSession(session)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                    )}
                    {session.notes && (
                      <div className="rounded-md bg-muted/50 p-3 mt-2">
                        <p className="text-xs font-medium text-foreground mb-1">Notes de session</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{session.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={(o) => !o && setEditingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la session</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={editingSession.title}
                  onChange={(e) => setEditingSession((s: any) => ({ ...s, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingSession.description || ""}
                  onChange={(e) => setEditingSession((s: any) => ({ ...s, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes de session</Label>
                <Textarea
                  value={editingSession.notes || ""}
                  onChange={(e) => setEditingSession((s: any) => ({ ...s, notes: e.target.value }))}
                  placeholder="Résumé de ce qui s'est passé..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Date prévue</Label>
                <Input
                  type="datetime-local"
                  value={editingSession.scheduled_at ? new Date(editingSession.scheduled_at).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditingSession((s: any) => ({ ...s, scheduled_at: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>Annuler</Button>
            <Button onClick={() => updateMutation.mutate(editingSession)}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignSessions;

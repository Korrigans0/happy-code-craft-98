import { useState, useMemo, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi, charactersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Crown, User, UserMinus, Sword, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { filterCompatibleCharacters } from "@/lib/system-compatibility";
import { getSystem } from "@/lib/systems";

interface CampaignMembersProps {
  campaignId: string;
  isGM: boolean;
}

const EMPTY_ARR: any[] = [];

interface MemberCardProps {
  member: any;
  isGM: boolean;
  isCurrentUser: boolean;
  userChars: any[];
  myPendingProposal: any;
  onAssignCharacter: (memberId: string, characterId: string | null) => void;
  onRemove: (id: string, name: string) => void;
  onPropose: () => void;
  onCancelProposal: (proposalId: string) => void;
  cancelPending: boolean;
}

const getMemberInitials = (member: any) => {
  if (member.display_name) {
    return member.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return "?";
};

const MemberCard = memo(function MemberCard({
  member,
  isGM,
  isCurrentUser,
  userChars,
  myPendingProposal,
  onAssignCharacter,
  onRemove,
  onPropose,
  onCancelProposal,
  cancelPending,
}: MemberCardProps) {
  const isMemberGM = member.role === "gm";
  return (
    <Card className="bg-gradient-card border-border">
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={member.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {getMemberInitials(member)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">
              {member.display_name || "Joueur"}
            </span>
            {isMemberGM && (
              <Badge variant="default" className="bg-primary/20 text-primary">
                <Crown className="mr-1 h-3 w-3" />
                MJ
              </Badge>
            )}
          </div>

          {!isMemberGM && (
            <div className="mt-2">
              {isGM ? (
                <Select
                  value={member.character_id || "none"}
                  onValueChange={(value) =>
                    onAssignCharacter(member.id, value === "none" ? null : value)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Assigner un personnage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun personnage</SelectItem>
                    {userChars.map((char: any) => (
                      <SelectItem key={char.id} value={char.id}>
                        {char.name} — {char.race} {char.class} Niv.{char.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : member.character_name ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sword className="h-3 w-3" />
                  {member.character_name} — {member.character_race} {member.character_class}
                </div>
              ) : isCurrentUser ? (
                myPendingProposal ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                      <Clock className="h-3 w-3 mr-1" />
                      Proposition en attente
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground hover:text-destructive px-1"
                      onClick={() => onCancelProposal(myPendingProposal.id)}
                      disabled={cancelPending}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10"
                    onClick={onPropose}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Proposer un personnage
                  </Button>
                )
              ) : (
                <span className="text-xs text-muted-foreground">Aucun personnage assigné</span>
              )}
            </div>
          )}
        </div>

        {isGM && !isMemberGM && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(member.id, member.display_name || "Joueur")}
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

const CampaignMembers = ({ campaignId, isGM }: CampaignMembersProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [proposeDialogOpen, setProposeDialogOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");

  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["campaignMembers", campaignId],
    queryFn: () => campaignsApi.getMembers(campaignId),
  });

  const { data: allCharacters = [] } = useQuery({
    queryKey: ["campaignCharacters", campaignId],
    queryFn: () => campaignsApi.getCampaignCharacters(campaignId),
    enabled: isGM,
  });

  const { data: myCharactersRaw = [] } = useQuery({
    queryKey: ["myCharacters"],
    queryFn: () => charactersApi.list(),
    enabled: !isGM,
  });

  const myCharacters = useMemo(
    () => filterCompatibleCharacters(myCharactersRaw as any[], campaign as any ?? {}),
    [myCharactersRaw, campaign],
  );
  const myCharsHidden = (myCharactersRaw as any[]).length - myCharacters.length;

  const { data: proposals = [] } = useQuery({
    queryKey: ["campaignProposals", campaignId],
    queryFn: () => campaignsApi.getProposals(campaignId),
  });

  const pendingProposals = useMemo(
    () => (proposals as any[]).filter((p: any) => p.status === "pending"),
    [proposals]
  );

  const myPendingProposal = useMemo(
    () => (!isGM ? (proposals as any[]).find((p: any) => p.status === "pending") : null),
    [proposals, isGM]
  );

  // O(1) lookup: characters grouped by user_id, filtré par compatibilité système
  const charactersByUser = useMemo(() => {
    const compat = filterCompatibleCharacters(allCharacters as any[], campaign as any ?? {});
    const map = new Map<string, any[]>();
    for (const c of compat) {
      const arr = map.get(c.user_id) ?? [];
      arr.push(c);
      map.set(c.user_id, arr);
    }
    return map;
  }, [allCharacters, campaign]);

  const updateCharacterMutation = useMutation({
    mutationFn: async ({ memberId, characterId }: { memberId: string; characterId: string | null }) => {
      return campaignsApi.assignCharacter(campaignId, memberId, characterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignMembers", campaignId] });
      toast({ title: "Personnage assigné" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return campaignsApi.removeMember(campaignId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignMembers", campaignId] });
      toast({ title: "Membre retiré" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const submitProposalMutation = useMutation({
    mutationFn: async (characterId: string) => {
      return campaignsApi.submitProposal(campaignId, characterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignProposals", campaignId] });
      setProposeDialogOpen(false);
      setSelectedCharacterId("");
      toast({ title: "Proposition envoyée", description: "Le MJ sera notifié de votre proposition." });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const cancelProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      return campaignsApi.cancelProposal(campaignId, proposalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignProposals", campaignId] });
      toast({ title: "Proposition annulée" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const reviewProposalMutation = useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: string; status: "accepted" | "rejected" }) => {
      return campaignsApi.reviewProposal(campaignId, proposalId, status);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["campaignProposals", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignMembers", campaignId] });
      toast({
        title: vars.status === "accepted" ? "Proposition acceptée" : "Proposition refusée",
        description: vars.status === "accepted" ? "Le personnage a été assigné au joueur." : undefined,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const getInitials = (member: any) => {
    if (member.display_name) {
      return member.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "?";
  };

  const handleAssignCharacter = useCallback(
    (memberId: string, characterId: string | null) => {
      updateCharacterMutation.mutate({ memberId, characterId });
    },
    [updateCharacterMutation]
  );
  const handleRemove = useCallback((id: string, name: string) => {
    setMemberToRemove({ id, name });
  }, []);
  const handleOpenPropose = useCallback(() => setProposeDialogOpen(true), []);
  const handleCancelProposal = useCallback(
    (proposalId: string) => cancelProposalMutation.mutate(proposalId),
    [cancelProposalMutation]
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Membres de la campagne</h3>

      {isGM && pendingProposals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Propositions en attente ({pendingProposals.length})
          </h4>
          {pendingProposals.map((proposal: any) => (
            <Card key={proposal.id} className="bg-primary/5 border-primary/30">
              <CardContent className="flex items-center gap-3 p-3">
                <Sword className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {proposal.player_name || "Joueur"} propose{" "}
                    <span className="text-primary">{proposal.character_name}</span>
                  </p>
                  {(proposal.character_race || proposal.character_class) && (
                    <p className="text-xs text-muted-foreground">
                      {proposal.character_race} {proposal.character_class}
                      {proposal.character_level ? ` — Niv. ${proposal.character_level}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                    onClick={() => reviewProposalMutation.mutate({ proposalId: proposal.id, status: "accepted" })}
                    disabled={reviewProposalMutation.isPending}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => reviewProposalMutation.mutate({ proposalId: proposal.id, status: "rejected" })}
                    disabled={reviewProposalMutation.isPending}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Refuser
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(members as any[]).map((member: any) => (
          <MemberCard
            key={member.id}
            member={member}
            isGM={isGM}
            isCurrentUser={member.user_id === user?.id}
            userChars={charactersByUser.get(member.user_id) ?? EMPTY_ARR}
            myPendingProposal={myPendingProposal}
            onAssignCharacter={handleAssignCharacter}
            onRemove={handleRemove}
            onPropose={handleOpenPropose}
            onCancelProposal={handleCancelProposal}
            cancelPending={cancelProposalMutation.isPending}
          />
        ))}
      </div>

      {(members as any[]).length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium text-foreground">Aucun membre</h4>
          <p className="text-sm text-muted-foreground">Partagez le code d'invitation pour recruter des joueurs</p>
        </div>
      )}

      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => { if (!open) setMemberToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce joueur de la campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.name} sera retiré de la campagne. Cette action ne peut pas être annulée depuis l'interface.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (memberToRemove) {
                  removeMemberMutation.mutate(memberToRemove.id);
                  setMemberToRemove(null);
                }
              }}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={proposeDialogOpen} onOpenChange={(open) => { setProposeDialogOpen(open); if (!open) setSelectedCharacterId(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposer un personnage</DialogTitle>
            <DialogDescription>
              {campaign?.system ? (
                <>Système de la campagne : <strong>{getSystem(campaign.system).label}</strong>
                  {campaign.allow_homebrew_characters && <> · Homebrew accepté</>}
                </>
              ) : "Choisissez l'un de vos personnages à soumettre au MJ pour approbation."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            {myCharsHidden > 0 && (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
                {myCharsHidden} personnage{myCharsHidden > 1 ? "s" : ""} masqué{myCharsHidden > 1 ? "s" : ""} car
                incompatible{myCharsHidden > 1 ? "s" : ""} avec le système de la campagne.
              </p>
            )}
            {myCharacters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun personnage compatible avec le système de la campagne. Créez-en un dans la section Personnages.
              </p>
            ) : (
              <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un personnage" />
                </SelectTrigger>
                <SelectContent>
                  {myCharacters.map((char: any) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name} — {char.race} {char.class} Niv.{char.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setProposeDialogOpen(false); setSelectedCharacterId(""); }}>
              Annuler
            </Button>
            <Button
              onClick={() => { if (selectedCharacterId) submitProposalMutation.mutate(selectedCharacterId); }}
              disabled={!selectedCharacterId || submitProposalMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer la proposition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignMembers;

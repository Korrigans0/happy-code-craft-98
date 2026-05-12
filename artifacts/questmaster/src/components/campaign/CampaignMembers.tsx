import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Crown, User, UserMinus, Sword } from "lucide-react";

interface CampaignMembersProps {
  campaignId: string;
  isGM: boolean;
}

const CampaignMembers = ({ campaignId, isGM }: CampaignMembersProps) => {
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["campaignMembers", campaignId],
    queryFn: () => campaignsApi.getMembers(campaignId),
  });

  const { data: allCharacters = [] } = useQuery({
    queryKey: ["campaignCharacters", campaignId],
    queryFn: () => campaignsApi.getCampaignCharacters(campaignId),
    enabled: isGM,
  });

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

  const getInitials = (member: any) => {
    if (member.display_name) {
      return member.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "?";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Membres de la campagne</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {members.map((member: any) => {
          const isMemberGM = member.role === "gm";
          const userChars = (allCharacters as any[]).filter((c: any) => c.user_id === member.user_id);

          return (
            <Card key={member.id} className="bg-gradient-card border-border">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(member)}
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
                            updateCharacterMutation.mutate({
                              memberId: member.id,
                              characterId: value === "none" ? null : value,
                            })
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
                    onClick={() => removeMemberMutation.mutate(member.id)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium text-foreground">Aucun membre</h4>
          <p className="text-sm text-muted-foreground">Partagez le code d'invitation pour recruter des joueurs</p>
        </div>
      )}
    </div>
  );
};

export default CampaignMembers;

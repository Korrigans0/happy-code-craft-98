import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Crown, User, UserMinus, Shield, Sword } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Character = Tables<"characters">;

interface CampaignMembersProps {
  campaignId: string;
  isGM: boolean;
}

const CampaignMembers = ({ campaignId, isGM }: CampaignMembersProps) => {
  const queryClient = useQueryClient();

  // Fetch members with profiles
  const { data: members = [] } = useQuery({
    queryKey: ["campaignMembers", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_members")
        .select("*")
        .eq("campaign_id", campaignId);
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["memberProfiles", campaignId],
    queryFn: async () => {
      const memberIds = members.map(m => m.user_id);
      if (memberIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", memberIds);
      if (error) throw error;
      return data;
    },
    enabled: members.length > 0,
  });

  // Fetch characters for members
  const { data: characters = [] } = useQuery({
    queryKey: ["memberCharacters", campaignId],
    queryFn: async () => {
      const characterIds = members.map(m => m.character_id).filter(Boolean);
      if (characterIds.length === 0) return [];
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .in("id", characterIds);
      if (error) throw error;
      return data as Character[];
    },
    enabled: members.some(m => m.character_id),
  });

  // Fetch available characters for assignment
  const { data: availableCharacters = [] } = useQuery({
    queryKey: ["availableCharacters", campaignId],
    queryFn: async () => {
      const memberIds = members.map(m => m.user_id);
      if (memberIds.length === 0) return [];
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .in("user_id", memberIds);
      if (error) throw error;
      return data as Character[];
    },
    enabled: members.length > 0,
  });

  // Update character assignment
  const updateCharacterMutation = useMutation({
    mutationFn: async ({ memberId, characterId }: { memberId: string; characterId: string | null }) => {
      const { error } = await supabase
        .from("campaign_members")
        .update({ character_id: characterId })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignMembers", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["memberCharacters", campaignId] });
      toast({ title: "Personnage assigné" });
    },
  });

  // Remove member
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("campaign_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignMembers", campaignId] });
      toast({ title: "Membre retiré" });
    },
  });

  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);
  const getCharacter = (characterId: string | null) => characters.find(c => c.id === characterId);
  const getUserCharacters = (userId: string) => availableCharacters.filter(c => c.user_id === userId);

  const getInitials = (profile: any) => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Membres de la campagne</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        {members.map((member) => {
          const profile = getProfile(member.user_id);
          const character = getCharacter(member.character_id);
          const userChars = getUserCharacters(member.user_id);
          const isMemberGM = member.role === 'gm';

          return (
            <Card key={member.id} className="bg-gradient-card border-border">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(profile)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {profile?.display_name || "Anonyme"}
                    </span>
                    {isMemberGM && (
                      <Badge variant="default" className="bg-primary/20 text-primary">
                        <Crown className="mr-1 h-3 w-3" />
                        MJ
                      </Badge>
                    )}
                  </div>

                  {/* Character Assignment */}
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
                            {userChars.map((char) => (
                              <SelectItem key={char.id} value={char.id}>
                                {char.name} - {char.race} {char.class} Niv.{char.level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : character ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sword className="h-3 w-3" />
                          {character.name} - {character.race} {character.class}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucun personnage assigné</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Remove Button (GM only, can't remove GM) */}
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

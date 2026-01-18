import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Dices, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CampaignChatProps {
  campaignId: string;
  userId: string;
  isGM: boolean;
}

interface DiceRollMetadata {
  dice: string;
  results: number[];
  total: number;
  modifier?: number;
}

const CampaignChat = ({ campaignId, userId, isGM }: CampaignChatProps) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [diceInput, setDiceInput] = useState("1d20");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ["campaignMessages", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_messages")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch members for display names
  const { data: members = [] } = useQuery({
    queryKey: ["campaignMembersChat", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_members")
        .select("user_id, role")
        .eq("campaign_id", campaignId);
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for member display
  const { data: profiles = [] } = useQuery({
    queryKey: ["campaignProfiles", campaignId],
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

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`campaign-messages-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "campaign_messages",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["campaignMessages", campaignId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (data: { content: string; message_type: string; metadata?: DiceRollMetadata }) => {
      const { error } = await supabase.from("campaign_messages").insert({
        campaign_id: campaignId,
        user_id: userId,
        content: data.content,
        message_type: data.message_type,
        metadata: data.metadata as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'envoyer le message", variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate({ content: message, message_type: "chat" });
  };

  const rollDice = () => {
    const match = diceInput.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) {
      toast({ title: "Format invalide", description: "Utilisez le format XdY ou XdY+Z (ex: 2d6+3)", variant: "destructive" });
      return;
    }

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    if (count > 20 || sides > 100) {
      toast({ title: "Limite dépassée", description: "Max 20 dés de 100 faces", variant: "destructive" });
      return;
    }

    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * sides) + 1);
    }
    const total = results.reduce((a, b) => a + b, 0) + modifier;

    const content = modifier !== 0 
      ? `🎲 ${diceInput} → [${results.join(", ")}] ${modifier >= 0 ? '+' : ''}${modifier} = **${total}**`
      : `🎲 ${diceInput} → [${results.join(", ")}] = **${total}**`;

    sendMutation.mutate({
      content,
      message_type: "dice_roll",
      metadata: { dice: diceInput, results, total, modifier },
    });
  };

  const getProfile = (id: string) => profiles.find(p => p.user_id === id);
  const getMember = (id: string) => members.find(m => m.user_id === id);

  const getInitials = (profile: any) => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  return (
    <div className="flex h-[calc(100vh-280px)] flex-col rounded-lg border border-border bg-gradient-card">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => {
            const profile = getProfile(msg.user_id);
            const member = getMember(msg.user_id);
            const isOwn = msg.user_id === userId;
            const isMsgGM = member?.role === 'gm';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {getInitials(profile)}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwn ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {profile?.display_name || "Anonyme"}
                    </span>
                    {isMsgGM && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        <Crown className="mr-0.5 h-2.5 w-2.5" />
                        MJ
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div
                    className={`mt-1 rounded-lg px-3 py-2 text-sm ${
                      msg.message_type === "dice_roll"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content.split('**').map((part, i) => 
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        {/* Dice Roller */}
        <div className="mb-3 flex items-center gap-2">
          <Dices className="h-4 w-4 text-muted-foreground" />
          <Input
            value={diceInput}
            onChange={(e) => setDiceInput(e.target.value)}
            placeholder="1d20, 2d6+3..."
            className="w-32 h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && rollDice()}
          />
          <Button variant="outline" size="sm" onClick={rollDice}>
            Lancer
          </Button>
          <div className="flex gap-1 ml-2">
            {["1d20", "1d6", "2d6", "1d8", "1d10", "1d12"].map((dice) => (
              <Button
                key={dice}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setDiceInput(dice);
                }}
              >
                {dice}
              </Button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <Button onClick={handleSend} disabled={sendMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampaignChat;

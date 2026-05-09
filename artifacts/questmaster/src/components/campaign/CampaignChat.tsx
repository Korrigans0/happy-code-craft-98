import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { campaignsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Dices, Crown, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CampaignChatProps {
  campaignId: string;
  isGM: boolean;
}

interface DiceRollMetadata {
  dice: string;
  results: number[];
  total: number;
  modifier?: number;
  whisperTo?: string;
}

const QUICK_ACTIONS = [
  { label: "Jet de Perception", dice: "1d20", skill: "Perception" },
  { label: "Jet d'Investigation", dice: "1d20", skill: "Investigation" },
  { label: "Jet de Discrétion", dice: "1d20", skill: "Discrétion" },
  { label: "Jet d'Initiative", dice: "1d20", skill: "Initiative" },
  { label: "Jet de Sauvegarde", dice: "1d20", skill: "Sauvegarde" },
  { label: "Attaque", dice: "1d20", skill: "Attaque" },
  { label: "Dégâts (épée)", dice: "1d8", skill: "Dégâts" },
  { label: "Dégâts (dague)", dice: "1d4", skill: "Dégâts" },
];

const CampaignChat = ({ campaignId, isGM }: CampaignChatProps) => {
  const { user: clerkUser } = useUser();
  const userId = clerkUser?.id ?? "";
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [diceInput, setDiceInput] = useState("1d20");
  const [isWhisper, setIsWhisper] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["campaignMessages", campaignId],
    queryFn: () => campaignsApi.getMessages(campaignId),
    refetchInterval: 3000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["campaignMembersChat", campaignId],
    queryFn: () => campaignsApi.getMembers(campaignId),
  });

  // Profiles are embedded in members from the API
  const profiles = members;

  // Auto-poll instead of realtime

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (data: { content: string; message_type: string; metadata?: any }) => {
      return campaignsApi.postMessage(campaignId, {
        content: data.content,
        message_type: data.message_type,
        metadata: data.metadata,
      });
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
    
    const msgType = isWhisper ? "whisper" : "chat";
    const content = isWhisper ? `🔒 [Murmure MJ] ${message}` : message;
    
    sendMutation.mutate({ 
      content, 
      message_type: msgType,
      metadata: isWhisper ? { whisper: true } : undefined,
    });
  };

  const rollDice = (diceStr?: string) => {
    const input = diceStr || diceInput;
    const match = input.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
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

    // Check for nat 20/1
    let prefix = "🎲";
    if (sides === 20 && count === 1) {
      if (results[0] === 20) prefix = "🎲✨ CRITIQUE !";
      if (results[0] === 1) prefix = "🎲💀 ÉCHEC CRITIQUE !";
    }

    const content = modifier !== 0 
      ? `${prefix} ${input} → [${results.join(", ")}] ${modifier >= 0 ? '+' : ''}${modifier} = **${total}**`
      : `${prefix} ${input} → [${results.join(", ")}] = **${total}**`;

    sendMutation.mutate({
      content,
      message_type: "dice_roll",
      metadata: { dice: input, results, total, modifier },
    });
  };

  const quickAction = (action: typeof QUICK_ACTIONS[0]) => {
    const match = action.dice.match(/^(\d+)d(\d+)$/);
    if (!match) return;
    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * sides) + 1);
    }
    const total = results.reduce((a, b) => a + b, 0);
    
    let prefix = "🎲";
    if (sides === 20 && count === 1) {
      if (results[0] === 20) prefix = "🎲✨ CRITIQUE !";
      if (results[0] === 1) prefix = "🎲💀 ÉCHEC CRITIQUE !";
    }

    const content = `${prefix} ${action.skill} (${action.dice}) → [${results.join(", ")}] = **${total}**`;
    sendMutation.mutate({
      content,
      message_type: "dice_roll",
      metadata: { dice: action.dice, results, total, modifier: 0 },
    });
    setShowQuickActions(false);
  };

  const getProfile = (id: string) => profiles.find(p => p.user_id === id);
  const getMember = (id: string) => members.find(m => m.user_id === id);

  const getInitials = (profile: any) => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  // Filter whisper messages - only show to GM and sender
  const visibleMessages = messages.filter(msg => {
    if (msg.message_type === "whisper") {
      return isGM || msg.user_id === userId;
    }
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-280px)] flex-col rounded-lg border border-border bg-gradient-card">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {visibleMessages.map((msg) => {
            const profile = getProfile(msg.user_id);
            const member = getMember(msg.user_id);
            const isOwn = msg.user_id === userId;
            const isMsgGM = member?.role === 'gm';
            const isMsgWhisper = msg.message_type === "whisper";

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
                    {isMsgWhisper && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px] border-purple-500/50 text-purple-400">
                        <EyeOff className="mr-0.5 h-2.5 w-2.5" />
                        Murmure
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div
                    className={`mt-1 rounded-lg px-3 py-2 text-sm ${
                      isMsgWhisper
                        ? "bg-purple-500/20 text-purple-200 border border-purple-500/30 italic"
                        : msg.message_type === "dice_roll"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content.split('**').map((part: string, i: number) => 
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
        {/* Quick Actions */}
        {showQuickActions && (
          <div className="mb-3 flex flex-wrap gap-1 p-2 rounded-md bg-muted/50 border border-border">
            {QUICK_ACTIONS.map((action, i) => (
              <Button key={i} variant="outline" size="sm" className="h-7 text-xs" onClick={() => quickAction(action)}>
                <Sparkles className="mr-1 h-3 w-3" />
                {action.label}
              </Button>
            ))}
          </div>
        )}

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
          <Button variant="outline" size="sm" onClick={() => rollDice()}>
            Lancer
          </Button>
          <div className="flex gap-1 ml-1">
            {["1d20", "1d6", "2d6", "1d8", "1d10", "1d12", "1d4", "1d100"].map((dice) => (
              <Button
                key={dice}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setDiceInput(dice)}
              >
                {dice}
              </Button>
            ))}
          </div>
          <Button
            variant={showQuickActions ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs ml-auto"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <Sparkles className="h-3 w-3" />
          </Button>
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          {isGM && (
            <Button
              variant={isWhisper ? "secondary" : "ghost"}
              size="icon"
              className={`shrink-0 ${isWhisper ? "text-purple-400" : ""}`}
              onClick={() => setIsWhisper(!isWhisper)}
              title={isWhisper ? "Murmure activé (MJ seul)" : "Message public"}
            >
              {isWhisper ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isWhisper ? "Murmure MJ (visible seulement par vous)..." : "Écrire un message..."}
            className={`flex-1 ${isWhisper ? "border-purple-500/50" : ""}`}
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

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { campaignsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Dices, Crown, Eye, EyeOff, Sparkles, Image, AtSign, X, Trash2, Plus, Minus } from "lucide-react";
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

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
const GIF_EXTENSIONS = /\.(gif)(\?.*)?$/i;
const GIPHY_RE = /giphy\.com/i;
const TENOR_RE = /tenor\.com/i;

function isImageUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return IMAGE_EXTENSIONS.test(url.pathname) || GIPHY_RE.test(url.hostname) || TENOR_RE.test(url.hostname);
  } catch {
    return false;
  }
}

function isGif(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return GIF_EXTENSIONS.test(url.pathname) || GIPHY_RE.test(url.hostname) || TENOR_RE.test(url.hostname);
  } catch {
    return false;
  }
}

function renderMessageContent(content: string, members: any[], onPingClick?: (userId: string) => void) {
  const parts = content.split(/(\s+)/);
  const tokens: React.ReactNode[] = [];
  let textBuffer = "";
  let key = 0;

  const flushText = () => {
    if (!textBuffer) return;
    const boldParts = textBuffer.split("**");
    boldParts.forEach((part, i) => {
      if (i % 2 === 1) {
        tokens.push(<strong key={`b-${key++}`}>{part}</strong>);
      } else if (part) {
        tokens.push(<span key={`t-${key++}`}>{part}</span>);
      }
    });
    textBuffer = "";
  };

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed && isImageUrl(trimmed)) {
      flushText();
      tokens.push(
        <span key={`img-${key++}`} className="block mt-1">
          <img
            src={trimmed}
            alt="image partagée"
            className="max-w-[260px] max-h-[200px] rounded-lg border border-border/40 object-contain cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(trimmed, "_blank")}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {isGif(trimmed) && (
            <span className="text-[10px] text-muted-foreground ml-1">GIF</span>
          )}
        </span>
      );
    } else if (trimmed.startsWith("@") && trimmed.length > 1) {
      flushText();
      const mention = trimmed.slice(1).toLowerCase();
      const mentioned = members.find((m: any) =>
        (m.display_name || "").toLowerCase().startsWith(mention) ||
        (m.username || "").toLowerCase().startsWith(mention)
      );
      tokens.push(
        <span
          key={`ping-${key++}`}
          className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs font-semibold bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
          onClick={() => mentioned && onPingClick?.(mentioned.user_id)}
        >
          <AtSign className="h-2.5 w-2.5" />
          {trimmed.slice(1)}
        </span>
      );
    } else {
      textBuffer += part;
    }
  }
  flushText();
  return tokens;
}

const CampaignChat = ({ campaignId, isGM }: CampaignChatProps) => {
  const { user: authUser } = useAuth();
  const userId = authUser?.id ?? "";
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [diceInput, setDiceInput] = useState("1d20");
  const [isWhisper, setIsWhisper] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["campaignMessages", campaignId],
    queryFn: () => campaignsApi.getMessages(campaignId),
    refetchInterval: 1200,
    refetchOnWindowFocus: true,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["campaignMembersChat", campaignId],
    queryFn: () => campaignsApi.getMembers(campaignId),
  });

  const profiles = members;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const clearMutation = useMutation({
    mutationFn: () => campaignsApi.clearMessages(campaignId, isWhisper ? "gm" : "chat"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignMessages", campaignId] });
      toast({ title: isWhisper ? "Chat MJ vidé" : "Chat vidé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de vider le chat", variant: "destructive" });
    },
  });

  const handleClearChat = () => {
    const label = isWhisper ? "le chat MJ" : "le chat normal";
    if (!confirm(`Vider ${label} pour cette campagne ?`)) return;
    clearMutation.mutate();
  };

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

  const sendImage = () => {
    if (!imageUrl.trim()) return;
    if (!isImageUrl(imageUrl.trim())) {
      toast({ title: "URL invalide", description: "Entrez une URL d'image valide (jpg, png, gif, webp...)", variant: "destructive" });
      return;
    }
    sendMutation.mutate({ content: imageUrl.trim(), message_type: "chat" });
    setImageUrl("");
    setShowImageInput(false);
  };

  const pingMember = (targetUserId: string) => {
    const member = members.find((m: any) => m.user_id === targetUserId);
    if (!member) return;
    const name = member.display_name || "joueur";
    setMessage(prev => `${prev}@${name} `.trimStart());
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

    let prefix = "🎲";
    if (sides === 20 && count === 1) {
      if (results[0] === 20) prefix = "🎲✨ CRITIQUE !";
      if (results[0] === 1) prefix = "🎲💀 ÉCHEC CRITIQUE !";
    }

    const content = modifier !== 0
      ? `${prefix} ${input} → [${results.join(", ")}] ${modifier >= 0 ? '+' : ''}${modifier}`
      : `${prefix} ${input} → [${results.join(", ")}]`;

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

    const content = `${prefix} ${action.skill} (${action.dice}) → [${results.join(", ")}]`;
    sendMutation.mutate({
      content,
      message_type: "dice_roll",
      metadata: { dice: action.dice, results, total, modifier: 0 },
    });
    setShowQuickActions(false);
  };

  const getProfile = (id: string) => profiles.find((p: any) => p.user_id === id);
  const getMember = (id: string) => members.find((m: any) => m.user_id === id);

  const getInitials = (profile: any) => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  const visibleMessages = messages.filter((msg: any) => {
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
          {visibleMessages.map((msg: any) => {
            const profile = getProfile(msg.user_id);
            const member = getMember(msg.user_id);
            const isOwn = msg.user_id === userId;
            const isMsgGM = member?.role === 'gm';
            const isMsgWhisper = msg.message_type === "whisper";
            const isImage = isImageUrl(msg.content?.trim() || "");

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
                  {isImage ? (
                    <div className="mt-1">
                      <img
                        src={msg.content.trim()}
                        alt="image"
                        className="max-w-[260px] max-h-[200px] rounded-lg border border-border/40 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(msg.content.trim(), "_blank")}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      {isGif(msg.content.trim()) && (
                        <span className="text-[10px] text-muted-foreground">GIF</span>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`mt-1 rounded-lg px-3 py-2 text-sm ${
                        isMsgWhisper
                          ? "bg-purple-500/20 text-purple-200 border border-purple-500/30 italic"
                          : msg.message_type === "dice_roll"
                          ? "bg-card text-foreground border border-primary/40"
                          : isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {renderMessageContent(msg.content, members, pingMember)}
                    </div>
                  )}
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

        {/* Image URL input */}
        {showImageInput && (
          <div className="mb-3 flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
            <Image className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (URL image ou GIF)"
              className="flex-1 h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && sendImage()}
              autoFocus
            />
            <Button size="sm" className="h-8" onClick={sendImage} disabled={!imageUrl.trim()}>
              Envoyer
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowImageInput(false); setImageUrl(""); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Ping members dropdown */}
        {members.length > 1 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {members.filter((m: any) => m.user_id !== userId).map((m: any) => (
              <button
                key={m.user_id}
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted/60 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                onClick={() => pingMember(m.user_id)}
                title={`Mentionner ${m.display_name || 'joueur'}`}
              >
                <AtSign className="h-2.5 w-2.5" />
                {m.display_name || "Joueur"}
              </button>
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
          {isGM && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-destructive"
              onClick={handleClearChat}
              disabled={clearMutation.isPending || visibleMessages.length === 0}
              title={isWhisper ? "Vider le chat MJ" : "Vider le chat normal"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant={showImageInput ? "secondary" : "ghost"}
            size="icon"
            className="shrink-0"
            onClick={() => { setShowImageInput(v => !v); setShowQuickActions(false); }}
            title="Envoyer une image ou un GIF"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isWhisper ? "Murmure MJ (visible seulement par vous)..." : "Écrire un message... (@nom pour mentionner)"}
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

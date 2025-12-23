import { Sword, Users, Calendar, Settings, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CampaignCardProps {
  title: string;
  description: string;
  isActive: boolean;
  playersCount?: number;
  date: string;
}

const CampaignCard = ({ title, description, isActive, date }: CampaignCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-card p-6 shadow-card transition-all duration-300 hover:border-primary/30">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
          <Sword className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {title}
            </h3>
            {isActive && (
              <Badge variant="active" className="text-xs">
                Active
              </Badge>
            )}
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Joueurs
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button variant="join" size="sm" className="flex-1">
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Rejoindre
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;

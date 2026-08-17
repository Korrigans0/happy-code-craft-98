import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  "entity.create": "a créé une fiche",
  "entity.update": "a modifié une fiche",
  "entity.delete": "a supprimé une fiche",
  "messages.clear": "a effacé le chat",
};

export function describeAuditEntry(entry: any, actorName?: string | null) {
  const who = actorName || "Un membre";
  const action = ACTION_LABELS[entry.action] ?? entry.action;
  const name = entry.details?.name ? ` « ${entry.details.name} »` : "";
  return `${who} ${action}${name}`;
}

export default function CampaignHistory({ campaignId }: { campaignId: string }) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["campaign-audit", campaignId],
    queryFn: () => campaignsApi.getAuditLog(campaignId),
    enabled: !!campaignId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["campaign-members", campaignId],
    queryFn: () => campaignsApi.getMembers(campaignId),
    enabled: !!campaignId,
  });

  const nameByUser = useMemo(() => {
    const map = new Map<string, string>();
    (members as any[]).forEach((m) => {
      if (m.user_id) map.set(m.user_id, m.display_name || m.character_name || "Membre");
    });
    return map;
  }, [members]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold">Historique de la campagne</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (entries as any[]).length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Aucune modification enregistrée pour le moment.
        </Card>
      ) : (
        <ul className="space-y-2">
          {(entries as any[]).map((e) => (
            <li key={e.id}>
              <Card className="flex flex-wrap items-center justify-between gap-2 border-border/60 bg-card/60 p-3">
                <span className="text-sm text-foreground/90">
                  {describeAuditEntry(e, nameByUser.get(e.user_id))}
                </span>
                <div className="flex items-center gap-2">
                  {e.scope && <Badge variant="outline" className="text-xs">{e.scope}</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("fr-BE")}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

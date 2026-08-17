// Campaign preparation space — Chapters -> Scenes/Encounters.
// GM-only content: the database enforces it, the UI only renders what it returns.

export type PrepSceneStatus = "draft" | "ready" | "done";

export interface CampaignChapter {
  id: string;
  campaign_id: string;
  title: string;
  summary: string | null;
  sort_order: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PrepScene {
  id: string;
  campaign_id: string;
  chapter_id: string | null;
  title: string;
  summary: string | null;
  gm_notes: string;
  status: PrepSceneStatus;
  sort_order: number;
  entity_ids: string[];
  vtt_scene_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const PREP_SCENE_STATUS: { id: PrepSceneStatus; label: string; className: string }[] = [
  { id: "draft", label: "Brouillon", className: "border-muted-foreground/40 text-muted-foreground" },
  { id: "ready", label: "Prête", className: "border-amber-500/50 text-amber-400" },
  { id: "done", label: "Jouée", className: "border-emerald-500/50 text-emerald-400" },
];

export function statusMeta(status: string) {
  return PREP_SCENE_STATUS.find((s) => s.id === status) ?? PREP_SCENE_STATUS[0];
}

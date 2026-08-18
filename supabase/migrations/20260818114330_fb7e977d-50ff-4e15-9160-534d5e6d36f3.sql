CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  transcript TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their AI conversations"
ON public.ai_conversations FOR ALL TO authenticated
USING (auth.uid() = user_id AND public.is_campaign_gm(auth.uid(), campaign_id))
WITH CHECK (auth.uid() = user_id AND public.is_campaign_gm(auth.uid(), campaign_id));

CREATE INDEX idx_ai_conversations_campaign_user ON public.ai_conversations (campaign_id, user_id, updated_at DESC);
CREATE INDEX idx_ai_conversations_transcript ON public.ai_conversations USING gin (to_tsvector('simple', transcript));

CREATE TRIGGER trg_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
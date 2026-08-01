-- Realtime: full row payloads so clients can apply changes without refetching
ALTER TABLE public.tabletop_state REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_messages REPLICA IDENTITY FULL;
ALTER TABLE public.combat_encounters REPLICA IDENTITY FULL;
ALTER TABLE public.combat_participants REPLICA IDENTITY FULL;

-- Add tables to the realtime publication (idempotent)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tabletop_state','campaign_messages','combat_encounters','combat_participants']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
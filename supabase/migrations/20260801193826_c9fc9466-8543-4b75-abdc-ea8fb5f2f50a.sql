CREATE TABLE public.campaign_audio_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'music' CHECK (kind IN ('music','sfx')),
  source text NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','url')),
  file_path text,
  external_url text,
  size_bytes bigint,
  loop_default boolean NOT NULL DEFAULT true,
  volume_default numeric NOT NULL DEFAULT 0.7,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((source = 'upload' AND file_path IS NOT NULL) OR (source = 'url' AND external_url IS NOT NULL))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_audio_tracks TO authenticated;
GRANT ALL ON public.campaign_audio_tracks TO service_role;
ALTER TABLE public.campaign_audio_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view campaign audio tracks"
  ON public.campaign_audio_tracks FOR SELECT TO authenticated
  USING (public.is_campaign_member(auth.uid(), campaign_id));
CREATE POLICY "GM can insert campaign audio tracks"
  ON public.campaign_audio_tracks FOR INSERT TO authenticated
  WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id) AND created_by = auth.uid());
CREATE POLICY "GM can update campaign audio tracks"
  ON public.campaign_audio_tracks FOR UPDATE TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id))
  WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id));
CREATE POLICY "GM can delete campaign audio tracks"
  ON public.campaign_audio_tracks FOR DELETE TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE INDEX idx_campaign_audio_tracks_campaign ON public.campaign_audio_tracks(campaign_id);

CREATE TRIGGER trg_campaign_audio_tracks_updated_at
  BEFORE UPDATE ON public.campaign_audio_tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaign_audio_state (
  campaign_id uuid PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  track_id uuid REFERENCES public.campaign_audio_tracks(id) ON DELETE SET NULL,
  is_playing boolean NOT NULL DEFAULT false,
  loop boolean NOT NULL DEFAULT true,
  master_volume numeric NOT NULL DEFAULT 0.7,
  started_at timestamptz,
  sfx_event jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_audio_state TO authenticated;
GRANT ALL ON public.campaign_audio_state TO service_role;
ALTER TABLE public.campaign_audio_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view campaign audio state"
  ON public.campaign_audio_state FOR SELECT TO authenticated
  USING (public.is_campaign_member(auth.uid(), campaign_id));
CREATE POLICY "GM can insert campaign audio state"
  ON public.campaign_audio_state FOR INSERT TO authenticated
  WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id));
CREATE POLICY "GM can update campaign audio state"
  ON public.campaign_audio_state FOR UPDATE TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id))
  WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id));
CREATE POLICY "GM can delete campaign audio state"
  ON public.campaign_audio_state FOR DELETE TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE TRIGGER trg_campaign_audio_state_updated_at
  BEFORE UPDATE ON public.campaign_audio_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.campaign_audio_tracks REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_audio_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_audio_tracks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_audio_state;

-- Storage policies for the private campaign-audio bucket.
CREATE POLICY "Campaign members can read campaign audio files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'campaign-audio'
    AND public.is_campaign_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "GM can upload campaign audio files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-audio'
    AND public.is_campaign_gm(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "GM can update campaign audio files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'campaign-audio'
    AND public.is_campaign_gm(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "GM can delete campaign audio files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'campaign-audio'
    AND public.is_campaign_gm(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
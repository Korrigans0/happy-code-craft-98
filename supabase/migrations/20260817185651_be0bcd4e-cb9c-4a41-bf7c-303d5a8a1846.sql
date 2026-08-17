-- ── Campaign Codex : entities, relations, permissions, revisions ──────────────

CREATE TABLE public.campaign_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  system TEXT NOT NULL DEFAULT 'Aetheria',
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  summary TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'gm_only',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_entities_kind_check CHECK (kind IN ('npc','faction','location','quest','item','monster','event','note','handout')),
  CONSTRAINT campaign_entities_visibility_check CHECK (visibility IN ('gm_only','selected_players','campaign','public'))
);
CREATE INDEX idx_campaign_entities_campaign ON public.campaign_entities(campaign_id, kind);
CREATE INDEX idx_campaign_entities_tags ON public.campaign_entities USING GIN(tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_entities TO authenticated;
GRANT SELECT ON public.campaign_entities TO anon;
GRANT ALL ON public.campaign_entities TO service_role;

-- GM-only private notes kept in a separate table so players can never read them.
CREATE TABLE public.entity_gm_notes (
  entity_id UUID NOT NULL PRIMARY KEY REFERENCES public.campaign_entities(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_gm_notes TO authenticated;
GRANT ALL ON public.entity_gm_notes TO service_role;

CREATE TABLE public.entity_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.campaign_entities(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  level TEXT NOT NULL DEFAULT 'read',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_id, user_id),
  CONSTRAINT entity_permissions_level_check CHECK (level IN ('none','read','use','edit','duplicate','admin'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_permissions TO authenticated;
GRANT ALL ON public.entity_permissions TO service_role;

CREATE TABLE public.entity_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.campaign_entities(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.campaign_entities(id) ON DELETE CASCADE,
  relation TEXT NOT NULL DEFAULT 'related',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, target_id, relation),
  CONSTRAINT entity_links_no_self CHECK (source_id <> target_id)
);
CREATE INDEX idx_entity_links_source ON public.entity_links(source_id);
CREATE INDEX idx_entity_links_target ON public.entity_links(target_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_links TO authenticated;
GRANT SELECT ON public.entity_links TO anon;
GRANT ALL ON public.entity_links TO service_role;

CREATE TABLE public.entity_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.campaign_entities(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_entity_revisions_entity ON public.entity_revisions(entity_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.entity_revisions TO authenticated;
GRANT ALL ON public.entity_revisions TO service_role;

-- ── Access helper ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_view_entity(_entity_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_entities e
    WHERE e.id = _entity_id
      AND (
        e.visibility = 'public'
        OR public.is_campaign_gm(_user_id, e.campaign_id)
        OR (e.visibility = 'campaign' AND public.is_campaign_member(_user_id, e.campaign_id))
        OR (
          e.visibility = 'selected_players'
          AND EXISTS (
            SELECT 1 FROM public.entity_permissions p
            WHERE p.entity_id = e.id AND p.user_id = _user_id AND p.level <> 'none'
          )
        )
      )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_view_entity(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_entity(UUID, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_edit_entity(_entity_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_entities e
    WHERE e.id = _entity_id
      AND (
        public.is_campaign_gm(_user_id, e.campaign_id)
        OR EXISTS (
          SELECT 1 FROM public.entity_permissions p
          WHERE p.entity_id = e.id AND p.user_id = _user_id AND p.level IN ('edit','admin')
        )
      )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_edit_entity(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_entity(UUID, UUID) TO authenticated, service_role;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.campaign_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public entities are readable"
  ON public.campaign_entities FOR SELECT TO anon
  USING (visibility = 'public');

CREATE POLICY "Members read entities they may view"
  ON public.campaign_entities FOR SELECT TO authenticated
  USING (public.can_view_entity(id, auth.uid()));

CREATE POLICY "GM creates entities"
  ON public.campaign_entities FOR INSERT TO authenticated
  WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id) AND created_by = auth.uid());

CREATE POLICY "Editors update entities"
  ON public.campaign_entities FOR UPDATE TO authenticated
  USING (public.can_edit_entity(id, auth.uid()))
  WITH CHECK (public.can_edit_entity(id, auth.uid()));

CREATE POLICY "GM deletes entities"
  ON public.campaign_entities FOR DELETE TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id));

ALTER TABLE public.entity_gm_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GM manages private notes"
  ON public.entity_gm_notes FOR ALL TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id))
  WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id));

ALTER TABLE public.entity_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GM manages entity permissions"
  ON public.entity_permissions FOR ALL TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id))
  WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id));
CREATE POLICY "Users read their own entity permissions"
  ON public.entity_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.entity_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read links between viewable entities"
  ON public.entity_links FOR SELECT TO authenticated
  USING (public.can_view_entity(source_id, auth.uid()) AND public.can_view_entity(target_id, auth.uid()));
CREATE POLICY "GM manages links"
  ON public.entity_links FOR ALL TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id))
  WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id));

ALTER TABLE public.entity_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GM reads revisions"
  ON public.entity_revisions FOR SELECT TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id));
CREATE POLICY "GM deletes revisions"
  ON public.entity_revisions FOR DELETE TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id));

-- ── Triggers : updated_at, revisions, audit log ───────────────────────────────
CREATE TRIGGER trg_campaign_entities_updated_at
  BEFORE UPDATE ON public.campaign_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.log_entity_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.campaign_audit_log (campaign_id, user_id, action, scope, details)
    VALUES (OLD.campaign_id, _uid, 'entity.delete', OLD.kind,
            jsonb_build_object('entity_id', OLD.id, 'name', OLD.name));
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.entity_revisions (entity_id, campaign_id, snapshot, created_by)
    VALUES (OLD.id, OLD.campaign_id, to_jsonb(OLD), _uid);
    INSERT INTO public.campaign_audit_log (campaign_id, user_id, action, scope, details)
    VALUES (NEW.campaign_id, _uid, 'entity.update', NEW.kind,
            jsonb_build_object('entity_id', NEW.id, 'name', NEW.name));
    RETURN NEW;
  END IF;

  INSERT INTO public.campaign_audit_log (campaign_id, user_id, action, scope, details)
  VALUES (NEW.campaign_id, _uid, 'entity.create', NEW.kind,
          jsonb_build_object('entity_id', NEW.id, 'name', NEW.name));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_entity_change
  AFTER INSERT OR UPDATE OR DELETE ON public.campaign_entities
  FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();

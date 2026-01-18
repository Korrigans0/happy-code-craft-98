-- Create enum for campaign member roles
CREATE TYPE public.campaign_role AS ENUM ('gm', 'player');

-- Add invite_code to campaigns
ALTER TABLE public.campaigns 
ADD COLUMN invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8);

-- Update campaign_members to use role enum and improve structure
ALTER TABLE public.campaign_members 
DROP COLUMN IF EXISTS role;

ALTER TABLE public.campaign_members 
ADD COLUMN role campaign_role NOT NULL DEFAULT 'player';

-- Create campaign_sessions table for tracking game sessions
CREATE TABLE public.campaign_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  session_number INTEGER NOT NULL DEFAULT 1,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_messages for real-time chat
CREATE TABLE public.campaign_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat', -- 'chat', 'dice_roll', 'system'
  metadata JSONB, -- For dice rolls: {dice: "2d20", results: [15, 8], total: 23}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_notes for shared notes/journal
CREATE TABLE public.campaign_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_gm_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create combat_encounters for tracking combat
CREATE TABLE public.combat_encounters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Combat',
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_turn INTEGER NOT NULL DEFAULT 0,
  round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create combat_participants for initiative tracking
CREATE TABLE public.combat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.combat_encounters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initiative INTEGER NOT NULL DEFAULT 0,
  current_hp INTEGER NOT NULL DEFAULT 0,
  max_hp INTEGER NOT NULL DEFAULT 0,
  armor_class INTEGER NOT NULL DEFAULT 10,
  is_player BOOLEAN NOT NULL DEFAULT true,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  monster_id UUID REFERENCES public.monsters(id) ON DELETE SET NULL,
  conditions TEXT[] DEFAULT '{}',
  notes TEXT,
  turn_order INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS on all new tables
ALTER TABLE public.campaign_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combat_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combat_participants ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_encounters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_participants;

-- Create helper function to check campaign membership
CREATE OR REPLACE FUNCTION public.is_campaign_member(_user_id UUID, _campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE user_id = _user_id AND campaign_id = _campaign_id
  )
$$;

-- Create helper function to check if user is GM
CREATE OR REPLACE FUNCTION public.is_campaign_gm(_user_id UUID, _campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE user_id = _user_id AND campaign_id = _campaign_id AND role = 'gm'
  )
$$;

-- RLS Policies for campaign_sessions
CREATE POLICY "Members can view sessions"
  ON public.campaign_sessions FOR SELECT
  USING (public.is_campaign_member(auth.uid(), campaign_id));

CREATE POLICY "GM can manage sessions"
  ON public.campaign_sessions FOR ALL
  USING (public.is_campaign_gm(auth.uid(), campaign_id));

-- RLS Policies for campaign_messages
CREATE POLICY "Members can view messages"
  ON public.campaign_messages FOR SELECT
  USING (public.is_campaign_member(auth.uid(), campaign_id));

CREATE POLICY "Members can send messages"
  ON public.campaign_messages FOR INSERT
  WITH CHECK (public.is_campaign_member(auth.uid(), campaign_id) AND auth.uid() = user_id);

-- RLS Policies for campaign_notes
CREATE POLICY "Members can view non-gm notes"
  ON public.campaign_notes FOR SELECT
  USING (
    public.is_campaign_member(auth.uid(), campaign_id) AND 
    (NOT is_gm_only OR public.is_campaign_gm(auth.uid(), campaign_id))
  );

CREATE POLICY "Members can create notes"
  ON public.campaign_notes FOR INSERT
  WITH CHECK (public.is_campaign_member(auth.uid(), campaign_id) AND auth.uid() = user_id);

CREATE POLICY "Authors or GM can update notes"
  ON public.campaign_notes FOR UPDATE
  USING (
    public.is_campaign_member(auth.uid(), campaign_id) AND 
    (auth.uid() = user_id OR public.is_campaign_gm(auth.uid(), campaign_id))
  );

CREATE POLICY "Authors or GM can delete notes"
  ON public.campaign_notes FOR DELETE
  USING (
    public.is_campaign_member(auth.uid(), campaign_id) AND 
    (auth.uid() = user_id OR public.is_campaign_gm(auth.uid(), campaign_id))
  );

-- RLS Policies for combat_encounters
CREATE POLICY "Members can view encounters"
  ON public.combat_encounters FOR SELECT
  USING (public.is_campaign_member(auth.uid(), campaign_id));

CREATE POLICY "GM can manage encounters"
  ON public.combat_encounters FOR ALL
  USING (public.is_campaign_gm(auth.uid(), campaign_id));

-- RLS Policies for combat_participants
CREATE POLICY "Members can view participants"
  ON public.combat_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.combat_encounters e
      WHERE e.id = encounter_id AND public.is_campaign_member(auth.uid(), e.campaign_id)
    )
  );

CREATE POLICY "GM can manage participants"
  ON public.combat_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.combat_encounters e
      WHERE e.id = encounter_id AND public.is_campaign_gm(auth.uid(), e.campaign_id)
    )
  );

-- Update campaign_members policies to allow joining via invite code
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can join campaigns" ON public.campaign_members;

CREATE POLICY "Members can view campaign members"
  ON public.campaign_members FOR SELECT
  USING (public.is_campaign_member(auth.uid(), campaign_id) OR user_id = auth.uid());

CREATE POLICY "Users can join campaigns"
  ON public.campaign_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "GM or self can update membership"
  ON public.campaign_members FOR UPDATE
  USING (public.is_campaign_gm(auth.uid(), campaign_id) OR auth.uid() = user_id);

CREATE POLICY "GM or self can leave campaign"
  ON public.campaign_members FOR DELETE
  USING (public.is_campaign_gm(auth.uid(), campaign_id) OR auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_campaign_sessions_updated_at
  BEFORE UPDATE ON public.campaign_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_notes_updated_at
  BEFORE UPDATE ON public.campaign_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-add creator as GM when campaign is created
CREATE OR REPLACE FUNCTION public.add_campaign_creator_as_gm()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.campaign_members (campaign_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'gm');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_campaign_created
  AFTER INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.add_campaign_creator_as_gm();
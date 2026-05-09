-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  system TEXT DEFAULT 'D&D 5e',
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Campaign RLS policies
CREATE POLICY "Users can view their own campaigns"
ON public.campaigns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
ON public.campaigns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
ON public.campaigns FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
ON public.campaigns FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create campaign_members table for players
CREATE TABLE public.campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'player' CHECK (role IN ('dm', 'player')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS on campaign_members
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

-- Campaign members RLS policies
CREATE POLICY "Users can view members of their campaigns"
ON public.campaign_members FOR SELECT
USING (
  user_id = auth.uid() OR
  campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Campaign owners can manage members"
ON public.campaign_members FOR INSERT
WITH CHECK (
  campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Campaign owners can update members"
ON public.campaign_members FOR UPDATE
USING (
  campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Campaign owners can delete members"
ON public.campaign_members FOR DELETE
USING (
  campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
  OR user_id = auth.uid()
);
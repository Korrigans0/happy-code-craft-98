
-- Drop the problematic SELECT policy on campaigns
DROP POLICY IF EXISTS "Users can view accessible campaigns" ON public.campaigns;

-- Create a security definer function to check membership without RLS recursion
CREATE OR REPLACE FUNCTION public.check_campaign_access(_campaign_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaign_members
    WHERE campaign_members.campaign_id = _campaign_id
    AND campaign_members.user_id = _user_id
  );
$$;

-- Recreate the SELECT policy using the security definer function
CREATE POLICY "Users can view accessible campaigns"
ON public.campaigns
FOR SELECT
USING (
  auth.uid() = user_id
  OR check_campaign_access(id, auth.uid())
);

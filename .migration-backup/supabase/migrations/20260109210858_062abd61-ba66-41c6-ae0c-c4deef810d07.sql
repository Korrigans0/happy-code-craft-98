-- Drop existing policies if they exist and recreate them properly
DROP POLICY IF EXISTS "Users can view their own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can create their own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can update their own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can delete their own characters" ON public.characters;

-- Recreate all character policies
CREATE POLICY "Users can view their own characters"
ON public.characters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own characters"
ON public.characters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters"
ON public.characters FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters"
ON public.characters FOR DELETE
USING (auth.uid() = user_id);

-- Add created_by column to all compendium tables (null = official data)
ALTER TABLE public.spells ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE public.monsters ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE public.magic_items ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE public.wa_creatures ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT NULL;

-- Allow authenticated users to INSERT their own custom entries
CREATE POLICY "Users can create custom spells" ON public.spells FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their custom spells" ON public.spells FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their custom spells" ON public.spells FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can create custom monsters" ON public.monsters FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their custom monsters" ON public.monsters FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their custom monsters" ON public.monsters FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can create custom items" ON public.magic_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their custom items" ON public.magic_items FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their custom items" ON public.magic_items FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can create custom wa_creatures" ON public.wa_creatures FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their custom wa_creatures" ON public.wa_creatures FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their custom wa_creatures" ON public.wa_creatures FOR DELETE TO authenticated USING (auth.uid() = created_by);

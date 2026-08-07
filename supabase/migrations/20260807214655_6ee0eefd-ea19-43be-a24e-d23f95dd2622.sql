-- monsters
DROP POLICY IF EXISTS "Users can create custom monsters" ON public.monsters;
CREATE POLICY "Users can create custom monsters" ON public.monsters
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND (scope <> 'official' OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Users can update their custom monsters" ON public.monsters;
CREATE POLICY "Users can update their custom monsters" ON public.monsters
FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by AND (scope <> 'official' OR public.has_role(auth.uid(), 'admin')));

-- spells
DROP POLICY IF EXISTS "Users can create custom spells" ON public.spells;
CREATE POLICY "Users can create custom spells" ON public.spells
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND (scope <> 'official' OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Users can update their custom spells" ON public.spells;
CREATE POLICY "Users can update their custom spells" ON public.spells
FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by AND (scope <> 'official' OR public.has_role(auth.uid(), 'admin')));

-- magic_items
DROP POLICY IF EXISTS "Users can create custom items" ON public.magic_items;
CREATE POLICY "Users can create custom items" ON public.magic_items
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND (scope <> 'official' OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Users can update their custom items" ON public.magic_items;
CREATE POLICY "Users can update their custom items" ON public.magic_items
FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by AND (scope <> 'official' OR public.has_role(auth.uid(), 'admin')));
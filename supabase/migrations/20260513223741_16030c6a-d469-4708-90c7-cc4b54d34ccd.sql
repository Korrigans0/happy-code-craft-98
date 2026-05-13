-- Roles enum + table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check role (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Users can read their own roles; admins can read all
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extend Aetheria bestiary policies so admins can moderate
DROP POLICY IF EXISTS "Admins can read all aetheria creatures" ON public.aetheria_creatures;
CREATE POLICY "Admins can read all aetheria creatures" ON public.aetheria_creatures
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update aetheria creatures" ON public.aetheria_creatures;
CREATE POLICY "Admins can update aetheria creatures" ON public.aetheria_creatures
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete aetheria creatures" ON public.aetheria_creatures;
CREATE POLICY "Admins can delete aetheria creatures" ON public.aetheria_creatures
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Seed: grant admin to the requested account
INSERT INTO public.user_roles (user_id, role)
VALUES ('8647447c-0c5f-4f82-9696-0f1291b13216', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

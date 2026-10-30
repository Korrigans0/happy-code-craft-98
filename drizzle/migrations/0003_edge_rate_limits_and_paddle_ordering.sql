-- Ordering guard for Paddle webhooks: remember the provider's last update time
-- so a late, older subscription event can never overwrite a newer state.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paddle_updated_at timestamptz;

-- Fixed-window request counters used by public / costly backend functions.
CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, window_start)
);
GRANT ALL ON public.edge_rate_limits TO service_role;
REVOKE ALL ON public.edge_rate_limits FROM anon, authenticated;
ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (backend functions) can read or write.

CREATE OR REPLACE FUNCTION public.consume_edge_rate_limit(_bucket text, _max integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _start timestamptz;
  _hits integer;
BEGIN
  IF _bucket IS NULL OR length(_bucket) = 0 OR length(_bucket) > 200 OR _max < 1 OR _window_seconds < 1 THEN
    RETURN false;
  END IF;
  _start := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds);

  INSERT INTO public.edge_rate_limits AS r (bucket, window_start, hits)
  VALUES (_bucket, _start, 1)
  ON CONFLICT (bucket, window_start)
  DO UPDATE SET hits = r.hits + 1, updated_at = now()
  RETURNING hits INTO _hits;

  -- Opportunistic cleanup of expired windows (about 1 call in 50).
  IF random() < 0.02 THEN
    DELETE FROM public.edge_rate_limits WHERE window_start < now() - interval '2 days';
  END IF;

  RETURN _hits <= _max;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_edge_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_edge_rate_limit(text, integer, integer) TO service_role;
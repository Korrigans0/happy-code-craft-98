// Shared fixed-window request limiter backed by public.consume_edge_rate_limit.
// Used by public or costly functions (bug reports, AI) to stop spam and abusive cost.
import { createClient } from 'npm:@supabase/supabase-js@2'

export interface RateLimitRule {
  /** Unique bucket name, e.g. `ai:mj-assistant:user:<uuid>`. */
  bucket: string
  max: number
  windowSeconds: number
}

let adminClient: ReturnType<typeof createClient> | null = null
const admin = () => {
  if (!adminClient) {
    adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
  }
  return adminClient
}

/**
 * Returns true when every rule still has room. Fails open on a counter error so an
 * infrastructure hiccup never blocks legitimate users; the error is logged.
 */
export async function withinRateLimits(rules: RateLimitRule[]): Promise<boolean> {
  for (const rule of rules) {
    const { data, error } = await admin().rpc('consume_edge_rate_limit', {
      _bucket: rule.bucket.slice(0, 200),
      _max: rule.max,
      _window_seconds: rule.windowSeconds,
    })
    if (error) {
      console.error('Rate limit check failed', { bucket: rule.bucket, code: error.code })
      continue
    }
    if (data === false) return false
  }
  return true
}

/** Best-effort client IP from the edge proxy headers. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for') ?? ''
  const first = forwarded.split(',')[0]?.trim()
  return first || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown'
}

export const HOUR = 60 * 60
export const DAY = 24 * HOUR

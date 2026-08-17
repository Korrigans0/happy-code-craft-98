// Shared helpers for session e-mail notifications (creation, reschedule, D-1 reminder).
// All sending goes through the `send-transactional-email` function with the
// service-role key, and every attempt is recorded in `session_email_notifications`
// so a given (session, user, kind) can only ever be delivered once.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const APP_TIMEZONE = 'Europe/Paris'
export const SITE_URL = 'https://aetheriavtt.com'

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: APP_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatTime(iso: string): string {
  const t = new Intl.DateTimeFormat('fr-FR', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
  return `${t} (heure de Paris)`
}

export interface Recipient {
  userId: string
  email: string
  name: string
  role: string
}

/**
 * Resolve the deliverable recipients of a campaign: real campaign members only,
 * with a confirmed account, a valid e-mail, not banned and not soft-deleted.
 */
export async function getCampaignRecipients(
  admin: SupabaseClient,
  campaignId: string,
): Promise<Recipient[]> {
  const { data: members, error } = await admin
    .from('campaign_members')
    .select('user_id, role')
    .eq('campaign_id', campaignId)
  if (error) throw new Error(`members lookup failed: ${error.message}`)

  const profileMap = new Map<string, string>()
  const ids = (members ?? []).map((m) => m.user_id)
  if (ids.length) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', ids)
    for (const p of profiles ?? []) {
      if (p.display_name) profileMap.set(p.user_id, p.display_name)
    }
  }

  const recipients: Recipient[] = []
  for (const m of members ?? []) {
    const { data, error: userErr } = await admin.auth.admin.getUserById(m.user_id)
    const u = data?.user as any
    if (userErr || !u) continue
    if (u.deleted_at) continue
    if (u.banned_until && new Date(u.banned_until) > new Date()) continue
    const email = (u.email ?? '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue
    if (u.is_anonymous) continue
    recipients.push({
      userId: m.user_id,
      email,
      name: profileMap.get(m.user_id) || u.user_metadata?.display_name || email.split('@')[0],
      role: m.role,
    })
  }
  return recipients
}

async function sendEmail(
  templateName: string,
  recipientEmail: string,
  idempotencyKey: string,
  templateData: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-transactional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ templateName, recipientEmail, idempotencyKey, templateData }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`[${res.status}] ${body}`)
  }
}

export interface DispatchResult {
  sent: number
  failed: number
  skipped: number
  details: Array<{ email: string; status: string; error?: string }>
}

/**
 * Send `templateName` to every recipient, claiming a row in
 * `session_email_notifications` first so duplicates are impossible even under
 * concurrent invocations. Individual failures never abort the batch.
 */
export async function dispatch(
  admin: SupabaseClient,
  opts: {
    sessionId: string
    campaignId: string
    kind: 'created' | 'reminder' | 'rescheduled'
    templateName: string
    recipients: Recipient[]
    templateData: (r: Recipient) => Record<string, unknown>
  },
): Promise<DispatchResult> {
  const result: DispatchResult = { sent: 0, failed: 0, skipped: 0, details: [] }
  const once = opts.kind === 'created' || opts.kind === 'reminder'

  for (const r of opts.recipients) {
    let claimId: string | null = null
    if (once) {
      const { data, error } = await admin
        .from('session_email_notifications')
        .insert({
          session_id: opts.sessionId,
          campaign_id: opts.campaignId,
          user_id: r.userId,
          recipient_email: r.email,
          kind: opts.kind,
          status: 'pending',
        })
        .select('id')
        .single()
      if (error) {
        // Unique violation => already sent (or being sent) for this recipient.
        result.skipped++
        result.details.push({ email: r.email, status: 'already_sent' })
        continue
      }
      claimId = data.id
    }

    try {
      await sendEmail(
        opts.templateName,
        r.email,
        `session-${opts.kind}-${opts.sessionId}-${r.userId}`,
        opts.templateData(r),
      )
      result.sent++
      result.details.push({ email: r.email, status: 'sent' })
      if (claimId) {
        await admin
          .from('session_email_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', claimId)
      } else {
        await admin.from('session_email_notifications').insert({
          session_id: opts.sessionId,
          campaign_id: opts.campaignId,
          user_id: r.userId,
          recipient_email: r.email,
          kind: opts.kind,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('session notification failed', { email: r.email, kind: opts.kind, message })
      result.failed++
      result.details.push({ email: r.email, status: 'failed', error: message })
      if (claimId) {
        // Release the claim so a later attempt can retry this recipient.
        await admin.from('session_email_notifications').delete().eq('id', claimId)
        await admin.from('session_email_notifications').insert({
          session_id: opts.sessionId,
          campaign_id: opts.campaignId,
          user_id: r.userId,
          recipient_email: r.email,
          kind: `${opts.kind}_failed`,
          status: 'failed',
          error_message: message.slice(0, 500),
        })
      }
    }
  }
  return result
}

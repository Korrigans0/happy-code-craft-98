// Sends the "session scheduled" (or "session rescheduled") e-mail to every
// member of the campaign. Only the GM of that very campaign can trigger it.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import {
  SITE_URL,
  dispatch,
  formatDate,
  formatTime,
  getCampaignRecipients,
  serviceClient,
} from '../_shared/session-notifications.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims?.sub) return json({ error: 'Unauthorized' }, 401)
    const callerId = claimsData.claims.sub as string

    let body: any
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400)
    }
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''
    const kind: 'created' | 'rescheduled' = body?.kind === 'rescheduled' ? 'rescheduled' : 'created'
    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return json({ error: 'sessionId is required' }, 400)

    const admin = serviceClient()

    const { data: session, error: sessionError } = await admin
      .from('campaign_sessions')
      .select('id, campaign_id, title, description, scheduled_at, session_number')
      .eq('id', sessionId)
      .maybeSingle()
    if (sessionError) return json({ error: 'Session lookup failed' }, 500)
    if (!session) return json({ error: 'Session not found' }, 404)

    // Authorization: caller must be GM of the campaign owning this session.
    const { data: isGm } = await admin.rpc('is_campaign_gm', {
      _user_id: callerId,
      _campaign_id: session.campaign_id,
    })
    if (!isGm) return json({ error: 'Forbidden' }, 403)

    if (!session.scheduled_at) {
      return json({ success: false, reason: 'no_schedule', sent: 0 })
    }

    const { data: campaign } = await admin
      .from('campaigns')
      .select('id, title, user_id')
      .eq('id', session.campaign_id)
      .maybeSingle()

    const recipients = await getCampaignRecipients(admin, session.campaign_id)
    const gm = recipients.find((r) => r.userId === campaign?.user_id || r.role === 'gm')
    const players = recipients.filter((r) => r.role !== 'gm')

    const result = await dispatch(admin, {
      sessionId: session.id,
      campaignId: session.campaign_id,
      kind,
      templateName: 'session-scheduled',
      recipients: players,
      templateData: () => ({
        campaignName: campaign?.title ?? 'Votre campagne',
        sessionTitle: session.title ?? `Session ${session.session_number ?? ''}`.trim(),
        sessionDate: formatDate(session.scheduled_at as string),
        sessionTime: formatTime(session.scheduled_at as string),
        gmName: gm?.name ?? 'Votre Maître du Jeu',
        description: session.description ?? '',
        campaignUrl: `${SITE_URL}/campaigns/${session.campaign_id}`,
        siteUrl: SITE_URL,
        siteName: 'Aetheria VTT',
        rescheduled: kind === 'rescheduled',
      }),
    })

    return json({ success: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('notify-session error', message)
    return json({ error: 'Notification failed', details: message }, 500)
  }
})

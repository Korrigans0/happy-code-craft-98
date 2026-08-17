// Cron-driven D-1 reminders: finds every upcoming session starting within the
// next 24 hours and mails all its participants (players + GM) exactly once.
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

  // Only the cron job / service role may run this (verify_jwt = true handles the check).
  try {
    const admin = serviceClient()
    const now = new Date()
    const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: sessions, error } = await admin
      .from('campaign_sessions')
      .select('id, campaign_id, title, description, scheduled_at, session_number, completed_at')
      .is('completed_at', null)
      .gt('scheduled_at', now.toISOString())
      .lte('scheduled_at', horizon.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(200)
    if (error) return json({ error: error.message }, 500)

    let totalSent = 0
    let totalFailed = 0
    let totalSkipped = 0

    for (const session of sessions ?? []) {
      try {
        const { data: campaign } = await admin
          .from('campaigns')
          .select('id, title, user_id')
          .eq('id', session.campaign_id)
          .maybeSingle()

        const recipients = await getCampaignRecipients(admin, session.campaign_id)
        if (!recipients.length) continue
        const gm = recipients.find((r) => r.userId === campaign?.user_id || r.role === 'gm')
        const participantNames = recipients.map((r) => r.name)

        const result = await dispatch(admin, {
          sessionId: session.id,
          campaignId: session.campaign_id,
          kind: 'reminder',
          templateName: 'session-reminder',
          recipients, // players AND GM
          templateData: () => ({
            campaignName: campaign?.title ?? 'Votre campagne',
            sessionTitle: session.title ?? `Session ${session.session_number ?? ''}`.trim(),
            sessionDate: formatDate(session.scheduled_at as string),
            sessionTime: formatTime(session.scheduled_at as string),
            gmName: gm?.name ?? 'Votre Maître du Jeu',
            participants: participantNames,
            campaignUrl: `${SITE_URL}/campaigns/${session.campaign_id}`,
            siteUrl: SITE_URL,
            siteName: 'Aetheria VTT',
          }),
        })
        totalSent += result.sent
        totalFailed += result.failed
        totalSkipped += result.skipped
      } catch (e) {
        console.error('reminder failed for session', session.id, e instanceof Error ? e.message : e)
        totalFailed++
      }
    }

    return json({
      success: true,
      sessions: sessions?.length ?? 0,
      sent: totalSent,
      failed: totalFailed,
      skipped: totalSkipped,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('session-reminders error', message)
    return json({ error: message }, 500)
  }
})

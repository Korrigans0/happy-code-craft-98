// Sends one campaign invitation e-mail to one recipient.
// The caller must be the authenticated Game Master of the campaign; the
// campaign name and invite code are read from the database, never from the client.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmailWithLog } from '../_shared/transactional-email-templates/send-and-log.ts'

const SITE_URL = 'https://aetheriavtt.com'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server configuration error' }, 500)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: userData } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
  const user = userData?.user
  if (!user) return json({ error: 'Unauthorized' }, 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const campaignId = String(body.campaignId ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 255)
  if (!campaignId) return json({ error: 'campaignId est requis' }, 400)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Adresse e-mail invalide' }, 400)
  }

  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id, title, invite_code, user_id')
    .eq('id', campaignId)
    .maybeSingle()

  if (campaignError || !campaign) return json({ error: 'Campagne introuvable' }, 404)
  if (campaign.user_id !== user.id) return json({ error: 'Accès refusé' }, 403)
  if (!campaign.invite_code) {
    return json({ error: "Aucun code d'invitation disponible pour cette campagne." }, 400)
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const inviterName =
    profile?.display_name ||
    (user.user_metadata as { display_name?: string } | null)?.display_name ||
    user.email?.split('@')[0] ||
    'Un MJ'

  try {
    const result = await sendTemplateEmailWithLog('campaign-invitation', email, {
      idempotencyKey: `campaign-invite-${campaignId}-${email}`,
      templateData: {
        inviterName,
        campaignName: campaign.title ?? 'une campagne',
        inviteCode: campaign.invite_code,
        joinUrl: `${SITE_URL}/join/${campaign.invite_code}`,
      },
    })
    if (!result.sent) {
      return json({ error: "Cette adresse ne peut plus recevoir d'e-mails." }, 200)
    }
  } catch (error) {
    console.error('Campaign invitation email failed', error)
    return json({ error: "L'invitation n'a pas pu être envoyée" }, 502)
  }

  return json({ success: true })
})

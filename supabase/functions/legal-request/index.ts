import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmailWithLog } from '../_shared/transactional-email-templates/send-and-log.ts'

const TYPES: Record<string, string> = { withdrawal: 'Rétractation', 'data-rights': 'Droits RGPD', 'content-report': 'Signalement de contenu', 'account-deletion': 'Suppression de compte' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'Requête invalide' }, 400) }
  const type = clean(body.type, 40)
  const name = clean(body.name, 120)
  const email = clean(body.email, 255)
  const subject = clean(body.subject, 160)
  const message = clean(body.message, 4000)
  const pageUrl = clean(body.pageUrl, 2000)
  if (!TYPES[type] || name.length < 2 || subject.length < 2 || message.length < 10 || body.confirmed !== true) return json({ error: 'Champs invalides' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Adresse e-mail invalide' }, 400)
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ error: 'Configuration indisponible' }, 500)
  const admin = createClient(url, key)
  let userId: string | null = null
  const auth = req.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) {
    const { data } = await admin.auth.getUser(auth.slice(7))
    userId = data.user?.id ?? null
  }
  const reference = `LEG-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const { data: row, error } = await admin.from('legal_requests').insert({ reference, request_type: type, user_id: userId, requester_name: name, requester_email: email, subject, message, page_url: pageUrl, user_agent: clean(req.headers.get('user-agent'), 500) }).select('id').single()
  if (error || !row) return json({ error: "Impossible d'enregistrer la demande" }, 500)
  try {
    const result = await sendTemplateEmailWithLog('legal-request', '', { idempotencyKey: `legal-request-${row.id}`, replyTo: email, templateData: { typeLabel: TYPES[type], reference, name, email, subject, message, pageUrl } })
    if (!result.sent) throw new Error('recipient suppressed')
    await admin.from('legal_requests').update({ email_status: 'sent' }).eq('id', row.id)
  } catch {
    await admin.from('legal_requests').update({ email_status: 'failed' }).eq('id', row.id)
    return json({ error: "La demande n'a pas pu être transmise" }, 502)
  }
  return json({ success: true, reference })
})
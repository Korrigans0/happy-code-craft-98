// Receives a bug report from the site (any page, authenticated or not),
// stores it, uploads an optional screenshot and e-mails the site owner.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmailWithLog } from '../_shared/transactional-email-templates/send-and-log.ts'

const MAX_DESCRIPTION = 4000
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024 // 4 MB decoded
const TYPES = ['bug', 'display', 'feature', 'other'] as const
const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  display: "Problème d'affichage",
  feature: 'Fonctionnalité qui ne fonctionne pas',
  other: 'Autre',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mime: string } | null {
  const match = /^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/i.exec(dataUrl.trim())
  if (!match) return null
  try {
    const binary = atob(match[3])
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return { bytes, mime: match[1].toLowerCase() }
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server configuration error' }, 500)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const problemType = String(body.problemType ?? 'other').trim()
  if (!TYPES.includes(problemType as (typeof TYPES)[number])) {
    return json({ error: 'Type de problème invalide' }, 400)
  }

  const description = String(body.description ?? '').trim()
  if (!description) return json({ error: 'La description est obligatoire' }, 400)
  if (description.length > MAX_DESCRIPTION) {
    return json({ error: 'Description trop longue' }, 400)
  }

  const reporterEmail = String(body.reporterEmail ?? '').trim().slice(0, 255)
  if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
    return json({ error: 'Adresse e-mail invalide' }, 400)
  }

  const pageUrl = String(body.pageUrl ?? '').trim().slice(0, 2000)
  const userAgent = String(body.userAgent ?? req.headers.get('user-agent') ?? '').slice(0, 500)
  const platform = String(body.platform ?? '').slice(0, 200)
  const screenSize = String(body.screenSize ?? '').slice(0, 100)
  const language = String(body.language ?? '').slice(0, 50)

  const admin = createClient(supabaseUrl, serviceKey)

  // Identify the reporter when a session is provided (optional).
  let userId: string | null = null
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { data } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
      userId = data.user?.id ?? null
    } catch {
      userId = null
    }
  }

  // Optional screenshot -> storage
  let screenshotUrl = ''
  const rawScreenshot = typeof body.screenshot === 'string' ? body.screenshot : ''
  if (rawScreenshot) {
    const decoded = decodeDataUrl(rawScreenshot)
    if (!decoded) return json({ error: "Format d'image non supporté" }, 400)
    if (decoded.bytes.byteLength > MAX_SCREENSHOT_BYTES) {
      return json({ error: 'Capture trop volumineuse (max 4 Mo)' }, 400)
    }
    const ext = decoded.mime.split('/')[1] === 'jpeg' ? 'jpg' : decoded.mime.split('/')[1]
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await admin.storage
      .from('bug-screenshots')
      .upload(path, decoded.bytes, { contentType: decoded.mime, upsert: false })
    if (uploadError) {
      console.error('Screenshot upload failed', uploadError)
    } else {
      // Private bucket: share a long-lived signed link in the notification e-mail.
      const { data: signed } = await admin.storage
        .from('bug-screenshots')
        .createSignedUrl(path, 60 * 60 * 24 * 365)
      screenshotUrl = signed?.signedUrl ?? ''
    }
  }

  const reportedAtIso = new Date().toISOString()
  const reportedAt = new Intl.DateTimeFormat('fr-BE', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Brussels',
  }).format(new Date(reportedAtIso))

  const { data: inserted, error: insertError } = await admin
    .from('bug_reports')
    .insert({
      user_id: userId,
      problem_type: problemType,
      description,
      page_url: pageUrl,
      user_agent: userAgent,
      platform,
      screen_size: screenSize,
      language,
      reporter_email: reporterEmail || null,
      screenshot_url: screenshotUrl || null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Failed to store bug report', insertError)
    return json({ error: "Impossible d'enregistrer le signalement" }, 500)
  }

  // Send the notification e-mail. Success is only reported when the mail is accepted.
  try {
    const result = await sendTemplateEmailWithLog('bug-report', '', {
      idempotencyKey: `bug-report-${inserted.id}`,
      templateData: {
        problemType: TYPE_LABELS[problemType],
        description,
        pageUrl,
        reportedAt,
        userAgent,
        platform,
        screenSize,
        language,
        reporterEmail,
        screenshotUrl,
        siteName: 'Aetheria VTT',
      },
    })
    if (!result.sent) {
      console.warn('Bug report recipient is suppressed')
      await admin.from('bug_reports').update({ email_status: 'failed' }).eq('id', inserted.id)
      return json({ error: "Le signalement n'a pas pu être transmis" }, 502)
    }
  } catch (error) {
    console.error('Bug report email failed', error)
    await admin.from('bug_reports').update({ email_status: 'failed' }).eq('id', inserted.id)
    return json({ error: "Le signalement n'a pas pu être transmis" }, 502)
  }

  await admin.from('bug_reports').update({ email_status: 'sent' }).eq('id', inserted.id)
  return json({ success: true, id: inserted.id })
})

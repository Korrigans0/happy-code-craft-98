// Sends a registered template through Lovable's managed email API and records
// the outcome in the project's `email_send_log` table (notification/history
// only — it never gates a send).
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  sendTemplateEmail,
  type SendTemplateEmailOptions,
  type SendTemplateEmailResult,
} from './send-email.ts'

function logClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

async function writeLog(row: {
  template_name: string
  recipient_email: string
  status: 'sent' | 'suppressed' | 'failed'
  error_message?: string
}): Promise<void> {
  const { error } = await logClient().from('email_send_log').insert({
    message_id: null,
    template_name: row.template_name,
    recipient_email: row.recipient_email,
    status: row.status,
    error_message: row.error_message ?? null,
  })
  if (error) {
    console.error('Failed to write email_send_log row', {
      code: error.code,
      message: error.message,
      status: row.status,
    })
  }
}

/**
 * Same contract as `sendTemplateEmail`, plus an `email_send_log` row for each
 * outcome. Throws on real send failures after logging them.
 */
export async function sendTemplateEmailWithLog(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  try {
    const result = await sendTemplateEmail(templateName, to, options)
    await writeLog({
      template_name: templateName,
      recipient_email: to,
      status: result.sent ? 'sent' : 'suppressed',
    })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await writeLog({
      template_name: templateName,
      recipient_email: to,
      status: 'failed',
      error_message: message.slice(0, 500),
    })
    throw error
  }
}

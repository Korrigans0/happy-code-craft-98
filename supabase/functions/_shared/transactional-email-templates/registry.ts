import type { ComponentType } from 'npm:react@18.3.1'
import { template as campaignInvitation } from './campaign-invitation.tsx'
import { template as sessionScheduled } from './session-scheduled.tsx'
import { template as sessionReminder } from './session-reminder.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string | ((data: any) => string)
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'campaign-invitation': campaignInvitation,
  'session-scheduled': sessionScheduled,
  'session-reminder': sessionReminder,
}

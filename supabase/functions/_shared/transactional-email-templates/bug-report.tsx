/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  problemType?: string
  description?: string
  pageUrl?: string
  reportedAt?: string
  userAgent?: string
  platform?: string
  screenSize?: string
  language?: string
  reporterEmail?: string
  screenshotUrl?: string
  siteName?: string
}

const OWNER_EMAIL = 'korrigans125@gmail.com'

const Row = ({ label, value }: { label: string; value?: string }) => (
  <Section style={row}>
    <Text style={rowLabel}>{label}</Text>
    <Text style={rowValue}>{value && value.trim() ? value : '—'}</Text>
  </Section>
)

const Email = ({
  problemType = 'Bug',
  description = '',
  pageUrl = '',
  reportedAt = '',
  userAgent = '',
  platform = '',
  screenSize = '',
  language = '',
  reporterEmail = '',
  screenshotUrl = '',
  siteName = 'Aetheria VTT',
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>{`Nouveau signalement : ${problemType}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>🐛 Nouveau signalement</Heading>
          <Text style={text}>Un utilisateur vient de signaler un problème sur {siteName}.</Text>

          <Row label="Type de problème" value={problemType} />
          <Row label="Description" value={description} />
          <Row label="Page concernée" value={pageUrl} />
          <Row label="Date et heure" value={reportedAt} />
          <Row label="Navigateur / appareil" value={userAgent} />
          <Row label="Plateforme" value={platform} />
          <Row label="Écran" value={screenSize} />
          <Row label="Langue" value={language} />
          <Row label="E-mail de contact" value={reporterEmail} />

          {screenshotUrl ? (
            <Section style={{ marginTop: '20px' }}>
              <Text style={rowLabel}>Capture d'écran</Text>
              <Link href={screenshotUrl} style={link}>{screenshotUrl}</Link>
              <Img src={screenshotUrl} alt="Capture d'écran du signalement" style={shot} />
            </Section>
          ) : null}
        </Section>
        <Text style={brand}>{siteName} — Signalements</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `🐛 Signalement Aetheria — ${d?.problemType ?? 'Bug'}`,
  displayName: 'Signalement de bug',
  to: OWNER_EMAIL,
  previewData: {
    problemType: 'Bug',
    description: "Le bouton de sauvegarde ne répond pas.",
    pageUrl: 'https://aetheriavtt.com/characters',
    reportedAt: '02/09/2026 13:12',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128',
    platform: 'MacIntel',
    screenSize: '1440x900 (dpr 2)',
    language: 'fr-BE',
    reporterEmail: 'joueur@example.com',
    siteName: 'Aetheria VTT',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', padding: '24px 0' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '0 16px' }
const card = { background: 'linear-gradient(180deg, #0f172a 0%, #111d33 100%)', border: '1px solid rgba(212,164,53,0.25)', borderRadius: '12px', padding: '28px 24px', color: '#f5e9c8' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#d4a435', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#e6dcc0', lineHeight: '1.6', margin: '0 0 20px' }
const row = { borderTop: '1px solid rgba(212,164,53,0.18)', padding: '10px 0' }
const rowLabel = { fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#9c8f6a', margin: '0 0 4px' }
const rowValue = { fontSize: '15px', color: '#f5e9c8', margin: 0, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const }
const link = { color: '#d4a435', textDecoration: 'underline', fontSize: '13px', wordBreak: 'break-all' as const }
const shot = { width: '100%', borderRadius: '8px', marginTop: '12px', border: '1px solid rgba(212,164,53,0.25)' }
const brand = { textAlign: 'center' as const, fontSize: '12px', color: '#9c8f6a', marginTop: '16px' }

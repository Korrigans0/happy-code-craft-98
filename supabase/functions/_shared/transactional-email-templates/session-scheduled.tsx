/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  campaignName?: string
  sessionTitle?: string
  sessionDate?: string
  sessionTime?: string
  gmName?: string
  description?: string
  campaignUrl?: string
  siteUrl?: string
  siteName?: string
  rescheduled?: boolean
}

const SITE_URL = 'https://aetheriavtt.com'

const Email = ({
  campaignName = 'votre campagne',
  sessionTitle = 'une session',
  sessionDate = 'prochainement',
  sessionTime = '—',
  gmName = 'Votre Maître du Jeu',
  description = '',
  campaignUrl = SITE_URL,
  siteUrl = SITE_URL,
  siteName = 'Aetheria VTT',
  rescheduled = false,
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>
      {rescheduled ? 'Changement de date' : 'Nouvelle session programmée'} — {campaignName} · {sessionDate}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={`${siteUrl}/aetheria-logo.png`} width="64" height="64" alt={siteName} style={logo} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>
            {rescheduled ? 'La session a été déplacée' : 'Une nouvelle session vous attend'}
          </Heading>
          <Text style={text}>
            <strong style={accent}>{gmName}</strong>{' '}
            {rescheduled ? 'a modifié la date de la session' : 'a programmé une nouvelle session'} pour la campagne{' '}
            <strong style={accent}>{campaignName}</strong>.
          </Text>

          <Section style={detailBox}>
            <Text style={detailRow}><span style={detailLabel}>Campagne</span> {campaignName}</Text>
            <Text style={detailRow}><span style={detailLabel}>Session</span> {sessionTitle}</Text>
            <Text style={detailRow}><span style={detailLabel}>Date</span> {sessionDate}</Text>
            <Text style={detailRow}><span style={detailLabel}>Heure</span> {sessionTime}</Text>
            <Text style={detailRowLast}><span style={detailLabel}>Maître du Jeu</span> {gmName}</Text>
          </Section>

          {description ? <Text style={quote}>{description}</Text> : null}

          <Section style={{ textAlign: 'center', margin: '32px 0 8px' }}>
            <Button style={button} href={campaignUrl}>Voir la campagne</Button>
          </Section>

          <Text style={footer}>
            Un rappel automatique vous sera envoyé la veille de la session.{' '}
            <Link href={siteUrl} style={link}>{siteName}</Link>
          </Text>
        </Section>
        <Text style={brand}>{siteName} — Votre table de jeu virtuelle</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) =>
    d?.rescheduled
      ? `Session déplacée — ${d?.campaignName ?? 'votre campagne'} le ${d?.sessionDate ?? ''}`
      : `Nouvelle session — ${d?.campaignName ?? 'votre campagne'} le ${d?.sessionDate ?? ''}`,
  displayName: 'Session programmée',
  previewData: {
    campaignName: "Les Brumes d'Aetheria",
    sessionTitle: 'Session 3 — La Faille Obscure',
    sessionDate: 'samedi 22 août 2026',
    sessionTime: '20:30 (Europe/Paris)',
    gmName: 'Korrigans',
    description: 'Préparez vos personnages, la descente commence.',
    campaignUrl: SITE_URL,
    siteUrl: SITE_URL,
    siteName: 'Aetheria VTT',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '16px 0' }
const logo = { display: 'inline-block', borderRadius: '50%' }
const card = { background: 'linear-gradient(180deg, #0f172a 0%, #16123a 100%)', border: '1px solid rgba(212,164,53,0.25)', borderRadius: '12px', padding: '32px 28px', color: '#f5e9c8' }
const h1 = { fontSize: '23px', fontWeight: 'bold' as const, color: '#d4a435', margin: '0 0 16px', letterSpacing: '0.5px' }
const text = { fontSize: '15px', color: '#e6dcc0', lineHeight: '1.6', margin: '0 0 18px' }
const accent = { color: '#d4a435' }
const detailBox = { background: 'rgba(124,92,255,0.10)', border: '1px solid rgba(124,92,255,0.30)', borderRadius: '10px', padding: '16px 18px', margin: '8px 0 4px' }
const detailRow = { fontSize: '14px', color: '#f0e6cc', margin: '0 0 8px', lineHeight: '1.5' }
const detailRowLast = { ...detailRow, margin: '0' }
const detailLabel = { color: '#a79bd6', display: 'inline-block', minWidth: '120px', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const quote = { fontSize: '14px', color: '#cbbf9f', fontStyle: 'italic' as const, borderLeft: '3px solid rgba(212,164,53,0.5)', padding: '4px 0 4px 12px', margin: '18px 0 0' }
const button = { background: 'linear-gradient(135deg, #d4a435 0%, #b8862a 100%)', color: '#0f172a', fontWeight: 'bold' as const, fontSize: '15px', borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const link = { color: '#d4a435', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#9c8f6a', textAlign: 'center' as const, margin: '16px 0 0' }
const brand = { fontSize: '12px', color: '#8b8b8b', textAlign: 'center' as const, margin: '18px 0 0' }

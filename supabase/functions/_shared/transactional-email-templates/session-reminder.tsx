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
  participants?: string[]
  campaignUrl?: string
  siteUrl?: string
  siteName?: string
}

const SITE_URL = 'https://aetheriavtt.com'

const Email = ({
  campaignName = 'votre campagne',
  sessionTitle = 'une session',
  sessionDate = 'demain',
  sessionTime = '—',
  gmName = 'Votre Maître du Jeu',
  participants = [],
  campaignUrl = SITE_URL,
  siteUrl = SITE_URL,
  siteName = 'Aetheria VTT',
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre session d'Aetheria est demain — {campaignName} à {sessionTime}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={`${siteUrl}/aetheria-logo.png`} width="64" height="64" alt={siteName} style={logo} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Votre session d'Aetheria est demain !</Heading>
          <Text style={text}>
            Affûtez vos lames et rechargez vos sorts : l'aventure reprend dans moins de 24 heures.
          </Text>

          <Section style={detailBox}>
            <Text style={detailRow}><span style={detailLabel}>Campagne</span> {campaignName}</Text>
            <Text style={detailRow}><span style={detailLabel}>Session</span> {sessionTitle}</Text>
            <Text style={detailRow}><span style={detailLabel}>Date</span> {sessionDate}</Text>
            <Text style={detailRow}><span style={detailLabel}>Heure</span> {sessionTime}</Text>
            <Text style={participants.length ? detailRow : detailRowLast}>
              <span style={detailLabel}>Maître du Jeu</span> {gmName}
            </Text>
            {participants.length ? (
              <Text style={detailRowLast}>
                <span style={detailLabel}>Participants</span> {participants.join(', ')}
              </Text>
            ) : null}
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0 8px' }}>
            <Button style={button} href={campaignUrl}>Rejoindre la campagne</Button>
          </Section>

          <Text style={footer}>
            À demain sur <Link href={siteUrl} style={link}>{siteName}</Link>.
          </Text>
        </Section>
        <Text style={brand}>{siteName} — Votre table de jeu virtuelle</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Demain : ${d?.sessionTitle ?? 'votre session'} — ${d?.campaignName ?? 'Aetheria'}`,
  displayName: 'Rappel de session (J-1)',
  previewData: {
    campaignName: "Les Brumes d'Aetheria",
    sessionTitle: 'Session 3 — La Faille Obscure',
    sessionDate: 'samedi 22 août 2026',
    sessionTime: '20:30 (Europe/Paris)',
    gmName: 'Korrigans',
    participants: ['Korrigans', 'Lyra', 'Thorn'],
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
const detailBox = { background: 'rgba(124,92,255,0.10)', border: '1px solid rgba(124,92,255,0.30)', borderRadius: '10px', padding: '16px 18px', margin: '8px 0 4px' }
const detailRow = { fontSize: '14px', color: '#f0e6cc', margin: '0 0 8px', lineHeight: '1.5' }
const detailRowLast = { ...detailRow, margin: '0' }
const detailLabel = { color: '#a79bd6', display: 'inline-block', minWidth: '120px', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const button = { background: 'linear-gradient(135deg, #d4a435 0%, #b8862a 100%)', color: '#0f172a', fontWeight: 'bold' as const, fontSize: '15px', borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const link = { color: '#d4a435', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#9c8f6a', textAlign: 'center' as const, margin: '16px 0 0' }
const brand = { fontSize: '12px', color: '#8b8b8b', textAlign: 'center' as const, margin: '18px 0 0' }

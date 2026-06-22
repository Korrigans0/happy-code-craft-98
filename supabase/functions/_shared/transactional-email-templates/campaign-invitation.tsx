/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  inviterName?: string
  campaignName?: string
  inviteCode?: string
  joinUrl?: string
  siteUrl?: string
  siteName?: string
}

const SITE_URL = 'https://aetheriavtt.com'

const Email = ({
  inviterName = 'Un Maître du Jeu',
  campaignName = 'sa campagne',
  inviteCode = 'CODE',
  joinUrl = `${SITE_URL}/join/CODE`,
  siteUrl = SITE_URL,
  siteName = 'Aetheria VTT',
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>{inviterName} vous invite à rejoindre {campaignName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={`${siteUrl}/aetheria-logo.png`} width="64" height="64" alt={siteName} style={logo} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Une invitation à l'aventure</Heading>
          <Text style={text}>
            <strong style={{ color: '#d4a435' }}>{inviterName}</strong> vous convie à rejoindre la campagne{' '}
            <strong style={{ color: '#d4a435' }}>{campaignName}</strong> sur {siteName}.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={joinUrl}>Rejoindre la campagne</Button>
          </Section>
          <Text style={codeLabel}>Ou utilisez ce code d'invitation :</Text>
          <Text style={codeStyle}>{inviteCode}</Text>
          <Text style={footer}>
            Pas de compte ? Vous pourrez en créer un en suivant le lien.{' '}
            <Link href={siteUrl} style={link}>Découvrir {siteName}</Link>.
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
    `${d?.inviterName ?? 'Un MJ'} vous invite sur Aetheria — ${d?.campaignName ?? 'campagne'}`,
  displayName: 'Invitation à une campagne',
  previewData: {
    inviterName: 'Korrigans',
    campaignName: 'Les Brumes d\'Aetheria',
    inviteCode: 'A1B2C3D4',
    joinUrl: 'https://aetheriavtt.com/join/A1B2C3D4',
    siteUrl: SITE_URL,
    siteName: 'Aetheria VTT',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '16px 0' }
const logo = { display: 'inline-block', borderRadius: '50%' }
const card = { background: 'linear-gradient(180deg, #0f172a 0%, #111d33 100%)', border: '1px solid rgba(212,164,53,0.25)', borderRadius: '12px', padding: '32px 28px', color: '#f5e9c8' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#d4a435', margin: '0 0 16px', letterSpacing: '0.5px' }
const text = { fontSize: '15px', color: '#e6dcc0', lineHeight: '1.6', margin: '0 0 18px' }
const link = { color: '#d4a435', textDecoration: 'underline' }
const button = { background: 'linear-gradient(135deg, #d4a435 0%, #b8862a 100%)', color: '#0f172a', fontWeight: 'bold' as const, fontSize: '15px', borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const codeLabel = { fontSize: '13px', color: '#9c8f6a', textAlign: 'center' as const, margin: '20px 0 4px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '24px', fontWeight: 'bold' as const, color: '#d4a435', letterSpacing: '6px', textAlign: 'center' as const, margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#9c8f6a', margin: '24px 0 0', textAlign: 'center' as const }
const brand = { fontSize: '11px', color: '#8a8a8a', textAlign: 'center' as const, margin: '20px 0 0', letterSpacing: '1px' }

/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface Props { siteName: string; siteUrl?: string; oldEmail: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ siteName, siteUrl = '#', oldEmail, newEmail, confirmationUrl }: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirmez le changement d'email {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={`${siteUrl}/aetheria-logo.png`} width="64" height="64" alt={siteName} style={logo} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Confirmer le changement d'email</Heading>
          <Text style={text}>
            Vous avez demandé à changer votre adresse email {siteName} de{' '}
            <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link>{' '}
            vers <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={confirmationUrl}>Confirmer le changement</Button>
          </Section>
          <Text style={footer}>Si vous n'êtes pas à l'origine de cette demande, sécurisez votre compte immédiatement.</Text>
        </Section>
        <Text style={brand}>{siteName} — Votre table de jeu virtuelle</Text>
      </Container>
    </Body>
  </Html>
)
export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '16px 0' }
const logo = { display: 'inline-block', borderRadius: '50%' }
const card = { background: 'linear-gradient(180deg, #0f172a 0%, #111d33 100%)', border: '1px solid rgba(212,164,53,0.25)', borderRadius: '12px', padding: '32px 28px', color: '#f5e9c8' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#d4a435', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#e6dcc0', lineHeight: '1.6', margin: '0 0 18px' }
const link = { color: '#d4a435', textDecoration: 'underline' }
const button = { background: 'linear-gradient(135deg, #d4a435 0%, #b8862a 100%)', color: '#0f172a', fontWeight: 'bold' as const, fontSize: '15px', borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#9c8f6a', margin: '24px 0 0' }
const brand = { fontSize: '11px', color: '#8a8a8a', textAlign: 'center' as const, margin: '20px 0 0', letterSpacing: '1px' }

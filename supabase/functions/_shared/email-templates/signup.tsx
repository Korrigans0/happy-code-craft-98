/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirmez votre adresse pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={`${siteUrl}/aetheria-logo.png`} width="64" height="64" alt={siteName} style={logo} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Bienvenue dans l'aventure</Heading>
          <Text style={text}>
            Merci d'avoir créé un compte sur{' '}
            <Link href={siteUrl} style={link}>
              <strong style={gold}>{siteName}</strong>
            </Link>{' '}
            avec l'adresse <strong style={gold}>{recipient}</strong>.
          </Text>
          <Text style={text}>
            Confirmez votre adresse e-mail pour ouvrir les portes de votre table de jeu.
          </Text>
          <Section style={center}>
            <Button style={button} href={confirmationUrl}>Confirmer mon adresse</Button>
          </Section>
          <Text style={footer}>
            Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer ce message.
          </Text>
        </Section>
        <Text style={brand}>{siteName} — Votre table de jeu virtuelle</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '16px 0' }
const logo = { display: 'inline-block', borderRadius: '50%' }
const card = { background: 'linear-gradient(180deg, #0f172a 0%, #111d33 100%)', border: '1px solid rgba(212,164,53,0.25)', borderRadius: '12px', padding: '32px 28px', color: '#f5e9c8' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#d4a435', margin: '0 0 16px', letterSpacing: '0.5px' }
const text = { fontSize: '15px', color: '#e6dcc0', lineHeight: '1.6', margin: '0 0 18px' }
const gold = { color: '#d4a435' }
const link = { color: '#d4a435', textDecoration: 'underline' }
const center = { textAlign: 'center' as const, margin: '32px 0' }
const button = { background: 'linear-gradient(135deg, #d4a435 0%, #b8862a 100%)', color: '#0f172a', fontWeight: 'bold' as const, fontSize: '15px', borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#9c8f6a', margin: '24px 0 0' }
const brand = { textAlign: 'center' as const, fontSize: '12px', color: '#9c8f6a', marginTop: '16px' }

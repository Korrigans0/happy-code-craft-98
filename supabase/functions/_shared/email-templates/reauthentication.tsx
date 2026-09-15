/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre code de vérification</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>Votre code de vérification</Heading>
          <Text style={text}>Utilisez le code ci-dessous pour confirmer votre identité :</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>
            Ce code expirera rapidement. Si vous n'êtes pas à l'origine de cette demande, ignorez
            ce message.
          </Text>
        </Section>
        <Text style={brand}>Aetheria VTT — Votre table de jeu virtuelle</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const card = { background: 'linear-gradient(180deg, #0f172a 0%, #111d33 100%)', border: '1px solid rgba(212,164,53,0.25)', borderRadius: '12px', padding: '32px 28px', color: '#f5e9c8' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#d4a435', margin: '0 0 16px', letterSpacing: '0.5px' }
const text = { fontSize: '15px', color: '#e6dcc0', lineHeight: '1.6', margin: '0 0 18px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '26px', fontWeight: 'bold' as const, color: '#d4a435', letterSpacing: '8px', textAlign: 'center' as const, margin: '0 0 16px' }
const footer = { fontSize: '13px', color: '#9c8f6a', margin: '24px 0 0' }
const brand = { textAlign: 'center' as const, fontSize: '12px', color: '#9c8f6a', marginTop: '16px' }

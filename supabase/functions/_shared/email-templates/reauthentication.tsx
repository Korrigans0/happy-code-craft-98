/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface Props { token: string }

export const ReauthenticationEmail = ({ token }: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre code de vérification Aetheria</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>Code de vérification</Heading>
          <Text style={text}>Utilisez ce code pour confirmer votre identité :</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>Ce code expirera bientôt. Si vous n'en êtes pas à l'origine, ignorez ce message.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)
export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const card = { background: 'linear-gradient(180deg, #0f172a 0%, #111d33 100%)', border: '1px solid rgba(212,164,53,0.25)', borderRadius: '12px', padding: '32px 28px', color: '#f5e9c8', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#d4a435', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#e6dcc0', lineHeight: '1.6', margin: '0 0 18px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '32px', fontWeight: 'bold' as const, color: '#d4a435', letterSpacing: '8px', margin: '16px 0 24px' }
const footer = { fontSize: '12px', color: '#9c8f6a', margin: '16px 0 0' }

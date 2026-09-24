/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  typeLabel?: string
  reference?: string
  name?: string
  email?: string
  subject?: string
  message?: string
  pageUrl?: string
}

const OWNER_EMAIL = 'korrigans125@gmail.com'

const Email = ({ typeLabel = 'Demande juridique', reference = '', name = '', email = '', subject = '', message = '', pageUrl = '' }: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>{`Nouvelle demande juridique — ${typeLabel}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={heading}>Demande juridique Aétheria VTT</Heading>
          <Text style={row}><strong>Type :</strong> {typeLabel}</Text>
          <Text style={row}><strong>Référence :</strong> {reference}</Text>
          <Text style={row}><strong>Demandeur :</strong> {name}</Text>
          <Text style={row}><strong>E-mail :</strong> {email}</Text>
          <Text style={row}><strong>Objet :</strong> {subject}</Text>
          <Text style={row}><strong>Page :</strong> {pageUrl || '—'}</Text>
          <Text style={messageStyle}>{message}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) => `Demande juridique ${data.typeLabel ?? ''} — ${data.reference ?? ''}`,
  displayName: 'Demande juridique',
  to: OWNER_EMAIL,
  previewData: { typeLabel: 'Droits RGPD', reference: 'LEG-2026-EXEMPLE', name: 'Jean Exemple', email: 'jean@example.com', subject: 'Demande d’accès', message: 'Je souhaite recevoir une copie de mes données.', pageUrl: 'https://aetheriavtt.com/confidentialite' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', padding: '24px 0' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '0 16px' }
const card = { backgroundColor: '#111d33', border: '1px solid #d4a435', padding: '28px 24px', color: '#f5e9c8' }
const heading = { color: '#d4a435', fontSize: '22px' }
const row = { borderTop: '1px solid rgba(212,164,53,0.18)', paddingTop: '8px', fontSize: '14px' }
const messageStyle = { whiteSpace: 'pre-wrap' as const, lineHeight: '1.6', fontSize: '15px' }
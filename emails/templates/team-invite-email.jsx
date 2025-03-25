import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Img
} from '@react-email/components';

const baseStyles = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px'
};

const buttonStyles = {
  backgroundColor: '#3B82F6',
  borderRadius: '4px',
  color: '#fff',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center',
  margin: '16px 0'
};

const footerStyles = {
  color: '#6B7280',
  fontSize: '14px',
  marginTop: '32px'
};

export function TeamInviteEmail({ firstName, teamName, inviterName, inviteUrl }) {
  return (
    <Html lang="en">
      <Head>
        <title>You're invited to join {teamName} on xFoundry</title>
      </Head>
      <Body style={baseStyles}>
        <Container>
          <Section>
            <Img
              src="https://xfoundry.app/logo.png"
              alt="xFoundry Logo"
              width="120"
              height="40"
            />
          </Section>
          <Section>
            <Text>Hi {firstName},</Text>
            <Text>
              {inviterName ? `${inviterName} has invited you` : "You've been invited"} to join <strong>{teamName}</strong> on xFoundry!
            </Text>
            <Text>
              xFoundry is a platform where students can collaborate on projects and 
              track progress on initiatives together.
            </Text>
            <Button href={inviteUrl} style={buttonStyles}>
              Accept Invitation
            </Button>
            <Text>
              This invitation will expire in 14 days. If you don't have an xFoundry account yet, 
              you'll be able to create one after accepting the invitation.
            </Text>
          </Section>
          <Hr />
          <Section>
            <Text style={footerStyles}>
              If you weren't expecting this invitation, you can safely ignore this email.
            </Text>
            <Text style={footerStyles}>
              © {new Date().getFullYear()} xFoundry. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default TeamInviteEmail;
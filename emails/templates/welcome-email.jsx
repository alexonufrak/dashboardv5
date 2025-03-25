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

export function WelcomeEmail({ firstName }) {
  return (
    <Html lang="en">
      <Head>
        <title>Welcome to xFoundry!</title>
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
              Welcome to xFoundry! We're excited to have you join our community of innovators.
            </Text>
            <Text>
              xFoundry is a platform that helps students collaborate on projects, track progress, 
              and make meaningful connections within your institution's entrepreneurship ecosystem.
            </Text>
            <Button href="https://xfoundry.app/dashboard" style={buttonStyles}>
              Go to Dashboard
            </Button>
            <Text>
              Here are a few things you can do to get started:
            </Text>
            <ul>
              <li>Complete your profile</li>
              <li>Join or create a team</li>
              <li>Explore available programs</li>
            </ul>
          </Section>
          <Hr />
          <Section>
            <Text style={footerStyles}>
              If you have any questions, you can reach out to our support team.
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

export default WelcomeEmail;
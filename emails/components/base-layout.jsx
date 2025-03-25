import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Img
} from '@react-email/components';

const baseStyles = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px'
};

const footerStyles = {
  color: '#6B7280',
  fontSize: '14px',
  marginTop: '32px'
};

export function BaseLayout({ 
  title,
  previewText,
  children
}) {
  return (
    <Html lang="en">
      <Head>
        <title>{title}</title>
        {previewText && <text>{previewText}</text>}
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
            {children}
          </Section>
          <Hr />
          <Section>
            <Text style={footerStyles}>
              © {new Date().getFullYear()} xFoundry. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default BaseLayout;
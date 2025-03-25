import * as React from 'react';
import { Button } from '@react-email/components';

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

export function PrimaryButton({ href, children }) {
  return (
    <Button href={href} style={buttonStyles}>
      {children}
    </Button>
  );
}

export default PrimaryButton;
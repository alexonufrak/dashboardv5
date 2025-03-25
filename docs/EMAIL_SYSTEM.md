# xFoundry Email System

This document outlines the email system architecture and how to use it for sending emails in the xFoundry application.

## Overview

The xFoundry email system uses [Resend](https://resend.com) for delivering emails and [React Email](https://react.email) for creating email templates. This combination allows for creating beautiful, responsive emails using React components.

## Architecture

The email system consists of the following components:

1. **Email Service (`lib/email-service.js`)**: A utility for sending emails via Resend
2. **Email Templates (`emails/templates/`)**: React components for different email types
3. **Email Components (`emails/components/`)**: Reusable UI components for emails
4. **API Routes (`pages/api/email/`)**: Endpoints for sending emails
5. **Client Hooks (`hooks/use-email.js`)**: React hooks for sending emails from client components

## Getting Started

### Prerequisites

1. A Resend account with an API key
2. The Resend API key added to your environment variables as `RESEND_API_KEY`

### Sending Emails from Server-side Code

```javascript
import { sendEmail, sendTeamInviteEmail } from '@/lib/email-service';

// Generic email sending
await sendEmail({
  to: 'user@example.com',
  subject: 'Hello world',
  react: <MyEmailTemplate prop1="value" />
});

// Send a team invitation email
await sendTeamInviteEmail({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  teamName: 'My Team',
  inviterName: 'Jane Smith',
  inviteUrl: 'https://xfoundry.app/invitation/123'
});
```

### Sending Emails from Client Components

```javascript
import { useEmail } from '@/hooks/use-email';

function MyComponent() {
  const { sendEmail, sendTeamInvite, isLoading, error, isSuccess } = useEmail();

  const handleSendEmail = async () => {
    await sendEmail({
      templateType: 'welcome-email',
      templateData: { firstName: 'John' },
      to: 'user@example.com',
      subject: 'Welcome to xFoundry'
    });
  };
  
  // ...
}
```

## Creating New Email Templates

1. Create a new JSX file in the `emails/templates/` directory
2. Use React Email components to design your email
3. Export the component and make it the default export

Example:

```jsx
import * as React from 'react';
import { BaseLayout } from '../components/base-layout';
import { PrimaryButton } from '../components/primary-button';
import { Text } from '@react-email/components';

export function NewUserEmail({ firstName, verificationUrl }) {
  return (
    <BaseLayout title="Verify Your Email">
      <Text>Hi {firstName},</Text>
      <Text>Please verify your email to get started with xFoundry.</Text>
      <PrimaryButton href={verificationUrl}>
        Verify Email
      </PrimaryButton>
    </BaseLayout>
  );
}

export default NewUserEmail;
```

4. Add a function to `lib/email-service.js` for sending this specific email type

```javascript
export async function sendNewUserEmail({
  email,
  firstName,
  verificationUrl
}) {
  const { NewUserEmail } = await import('../emails/templates/new-user-email');
  
  return sendEmail({
    to: email,
    subject: 'Verify Your Email',
    react: NewUserEmail({
      firstName,
      verificationUrl
    })
  });
}
```

## Extending the Email System

### Custom Email Components

Create reusable components in `emails/components/` to maintain consistent styling across emails.

### Handling Attachments

Resend supports file attachments. Pass an `attachments` array to the `sendEmail` function:

```javascript
await sendEmail({
  to: 'user@example.com',
  subject: 'Your Receipt',
  react: <ReceiptEmail {...data} />,
  attachments: [
    {
      filename: 'receipt.pdf',
      content: pdfBuffer, // Buffer containing the file
    }
  ]
});
```

### Analytics and Tracking

Resend provides email analytics. You can view delivery rates, opens, and clicks in the Resend dashboard.

## Best Practices

1. **Dynamic Imports**: Always use dynamic imports for email templates to avoid SSR issues
2. **Error Handling**: Implement proper error handling for email sending
3. **Fallbacks**: Have fallback mechanisms if email sending fails
4. **Testing**: Test emails with different email clients before production
5. **Environment Separation**: Use different Resend API keys for development and production

## Troubleshooting

- **Emails not sending**: Check that the Resend API key is correctly set in environment variables
- **Formatting issues**: Test emails with [Email on Acid](https://www.emailonacid.com/) or similar services
- **Missing images**: Ensure all image URLs are absolute and publicly accessible
Send email using Resend
Learn how to send an email using React Email and the Resend Node.js SDK.

Resend was built by the same team that created React Email, which makes this our recommendation to send emails.
​
1. Install dependencies
Get the @react-email/components package and the Resend Node.js SDK.


npm

yarn

pnpm

Copy
npm install resend @react-email/components
​
2. Create an email using React
Start by building your email template in a .jsx or .tsx file.

email.tsx

Copy
import * as React from 'react';
import { Html, Button } from "@react-email/components";

export function Email(props) {
  const { url } = props;

  return (
    <Html lang="en">
      <Button href={url}>Click me</Button>
    </Html>
  );
}

export default Email;
​
3. Send email
When integrating with other services, you need to convert your React template into HTML before sending. Resend takes care of that for you.
Import the email template you just built and use the Resend SDK to send it.


Copy
import { Resend } from 'resend';
import { Email } from './email';

const resend = new Resend('re_123456789');

await resend.emails.send({
  from: 'you@example.com',
  to: 'user@gmail.com',
  subject: 'hello world',
  react: <Email url="https://example.com" />,
});
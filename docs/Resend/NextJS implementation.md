Next.js
Learn how to send your first email using Next.js and the Resend Node.js SDK.

​
Prerequisites
To get the most out of this guide, you’ll need to:

Create an API key
Verify your domain
​
1. Install
Get the Resend Node.js SDK.


npm

yarn

pnpm

Copy
npm install resend
​
2. Create an email template
Start by creating your email template on components/email-template.tsx.

components/email-template.tsx

Copy
import * as React from 'react';

interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
}) => (
  <div>
    <h1>Welcome, {firstName}!</h1>
  </div>
);
​
3. Send email using React
Create an API file under pages/api/send.ts if you’re using the Pages Router or create a route file under app/api/send/route.ts if you’re using the App Router.

Import the React email template and send an email using the react parameter.


pages/api/send.ts

app/api/send/route.ts

Copy
import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailTemplate } from '../../components/EmailTemplate';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { data, error } = await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['delivered@resend.dev'],
    subject: 'Hello world',
    react: EmailTemplate({ firstName: 'John' }),
  });

  if (error) {
    return res.status(400).json(error);
  }

  res.status(200).json(data);
};
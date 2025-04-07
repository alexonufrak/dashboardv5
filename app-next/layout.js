import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Initialize font
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

/**
 * Root layout component for the entire application
 * This wraps all app router pages
 */
export const metadata = {
  title: 'xFoundry Dashboard',
  description: 'The xFoundry Dashboard application for managing entrepreneurship programs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
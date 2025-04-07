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
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Next.js App Router Active
              </p>
              <a 
                href="/?useAppRouter=false" 
                className="text-xs block mt-1 underline text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Switch to Pages Router
              </a>
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
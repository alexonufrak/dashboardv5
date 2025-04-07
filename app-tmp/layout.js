import '../styles/globals.css'
import '@fillout/react/style.css'
import { fontFamily } from './fonts'
import Providers from './providers'

export const metadata = {
  title: {
    template: '%s | xFoundry Dashboard',
    default: 'xFoundry Dashboard',
  },
  description: 'xFoundry Dashboard - Education Innovation Platform',
  keywords: ['education', 'innovation', 'platform', 'xFoundry', 'dashboard'],
  icons: {
    icon: '/logos/xFoundry Logo.svg',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontFamily.variable} font-sans bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
}
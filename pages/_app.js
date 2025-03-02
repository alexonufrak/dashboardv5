import { UserProvider } from "@auth0/nextjs-auth0/client"
import "../styles/globals.css"
import "@fillout/react/style.css" // Import Fillout styles
import { Toaster } from 'sonner';
import { OnboardingProvider } from '@/contexts/OnboardingContext'

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <OnboardingProvider>
        <Component {...pageProps} />
        <Toaster position="top-right" richColors closeButton />
      </OnboardingProvider>
    </UserProvider>
  )
}

export default MyApp


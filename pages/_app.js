import { UserProvider } from "@auth0/nextjs-auth0/client"
import "../styles/globals.css"
import "@fillout/react/style.css" // Import Fillout styles
import { Toaster } from 'sonner';

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
      <Toaster position="top-right" richColors closeButton />
    </UserProvider>
  )
}

export default MyApp


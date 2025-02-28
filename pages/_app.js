import { UserProvider } from "@auth0/nextjs-auth0/client"
import { ThemeProvider } from "next-themes"
import "../styles/globals.css"
import "@fillout/react/style.css" // Import Fillout styles

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    </ThemeProvider>
  )
}

export default MyApp


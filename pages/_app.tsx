import type { AppProps } from "next/app";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { fontSans, fontMono } from "@/config/fonts";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import "@/styles/globals.css";

// Create a react-query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Determine if the current page is a dashboard page
  const isDashboardPage = router.pathname.startsWith('/dashboard') || 
                          router.pathname.startsWith('/program') || 
                          router.pathname.includes('profile');

  return (
    // Auth0 provider for authentication
    <UserProvider>
      {/* React Query for data fetching */}
      <QueryClientProvider client={queryClient}>
        {/* Theme provider for light/dark mode */}
        <NextThemesProvider attribute="class" defaultTheme="light">
          {/* HeroUI provider with default theme */}
          <HeroUIProvider>
            {/* Conditionally wrap with providers based on route */}
            {isDashboardPage ? (
              <DashboardProvider>
                <OnboardingProvider>
                  <Component {...pageProps} />
                </OnboardingProvider>
              </DashboardProvider>
            ) : (
              <Component {...pageProps} />
            )}
          </HeroUIProvider>
        </NextThemesProvider>
      </QueryClientProvider>
    </UserProvider>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};

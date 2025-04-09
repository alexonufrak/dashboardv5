'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import Logo from '@/components/common/Logo';
import { useUser } from '@auth0/nextjs-auth0';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Home Page - Client Component to match Pages Router version
 * Landing page for the application with dynamic animation background
 */
export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="max-w-md w-full p-8 space-y-8">
          <Skeleton className="h-16 w-48 mx-auto mb-8" />
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-10 w-3/4 mx-auto mb-8" />
          <Skeleton className="h-12 w-40 mx-auto" />
        </div>
      </div>
    );
  }

  if (user) {
    // Redirect handled by useEffect
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <p className="text-lg">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 pointer-events-auto">
        <ThemeToggle />
      </div>
      
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(14, 68, 90)" // Eden (light mode)
        gradientBackgroundEnd="rgb(36, 169, 224)" // Curious Blue (light mode)
        firstColor="36, 169, 224" // Curious Blue
        secondColor="14, 68, 90" // Eden
        thirdColor="255, 210, 0" // Gold
        fourthColor="22, 163, 74" // Green
        fifthColor="36, 169, 224" // Curious Blue
        size="120%"
        interactive={true}
        className="h-screen w-screen dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800"
      >
        <div className="h-full w-full flex flex-col items-center justify-center pointer-events-none">
          <div className="relative z-10 max-w-md mx-auto px-4 text-center pointer-events-auto">
            <div className="mb-8">
              <Logo 
                variant="horizontal" 
                color="auto" 
                height={80} 
                className="mx-auto"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white dark:text-white mb-4">
              Education Innovation Platform
            </h1>
            <p className="text-lg md:text-xl text-white/80 dark:text-white/80 mb-8">
              Connect students across disciplines to build solutions for real-world challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-white text-primary hover:bg-white/90 font-semibold">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login?screen_hint=signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 font-medium dark:border-white dark:text-white dark:hover:bg-white/20">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </BackgroundGradientAnimation>
    </>
  );
}
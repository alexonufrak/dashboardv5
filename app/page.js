import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Home Page - Server Component
 * Landing page for the application
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-4">
      <div className="w-full max-w-5xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-blue-800 dark:text-blue-200 mb-8">
          xFoundry Dashboard
        </h1>
        <p className="text-xl text-slate-700 dark:text-slate-300 mb-12">
          Your hub for entrepreneurship programs and resources
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login">
            <Button size="lg" className="w-full sm:w-auto">
              Log In
            </Button>
          </Link>
          <Link href="/auth/login?screen_hint=signup">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
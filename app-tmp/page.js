import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/app-router-auth'
import HomePage from './home-page'

export const metadata = {
  title: 'xFoundry - Education Innovation Platform',
  description: 'xFoundry is an education innovation platform that connects students across disciplines to build solutions for real-world challenges.',
}

/**
 * Home Page - Server Component with Client-Side Rendering
 *
 * Checks authentication and either:
 * - Redirects to dashboard if logged in
 * - Shows the home page if not logged in
 */
export default async function Home() {
  // Check if the user is authenticated
  const user = await getCurrentUser()
  
  // If authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }
  
  // Show the home page for non-authenticated users
  return <HomePage />
}
"use client"

import { useUser } from "@auth0/nextjs-auth0/client"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"
import DashboardRedirect from "@/components/dashboard/DashboardRedirect"
import Logo from "@/components/common/Logo"
import Head from "next/head"

export default function Home() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

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
    return <DashboardRedirect />
  }

  return (
    <>
      <Head>
        <title>xFoundry - Education Innovation Platform</title>
        <meta name="description" content="xFoundry is an education innovation platform that connects students across disciplines" />
      </Head>

      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(14, 68, 90)" // Eden
        gradientBackgroundEnd="rgb(36, 169, 224)" // Curious Blue
        firstColor="36, 169, 224" // Curious Blue
        secondColor="14, 68, 90" // Eden
        thirdColor="255, 210, 0" // Gold
        fourthColor="22, 163, 74" // Green
        fifthColor="36, 169, 224" // Curious Blue
        interactive={true}
        className="h-screen w-screen"
      >
        <div className="h-full w-full flex flex-col items-center justify-center">
          <div className="relative z-10 max-w-md mx-auto px-4 text-center">
            <div className="mb-8">
              <Logo 
                variant="horizontal" 
                color="white" 
                height={80} 
                className="mx-auto"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Education Innovation Platform
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              Connect students across disciplines to build solutions for real-world challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-white text-primary hover:bg-white/90 font-semibold">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 border-white text-white hover:bg-white/20 font-medium">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </BackgroundGradientAnimation>
    </>
  )
}
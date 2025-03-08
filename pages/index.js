"use client"

import { useUser } from "@auth0/nextjs-auth0/client"
import { useRouter } from "next/router"
import { useEffect } from "react"
import Layout from "@/components/layout/Layout"
import LoadingScreen from "@/components/common/LoadingScreen"
import DashboardRedirect from "@/components/dashboard/DashboardRedirect"
import Logo from "@/components/common/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RocketIcon, Users, BookOpenText, GraduationCap, ArrowRight, CheckIcon } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (user) {
    return <DashboardRedirect />
  }

  return (
    <Layout title="Welcome to xFoundry">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-linear-to-br from-curious/5 to-eden/10">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-6">
                <div className="mb-8">
                  <Logo variant="horizontal" color="eden" height={80} />
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-primary">
                  Break Down Silos, Build Better Solutions
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl lg:text-2xl/relaxed">
                  xFoundry brings diverse perspectives together through multidisciplinary collaboration, hands-on experience, and targeted competitions to tackle global challenges.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-6">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="h-12 px-6">
                    Sign Up
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span className="text-gray-700">Free to join</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span className="text-gray-700">Institution verified</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span className="text-gray-700">Student focused</span>
                </div>
              </div>
            </div>
            <div className="mx-auto flex flex-col justify-center md:justify-end">
              <div className="relative h-[450px] w-full overflow-hidden rounded-xl bg-white/10 backdrop-blur-xs border border-primary/20 shadow-xl">
                <div className="flex h-full items-center justify-center">
                  <img 
                    src="/placeholder.svg" 
                    alt="xFoundry Dashboard Preview" 
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                TEAMS Philosophy
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">
                Multidisciplinary Collaboration
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-center">
                The most innovative solutions emerge when multiple disciplines intersect. xFoundry's unique approach breaks down academic silos to tackle global challenges from every angle.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-5px]">
              <div className="absolute top-0 right-0 h-24 w-24 bg-curious/10 rounded-bl-full"></div>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-eden">
                  <RocketIcon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Targeted Competitions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Engage in real-world challenges that push boundaries and develop your skills through hands-on experience and innovation.
                </p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-5px]">
              <div className="absolute top-0 right-0 h-24 w-24 bg-eden/10 rounded-bl-full"></div>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-curious/20 text-eden">
                  <Users className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Cross-Disciplinary Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Collaborate with peers from diverse academic backgrounds to create innovative solutions that wouldn't be possible within a single discipline.
                </p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-5px] md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 h-24 w-24 bg-gold/10 rounded-bl-full"></div>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-eden/20 text-curious">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Resource Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Access a comprehensive network of tools, mentors, and frameworks designed to help your team succeed in addressing complex global challenges.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Getting Started Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
        <div className="container grid items-center justify-center gap-4 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              How It Works
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary">
              Join xFoundry and Make an Impact
            </h2>
            <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed">
              Our unique approach combines multidisciplinary collaboration, hands-on experience, and targeted competitions to prepare you to tackle global challenges.
            </p>
            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-curious text-white">1</div>
                <div>
                  <h3 className="font-semibold">Join a Multidisciplinary Team</h3>
                  <p className="text-sm text-gray-500">
                    Collaborate with students from different academic backgrounds to bring diverse perspectives together
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-eden text-white">2</div>
                <div>
                  <h3 className="font-semibold">Engage in Targeted Competitions</h3>
                  <p className="text-sm text-gray-500">
                    Work on real-world challenges designed to develop innovative solutions to global problems
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-eden">3</div>
                <div>
                  <h3 className="font-semibold">Access the Resource Matrix</h3>
                  <p className="text-sm text-gray-500">
                    Leverage our comprehensive network of tools, mentors, and frameworks to help your team succeed
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-6">
                  Create Your Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full h-[450px] overflow-hidden rounded-xl bg-white border border-gray-200 shadow-lg transition-all">
              <img 
                src="/placeholder.svg" 
                alt="xFoundry Signup Process" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonial Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">
                Breaking Down Academic Silos
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Hear from students who have collaborated across disciplines to create innovative solutions to real-world challenges.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="font-semibold">MC</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">Maria C.</CardTitle>
                    <CardDescription>Computer Science</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  "Working with students from different disciplines opened my eyes to new perspectives. Our team created solutions that would have been impossible if we all studied the same field."
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="font-semibold">JT</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">James T.</CardTitle>
                    <CardDescription>Business Administration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  "Our targeted competition pushed us to develop a real-world solution to a complex problem. The multidisciplinary approach helped me apply my business skills in ways I never imagined."
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white md:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="font-semibold">LK</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">Lisa K.</CardTitle>
                    <CardDescription>Engineering</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  "The resource matrix provided my team with everything we needed to succeed. Having access to mentors from different industries helped us create a truly innovative engineering solution."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-linear-to-br from-curious to-eden">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white drop-shadow-xs">
                Ready to Tackle Global Challenges?
              </h2>
              <p className="mx-auto max-w-[700px] text-white md:text-xl font-medium drop-shadow-xs">
                Join xFoundry today to collaborate across disciplines and develop innovative solutions through our unique TEAMS approach.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-2 w-full max-w-md">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 px-8 bg-gold text-eden hover:bg-gold/90 font-semibold text-base shadow-lg">
                  Create Your Account
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-12 px-8 border-white text-white hover:bg-curious/30 font-semibold text-base shadow-md">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
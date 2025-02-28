"use client"

import { useUser } from "@auth0/nextjs-auth0/client"
import { useRouter } from "next/router"
import { useEffect } from "react"
import Layout from "../components/Layout"
import LoadingScreen from "../components/LoadingScreen"
import DashboardRedirect from "../components/DashboardRedirect"
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
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-primary">
                  Your Academic Journey Starts Here
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl lg:text-2xl/relaxed">
                  xFoundry connects students with opportunities, resources, and networks to help you thrive in your educational and professional path.
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
              <div className="relative h-[450px] w-full overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-primary/20 shadow-xl">
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
                Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">
                Empowering Students
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-center">
                xFoundry provides all the tools you need to discover opportunities, connect with peers and mentors, and build your future.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-5px]">
              <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 rounded-bl-full"></div>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <RocketIcon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Discover Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Access curated programs, internships, and resources specific to your institution and interests.
                </p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-5px]">
              <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 rounded-bl-full"></div>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Connect With Others</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Build relationships with fellow students, mentors, and professionals in your field of interest.
                </p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-5px] md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 rounded-bl-full"></div>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Track Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Manage applications, track your participation, and build your professional portfolio all in one place.
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
              Getting Started
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary">
              Join xFoundry in Three Simple Steps
            </h2>
            <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed">
              Our streamlined onboarding process makes it easy to get started and discover valuable opportunities.
            </p>
            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">1</div>
                <div>
                  <h3 className="font-semibold">Sign Up with Your School Email</h3>
                  <p className="text-sm text-gray-500">
                    We'll verify your institution to provide you with relevant opportunities
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">2</div>
                <div>
                  <h3 className="font-semibold">Complete Your Profile</h3>
                  <p className="text-sm text-gray-500">
                    Tell us about your interests, skills, and goals for a personalized experience
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">3</div>
                <div>
                  <h3 className="font-semibold">Explore Your Hub</h3>
                  <p className="text-sm text-gray-500">
                    Discover programs, connect with your team, and access resources in your dashboard
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
                Join Thousands of Students
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Hear from students who have used xFoundry to advance their academic and professional journeys.
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
                  "xFoundry helped me discover internship opportunities I wouldn't have found otherwise. The personalized approach made all the difference in my career journey."
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
                  "The mentoring connections I made through xFoundry were invaluable. I'm now working at my dream company thanks to the relationships I built on the platform."
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
                  "Being able to see opportunities specifically for my university and field of study saved me so much time. xFoundry has become an essential resource for my academic journey."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-3 text-white">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Start Your Journey?
              </h2>
              <p className="mx-auto max-w-[700px] text-white md:text-xl font-medium">
                Join xFoundry today and connect with opportunities, mentors, and resources that will shape your future.
              </p>
            </div>
            <div className="space-x-4 pt-2">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 bg-white text-primary hover:bg-white/90 font-semibold text-base shadow-md">
                  Create Your Account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-8 border-white text-white hover:bg-white/20 font-semibold text-base shadow-md">
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
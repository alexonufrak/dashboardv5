"use client"

import Head from "next/head"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Navbar from "./Navbar"
import ResourcesToolbar from "./ResourcesToolbar"

const Layout = ({ children, title = "xFoundry Student Dashboard" }) => {
  const [currentYear, setCurrentYear] = useState("")
  const router = useRouter()
  const isDashboard = router.pathname === "/dashboard"

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="xFoundry Student Dashboard - Empowering education through technology" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col min-h-screen">
        {/* Resources Toolbar - only shown on dashboard */}
        {isDashboard && <ResourcesToolbar />}
        
        {/* Main Navbar */}
        <Navbar />

        <main className="flex-1 container mx-auto max-w-7xl p-4 md:p-6">
          {children}
        </main>

        <footer className="w-full py-4 border-t border-border bg-card text-center mt-8">
          <p className="text-sm text-muted-foreground">
            © {currentYear} xFoundry Education Platform. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  )
}

export default Layout


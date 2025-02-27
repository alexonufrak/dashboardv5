"use client"

import Head from "next/head"
import { useState, useEffect } from "react"
import Navbar from "./Navbar"
import ResourcesToolbar from "./ResourcesToolbar"

const Layout = ({ children, title = "xFoundry Student Dashboard" }) => {
  const [currentYear, setCurrentYear] = useState("")

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

      <div style={styles.pageContainer}>
        {/* Resources Toolbar - fixed at top */}
        <ResourcesToolbar />
        
        {/* Main Navbar */}
        <Navbar />

        <main style={styles.mainContent}>{children}</main>

        <footer style={styles.footer}>
          <p>© {currentYear} xFoundry Education Platform. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}

const styles = {
  pageContainer: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    paddingTop: "30px", // Add padding to account for fixed toolbar
  },
  mainContent: {
    flex: 1,
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    width: "100%",
  },
  footer: {
    borderTop: "1px solid var(--color-light)",
    backgroundColor: "var(--color-white)",
    color: "var(--color-secondary)",
    textAlign: "center",
    padding: "1rem 0",
    marginTop: "2rem",
  },
}

export default Layout


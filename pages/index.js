"use client"

import { useUser } from "@auth0/nextjs-auth0/client"
import { useRouter } from "next/router"
import { useEffect } from "react"
import Layout from "../components/Layout"
import LoadingScreen from "../components/LoadingScreen"
import DashboardRedirect from "../components/DashboardRedirect"

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
      <div style={styles.container}>
        <section style={styles.hero}>
          <h1 style={styles.heading}>Welcome to xFoundry</h1>
          <p style={styles.subheading}>The educational platform connecting students with opportunities</p>
          <a href="/api/auth/login" style={styles.button}>
            Log In
          </a>
        </section>

        <section style={styles.howItWorks}>
          <h2 style={styles.sectionHeading}>How It Works</h2>
          <div style={styles.cardContainer}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>1. Verify Your Email</h3>
              <p style={styles.cardDescription}>
                Sign up with your school email to get started on your xFoundry journey.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>2. Complete Your Profile</h3>
              <p style={styles.cardDescription}>
                Tell us about your skills, interests, and academic goals to personalize your experience.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>3. Access Resources</h3>
              <p style={styles.cardDescription}>
                Explore a wealth of educational resources, opportunities, and connections tailored for you.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
  },
  hero: {
    textAlign: "center",
    marginBottom: "60px",
  },
  heading: {
    fontSize: "3rem",
    color: "var(--color-primary)",
    marginBottom: "20px",
  },
  subheading: {
    fontSize: "1.2rem",
    color: "var(--color-secondary)",
    marginBottom: "30px",
  },
  button: {
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "var(--color-primary)",
    color: "var(--color-white)",
    textDecoration: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    transition: "background-color 0.3s ease",
  },
  howItWorks: {
    textAlign: "center",
  },
  sectionHeading: {
    fontSize: "2rem",
    color: "var(--color-dark)",
    marginBottom: "40px",
  },
  cardContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
  },
  card: {
    flex: "1 1 calc(33.333% - 20px)",
    backgroundColor: "var(--color-white)",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    minWidth: "250px",
  },
  cardTitle: {
    fontSize: "1.2rem",
    color: "var(--color-primary)",
    marginBottom: "10px",
  },
  cardDescription: {
    fontSize: "1rem",
    color: "var(--color-secondary)",
  },
}
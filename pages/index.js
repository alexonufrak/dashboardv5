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
          <div style={styles.heroContent}>
            <div style={styles.heroText}>
              <h1 style={styles.heading}>Empower Your Academic Journey</h1>
              <p style={styles.subheading}>
                xFoundry connects students with opportunities, resources, and networks 
                to help you thrive in your educational and professional path.
              </p>
              <div style={styles.buttonContainer}>
                <a href="/login" style={styles.primaryButton}>
                  Sign In
                </a>
                <a href="/signup" style={styles.secondaryButton}>
                  Create Account
                </a>
              </div>
            </div>
            <div style={styles.heroImageContainer}>
              <div style={styles.heroImage}></div>
            </div>
          </div>
        </section>

        <section style={styles.featuresSection}>
          <h2 style={styles.sectionHeading}>Why Join xFoundry?</h2>
          <div style={styles.cardContainer}>
            <div style={styles.featureCard}>
              <div style={styles.featureIconContainer}>
                <div style={{...styles.featureIcon, backgroundColor: 'rgba(25, 118, 210, 0.1)'}}>🔍</div>
              </div>
              <h3 style={styles.cardTitle}>Discover Opportunities</h3>
              <p style={styles.cardDescription}>
                Access curated programs, internships, and resources specific to your institution and interests.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIconContainer}>
                <div style={{...styles.featureIcon, backgroundColor: 'rgba(76, 175, 80, 0.1)'}}>🤝</div>
              </div>
              <h3 style={styles.cardTitle}>Build Connections</h3>
              <p style={styles.cardDescription}>
                Connect with fellow students, mentors, and professionals in your field of interest.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIconContainer}>
                <div style={{...styles.featureIcon, backgroundColor: 'rgba(156, 39, 176, 0.1)'}}>🚀</div>
              </div>
              <h3 style={styles.cardTitle}>Track Your Progress</h3>
              <p style={styles.cardDescription}>
                Manage applications, track your participation, and build your professional portfolio.
              </p>
            </div>
          </div>
        </section>
        
        <section style={styles.stepsSection}>
          <h2 style={styles.sectionHeading}>Getting Started is Easy</h2>
          <div style={styles.stepsContainer}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Sign Up with Your School Email</h3>
                <p style={styles.stepDescription}>
                  We'll verify your institution to provide you with relevant opportunities.
                </p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Complete Your Profile</h3>
                <p style={styles.stepDescription}>
                  Tell us about your interests, skills, and goals for a personalized experience.
                </p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Explore Your Hub</h3>
                <p style={styles.stepDescription}>
                  Discover programs, connect with your team, and access resources in your dashboard.
                </p>
              </div>
            </div>
          </div>
          
          <div style={styles.ctaContainer}>
            <a href="/signup" style={styles.ctaButton}>
              Get Started Today
            </a>
          </div>
        </section>
      </div>
    </Layout>
  )
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  // Hero section
  hero: {
    marginBottom: "80px",
    position: "relative",
  },
  heroContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "40px",
  },
  heroText: {
    flex: "1 1 500px",
  },
  heroImageContainer: {
    flex: "1 1 400px",
    display: "flex",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: "360px",
    backgroundColor: "#f0f4f8",
    borderRadius: "12px",
    backgroundImage: "url('/placeholder.svg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 10px 25px rgba(0, 86, 179, 0.1)",
  },
  heading: {
    fontSize: "3.5rem",
    lineHeight: "1.2",
    fontWeight: "700",
    color: "var(--color-primary)",
    marginBottom: "20px",
    maxWidth: "90%",
  },
  subheading: {
    fontSize: "1.3rem",
    lineHeight: "1.6",
    color: "var(--color-secondary)",
    marginBottom: "30px",
    maxWidth: "90%",
  },
  buttonContainer: {
    display: "flex",
    gap: "15px",
    marginTop: "30px",
  },
  primaryButton: {
    display: "inline-block",
    padding: "14px 28px",
    backgroundColor: "var(--color-primary)",
    color: "var(--color-white)",
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
  },
  secondaryButton: {
    display: "inline-block",
    padding: "14px 28px",
    backgroundColor: "var(--color-white)",
    color: "var(--color-primary)",
    textDecoration: "none",
    border: "2px solid var(--color-primary)",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  
  // Features section
  featuresSection: {
    textAlign: "center",
    marginBottom: "80px",
    padding: "40px 0",
  },
  sectionHeading: {
    fontSize: "2.4rem",
    color: "var(--color-dark)",
    marginBottom: "50px",
    fontWeight: "600",
    textAlign: "center",
  },
  cardContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    flexWrap: "wrap",
  },
  featureCard: {
    flex: "1 1 300px",
    backgroundColor: "var(--color-white)",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 5px 20px rgba(0, 0, 0, 0.05)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    maxWidth: "350px",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    },
  },
  featureIconContainer: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
  },
  featureIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
  },
  cardTitle: {
    fontSize: "1.5rem",
    color: "var(--color-primary)",
    marginBottom: "15px",
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: "1.05rem",
    color: "var(--color-secondary)",
    lineHeight: "1.6",
  },
  
  // Steps section
  stepsSection: {
    padding: "40px 0 60px 0",
  },
  stepsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  step: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },
  stepNumber: {
    backgroundColor: "var(--color-primary)",
    color: "white",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: "1.3rem",
    fontWeight: "600",
    marginBottom: "10px",
    color: "var(--color-dark)",
  },
  stepDescription: {
    fontSize: "1.05rem",
    color: "var(--color-secondary)",
    lineHeight: "1.5",
  },
  ctaContainer: {
    textAlign: "center",
    marginTop: "50px",
  },
  ctaButton: {
    display: "inline-block",
    padding: "16px 32px",
    backgroundColor: "var(--color-primary)",
    color: "var(--color-white)",
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "1.2rem",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    transition: "all 0.3s ease",
  },
}
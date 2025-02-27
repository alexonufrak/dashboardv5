"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import DashboardHeader from "../components/DashboardHeader"
import ProfileCard from "../components/ProfileCard"
import LoadingScreen from "../components/LoadingScreen"

const Dashboard = () => {
  const { user, isLoading: isUserLoading } = useUser()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile")
        if (!response.ok) {
          throw new Error("Failed to fetch profile")
        }
        const data = await response.json()
        setProfile(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [user])

  if (isUserLoading || isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <Layout title="xFoundry Dashboard">
      <div style={styles.container}>
        <DashboardHeader profile={profile} />
        <div style={styles.content}>
          <div style={styles.profileSection}>
            <h2 style={styles.sectionHeading}>Your Profile</h2>
            <ProfileCard profile={profile} />
          </div>
          <div style={styles.resourcesSection}>
            <h2 style={styles.sectionHeading}>Resources</h2>
            <div style={styles.card}>
              <h3 style={styles.cardHeading}>Educational Resources</h3>
              <ul style={styles.resourceList}>
                <li>
                  <a href="https://www.xfoundry.org/resources/intro-programming" style={styles.link}>
                    Introduction to Programming
                  </a>
                </li>
                <li>
                  <a href="https://www.xfoundry.org/resources/data-structures" style={styles.link}>
                    Data Structures and Algorithms
                  </a>
                </li>
                <li>
                  <a href="https://www.xfoundry.org/resources/web-development" style={styles.link}>
                    Web Development Fundamentals
                  </a>
                </li>
              </ul>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardHeading}>Upcoming Events</h3>
              <p style={styles.noEvents}>No events scheduled</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps = withPageAuthRequired()

export default Dashboard

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  content: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
  },
  profileSection: {
    flex: "1 1 calc(50% - 10px)",
    minWidth: "300px",
  },
  resourcesSection: {
    flex: "1 1 calc(50% - 10px)",
    minWidth: "300px",
  },
  sectionHeading: {
    fontSize: "1.5rem",
    color: "var(--color-primary)",
    marginBottom: "15px",
  },
  card: {
    backgroundColor: "var(--color-white)",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    marginBottom: "20px",
  },
  cardHeading: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  resourceList: {
    listStyleType: "none",
    padding: 0,
  },
  link: {
    color: "var(--color-primary)",
    textDecoration: "none",
    padding: "8px 0",
    display: "block",
    transition: "color 0.3s ease",
  },
  noEvents: {
    color: "var(--color-secondary)",
    fontStyle: "italic",
  },
}
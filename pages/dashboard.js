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

  // Function to render individual cohort cards
  const renderCohortCard = (cohort) => {
    // Get initiative details
    const initiativeName = cohort["Initiative"] && cohort["Initiative"].length > 0 
      ? cohort["Name (from Initiative)"] && cohort["Name (from Initiative)"].length > 0 
        ? cohort["Name (from Initiative)"][0] 
        : "Unknown Initiative" 
      : "Unknown Initiative";
    
    // Get topics
    const topics = cohort["Topics"] && cohort["Topics"].length > 0 
      ? cohort["Name (from Topics)"] 
      : [];
    
    // Set button action based on the Action Button field
    const actionButtonText = cohort["Action Button"] || "Apply Now";
    
    // Set status indicator
    const status = cohort["Status"] || "Unknown";
    
    // Define different action button styles based on status
    const buttonStyle = {
      ...styles.actionButton,
      backgroundColor: status === "Open" ? "var(--color-primary)" : "var(--color-secondary)",
    };
    
    return (
      <div key={cohort.id} style={styles.cohortCard}>
        <div style={styles.cohortHeader}>
          <div>
            <h3 style={styles.cohortTitle}>{cohort["Short Name"] || "Unnamed Cohort"}</h3>
            <span style={styles.initiativeBadge}>{initiativeName}</span>
            <span style={{
              ...styles.statusBadge,
              backgroundColor: status === "Open" ? "#dff0d8" : "#f2dede",
              color: status === "Open" ? "#3c763d" : "#a94442",
            }}>
              {status}
            </span>
          </div>
        </div>
        
        <div style={styles.cohortContent}>
          {topics && topics.length > 0 && (
            <div style={styles.topicsContainer}>
              {topics.map((topic, index) => (
                <span key={index} style={styles.topicBadge}>{topic}</span>
              ))}
            </div>
          )}
          
          <div style={styles.actionButtonContainer}>
            <button style={buttonStyle} disabled={status !== "Open"}>
              {actionButtonText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title="xFoundry Dashboard">
      <div style={styles.container}>
        {profile.institutionName && profile.institutionName !== "Not specified" && (
          <div style={styles.institutionBadge}>
            {profile.institutionName}
          </div>
        )}
        
        <DashboardHeader profile={profile} />
        
        <div style={styles.content}>
          <div style={styles.profileSection}>
            <h2 style={styles.sectionHeading}>Your Profile</h2>
            <ProfileCard profile={profile} />
          </div>
          
          <div style={styles.cohortsSection}>
            <h2 style={styles.sectionHeading}>Available Programs</h2>
            
            {profile.cohorts && profile.cohorts.length > 0 ? (
              <div style={styles.cohortsGrid}>
                {profile.cohorts.map(cohort => renderCohortCard(cohort))}
              </div>
            ) : (
              <div style={styles.card}>
                <p style={styles.noCohorts}>No programs are currently available for your institution. Check back later for updates.</p>
              </div>
            )}
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
    position: "relative",
  },
  institutionBadge: {
    display: "inline-block",
    padding: "6px 12px",
    background: "var(--color-primary)",
    color: "white",
    borderRadius: "4px",
    fontWeight: "bold",
    marginBottom: "20px",
    fontSize: "14px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  profileSection: {
    width: "100%",
  },
  cohortsSection: {
    width: "100%",
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
  noCohorts: {
    color: "var(--color-secondary)",
    fontStyle: "italic",
    textAlign: "center",
    padding: "20px 0",
  },
  cohortsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
  },
  cohortCard: {
    backgroundColor: "var(--color-white)",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  cohortHeader: {
    padding: "20px",
    borderBottom: "1px solid #eee",
  },
  cohortTitle: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  initiativeBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "var(--color-primary)",
    color: "white",
    borderRadius: "4px",
    fontSize: "0.8rem",
    marginRight: "8px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
  },
  cohortContent: {
    padding: "20px",
  },
  topicsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "15px",
  },
  topicBadge: {
    display: "inline-block",
    padding: "3px 8px",
    backgroundColor: "#f0f0f0",
    color: "#333",
    borderRadius: "4px",
    fontSize: "0.8rem",
  },
  actionButtonContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "15px",
  },
  actionButton: {
    padding: "10px 20px",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s ease",
  },
}
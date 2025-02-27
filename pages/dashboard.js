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
    // Debugging to see available fields
    console.log("Cohort fields:", cohort);
    
    // Get initiative name - try several possible field patterns
    let initiativeName = "Unknown Initiative";
    
    // Check for initiative lookup field patterns
    if (cohort["Name (from Initiative)"]) {
      // If it's an array, get the first item
      initiativeName = Array.isArray(cohort["Name (from Initiative)"]) 
        ? cohort["Name (from Initiative)"][0] 
        : cohort["Name (from Initiative)"];
    } else if (cohort["Short Name (from Initiative)"]) {
      initiativeName = Array.isArray(cohort["Short Name (from Initiative)"]) 
        ? cohort["Short Name (from Initiative)"][0] 
        : cohort["Short Name (from Initiative)"];
    } else if (cohort["Initiative Name"]) {
      initiativeName = cohort["Initiative Name"];
    } else if (cohort["Initiative"] && Array.isArray(cohort["Initiative"]) && cohort["Initiative"].length > 0) {
      // Just show the initiative ID if that's all we have
      initiativeName = `Initiative ${cohort["Initiative"][0]}`;
    }
    
    // Get topics
    const topics = cohort["Name (from Topics)"] || [];
    
    // Get classes
    const classes = cohort["Name (from Classes)"] || [];
    
    // Set button action based on the Action Button field
    const actionButtonText = cohort["Action Button"] || "Apply Now";
    
    // Set status indicator
    const status = cohort["Status"] || "Unknown";
    
    // Define different action button styles based on status
    const buttonStyle = {
      ...styles.actionButton,
      backgroundColor: status === "Applications Open" ? "var(--color-primary)" : "var(--color-secondary)",
    };
    
    return (
      <div key={cohort.id} style={styles.cohortCard}>
        <div style={styles.cohortHeader}>
          <div>
            <h3 style={styles.cohortTitle}>{initiativeName}</h3>
            <div style={styles.badgesContainer}>
              {/* Only show topic badges if topics exist */}
              {topics && topics.length > 0 && 
                topics.map((topic, index) => (
                  <span key={`topic-${index}`} style={styles.topicBadge}>{topic}</span>
                ))
              }
              
              {/* Only show class badges if classes exist */}
              {classes && classes.length > 0 && 
                classes.map((className, index) => (
                  <span key={`class-${index}`} style={styles.classBadge}>{className}</span>
                ))
              }
              
              <span style={{
                ...styles.statusBadge,
                backgroundColor: status === "Applications Open" ? "#dff0d8" : "#f2dede",
                color: status === "Applications Open" ? "#3c763d" : "#a94442",
              }}>
                {status}
              </span>
            </div>
          </div>
        </div>
        
        <div style={styles.cohortContent}>
          <div style={styles.actionButtonContainer}>
            <button style={buttonStyle} disabled={status !== "Applications Open"}>
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
            
            {/* Add debug info */}
            {process.env.NODE_ENV !== 'production' && (
              <div style={styles.debugInfo}>
                <p><strong>Institution ID:</strong> {profile.institution?.id || 'Not available'}</p>
                <p><strong>Cohorts data available:</strong> {profile.cohorts ? 'Yes' : 'No'}</p>
                <p><strong>Number of cohorts:</strong> {profile.cohorts?.length || 0}</p>
                {profile.cohorts && profile.cohorts.length > 0 && (
                  <div>
                    <p><strong>Cohort IDs:</strong></p>
                    <ul>
                      {profile.cohorts.map((cohort, index) => (
                        <li key={index}>{cohort.id} - Status: {cohort.Status || 'Unknown'}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Add check action */}
                <div style={styles.debugActions}>
                  <button 
                    onClick={async () => {
                      if (!profile.institution?.id) {
                        alert("No institution ID available");
                        return;
                      }
                      
                      try {
                        // Try to fetch partnerships directly
                        const response = await fetch(`/api/debug/partnerships?institutionId=${profile.institution.id}`);
                        const data = await response.json();
                        console.log("Debug partnerships data:", data);
                        alert(`Found ${data.partnerships?.length || 0} partnerships and ${data.cohorts?.length || 0} cohorts.\nCheck console for details.`);
                      } catch (error) {
                        console.error("Error checking partnerships:", error);
                        alert(`Error checking partnerships: ${error.message}`);
                      }
                    }}
                    style={styles.debugButton}
                  >
                    Check Partnerships
                  </button>
                </div>
              </div>
            )}
            
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
  debugInfo: {
    backgroundColor: "#f9f9f9",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    marginBottom: "20px",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
  },
  debugActions: {
    marginTop: "10px",
    borderTop: "1px solid #ddd",
    paddingTop: "10px",
  },
  debugButton: {
    padding: "5px 10px",
    backgroundColor: "#333",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
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
  badgesContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  },
  topicBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#e0f7fa",
    color: "#00838f",
    borderRadius: "4px",
    fontSize: "0.8rem",
  },
  classBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#fff3e0",
    color: "#e65100",
    borderRadius: "4px",
    fontSize: "0.8rem",
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
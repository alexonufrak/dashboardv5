"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import DashboardHeader from "../components/DashboardHeader"
import ProfileCard from "../components/ProfileCard"
import TeamCard from "../components/TeamCard"
import LoadingScreen from "../components/LoadingScreen"

const Dashboard = () => {
  const { user, isLoading: isUserLoading } = useUser()
  const [profile, setProfile] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTeamLoading, setIsTeamLoading] = useState(true)
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

    const fetchTeamData = async () => {
      try {
        const response = await fetch("/api/user/team")
        if (!response.ok) {
          throw new Error("Failed to fetch team data")
        }
        const data = await response.json()
        setTeamData(data.team)
      } catch (err) {
        console.error("Error fetching team data:", err)
      } finally {
        setIsTeamLoading(false)
      }
    }

    if (user) {
      fetchProfile()
      fetchTeamData()
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
    // Debug: Log the entire cohort object to see its structure
    console.log("Cohort object:", cohort);
    
    // Get initiative name from enhancedCohorts data
    const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative";
    
    // Get topics and classes from our enhanced data
    const topics = cohort.topicNames || [];
    const classes = cohort.classNames || [];
    
    // Debug: Log what we found
    console.log("Topics from enhanced data:", topics);
    console.log("Classes from enhanced data:", classes);
    
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
              {Array.isArray(topics) && topics.length > 0 && 
                topics.map((topic, index) => (
                  <span key={`topic-${index}`} style={styles.topicBadge}>{topic}</span>
                ))
              }
              
              {/* Only show class badges if classes exist */}
              {Array.isArray(classes) && classes.length > 0 && 
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
          
          <div style={styles.teamSection}>
            <h2 style={styles.sectionHeading}>Your Team</h2>
            {isTeamLoading ? (
              <div style={styles.card}>
                <p style={styles.loadingText}>Loading team information...</p>
              </div>
            ) : (
              <>
                <TeamCard team={teamData} />
                {process.env.NODE_ENV !== 'production' && (
                  <div style={styles.debugInfo}>
                    <p><strong>Team Data:</strong> {teamData ? 'Available' : 'Not available'}</p>
                    <p><strong>Contact ID:</strong> {profile?.contactId || 'Not available'}</p>
                    <div style={styles.debugActions}>
                      <button 
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/debug/team-data');
                            const data = await response.json();
                            console.log("Debug team data:", data);
                            
                            // Create a more user-friendly summary
                            const summary = [
                              `Contact ID: ${data.contactId}`,
                              `Email: ${data.email}`,
                              `Member records: ${data.memberRecords?.length || 0}`,
                              `Team records: ${data.teamRecords?.length || 0}`,
                              `Table IDs configured: ${data.tableConfig.membersTableId ? 'Yes' : 'No'} (Members), ${data.tableConfig.teamsTableId ? 'Yes' : 'No'} (Teams)`,
                            ];
                            
                            if (data.memberRecords?.length === 0) {
                              summary.push("ISSUE: No member records found for this user");
                            } else if (data.extractedTeamIds?.length === 0) {
                              summary.push("ISSUE: Member records don't have Team links");
                            } else if (data.memberAnalysis?.activeMembers === 0) {
                              summary.push(`ISSUE: No ACTIVE members (statuses: ${data.memberAnalysis.statuses.join(', ')})`);
                            } else if (data.teamRecords?.length === 0) {
                              summary.push("ISSUE: Team records not found");
                            }
                            
                            alert(summary.join('\n'));
                          } catch (error) {
                            console.error("Error debugging teams:", error);
                            alert(`Error debugging teams: ${error.message}`);
                          }
                        }}
                        style={styles.debugButton}
                      >
                        Enhanced Team Debug
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
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
  teamSection: {
    width: "100%",
    marginBottom: "10px",
  },
  cohortsSection: {
    width: "100%",
  },
  sectionHeading: {
    fontSize: "1.5rem",
    color: "var(--color-primary)",
    marginBottom: "15px",
  },
  loadingText: {
    padding: "20px",
    textAlign: "center",
    color: "var(--color-secondary)",
    fontStyle: "italic",
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
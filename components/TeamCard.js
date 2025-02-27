// components/TeamCard.js
import { useState } from "react"

const TeamCard = ({ team }) => {
  const [expanded, setExpanded] = useState(false)
  
  // If no team data is provided, show a not found message
  if (!team) {
    return (
      <div style={styles.card}>
        <p style={styles.notFound}>You are not currently part of any team.</p>
      </div>
    )
  }
  
  // Get active members only
  const activeMembers = team.members ? team.members.filter(member => member.status === "Active") : []
  
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.teamName}>{team.name}</h3>
          <p style={styles.teamPoints}>Team Points: <span style={styles.points}>{team.points || 0}</span></p>
        </div>
        <button 
          style={styles.expandButton} 
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse team details" : "Expand team details"}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>
      
      {expanded && (
        <div style={styles.expandedContent}>
          <div style={styles.description}>
            <h4 style={styles.sectionTitle}>Description</h4>
            <p>{team.description || "No description available."}</p>
          </div>
          
          <div style={styles.members}>
            <h4 style={styles.sectionTitle}>Team Members ({activeMembers.length})</h4>
            {activeMembers.length > 0 ? (
              <ul style={styles.membersList}>
                {activeMembers.map((member, index) => (
                  <li key={member.id || index} style={styles.memberItem}>
                    <div style={styles.memberInfo}>
                      <span style={styles.memberName}>
                        {member.name}
                        {member.isCurrentUser && <span style={styles.currentUser}> (You)</span>}
                      </span>
                    </div>
                    <div style={styles.memberPoints}>
                      <span style={styles.pointsLabel}>Points: </span>
                      <span style={styles.pointsValue}>{member.points || 0}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={styles.noMembers}>No active team members found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: "var(--color-white)",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    marginBottom: "20px",
  },
  header: {
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: expanded => expanded ? "1px solid #eee" : "none",
  },
  teamName: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    color: "var(--color-primary)",
    marginBottom: "8px",
  },
  teamPoints: {
    fontSize: "1rem",
    color: "var(--color-secondary)",
  },
  points: {
    fontWeight: "bold",
    color: "var(--color-dark)",
  },
  expandButton: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--color-light)",
    border: "1px solid #ddd",
    color: "var(--color-primary)",
    fontSize: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    outline: "none",
    transition: "background-color 0.2s ease",
    padding: 0,
    lineHeight: 1,
  },
  expandedContent: {
    padding: "20px",
  },
  description: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    marginBottom: "10px",
    borderBottom: "1px solid #eee",
    paddingBottom: "8px",
  },
  members: {},
  membersList: {
    listStyleType: "none",
    padding: 0,
  },
  memberItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  memberInfo: {
    display: "flex",
    flexDirection: "column",
  },
  memberName: {
    fontWeight: "600",
  },
  currentUser: {
    fontStyle: "italic",
    color: "var(--color-primary)",
  },
  memberRole: {
    fontSize: "0.9rem",
    color: "var(--color-secondary)",
  },
  memberPoints: {},
  pointsLabel: {
    fontSize: "0.9rem",
    color: "var(--color-secondary)",
  },
  pointsValue: {
    fontWeight: "bold",
  },
  notFound: {
    padding: "20px",
    textAlign: "center",
    color: "var(--color-secondary)",
    fontStyle: "italic",
  },
  noMembers: {
    fontStyle: "italic",
    color: "var(--color-secondary)",
  },
}

export default TeamCard
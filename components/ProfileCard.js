const ProfileCard = ({ profile, onEditClick }) => {
  // Use real data or fallback to placeholders if no profile is provided
  const userData = profile || {};
  
  // Get profile picture from Airtable or Auth0
  const profilePicture = userData.Headshot || userData.picture || '/placeholder-user.jpg';
  
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.profilePicture}>
          <img 
            src={profilePicture} 
            alt={userData.name || "Profile"} 
            style={styles.profileImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-user.jpg';
            }}
          />
        </div>
        <div style={styles.profileInfo}>
          <h2 style={styles.name}>{userData.name || "No Name"}</h2>
          <p style={styles.email}>{userData.email || "No Email"}</p>
        </div>
        {onEditClick && (
          <button 
            onClick={onEditClick} 
            style={styles.editButton}
            aria-label="Edit profile"
          >
            Edit
          </button>
        )}
      </div>

      <div style={styles.academicInfo}>
        <h3 style={styles.sectionHeading}>Academic Information</h3>
        
        {userData.needsInstitutionConfirm && userData.suggestedInstitution && (
          <div style={styles.institutionAlert}>
            <p style={styles.alertTitle}>Is this your institution?</p>
            <p style={styles.alertText}>
              Based on your email domain, we think you might be from <strong>{userData.suggestedInstitution.name}</strong>.
            </p>
            <button onClick={onEditClick} style={styles.confirmButton}>
              Confirm Institution
            </button>
          </div>
        )}
        
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.label}>Institution:</span>
            <span style={styles.value}>{userData.institutionName || "Not specified"}</span>
            {userData.needsInstitutionConfirm && (
              <span style={styles.pendingTag}>Needs confirmation</span>
            )}
          </div>
          <div style={styles.infoItem}>
            <span style={styles.label}>Degree Type:</span>
            <span style={styles.value}>{userData.degreeType || "Not specified"}</span>
          </div>
          {userData.showMajor && (
            <div style={styles.infoItem}>
              <span style={styles.label}>Major:</span>
              <span style={styles.value}>{userData.major || "Not specified"}</span>
            </div>
          )}
          <div style={styles.infoItem}>
            <span style={styles.label}>Graduation Year:</span>
            <span style={styles.value}>{userData.graduationYear || "Not specified"}</span>
          </div>
        </div>
      </div>

      <div style={userData.isProfileComplete ? styles.completeStatus : styles.incompleteStatus}>
        {userData.isProfileComplete ? (
          <>
            <span style={styles.statusIcon}>✓</span>
            Profile Complete
          </>
        ) : (
          <>
            <span style={styles.statusIcon}>⚠</span>
            Profile Incomplete - {onEditClick && (
              <button onClick={onEditClick} style={styles.updateButton}>
                Update Your Information
              </button>
            )}
          </>
        )}
      </div>
      
      {!userData.institution?.id && !userData.suggestedInstitution && (
        <div style={styles.educationPrompt}>
          <p style={styles.promptMessage}>
            Please add your education information to see available programs for your institution.
          </p>
          {onEditClick && (
            <button onClick={onEditClick} style={styles.promptButton}>
              Add Education Details
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    padding: "20px",
    marginBottom: "20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
  },
  profilePicture: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    marginRight: "20px",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  editButton: {
    backgroundColor: "var(--color-primary, #4285f4)",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    marginLeft: "10px",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  email: {
    color: "#555",
    fontSize: "1rem",
  },
  academicInfo: {
    marginBottom: "20px",
  },
  sectionHeading: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontWeight: "bold",
    marginBottom: "5px",
  },
  value: {
    color: "#333",
  },
  completeStatus: {
    backgroundColor: "#dff6dd",
    color: "#107c10",
    padding: "10px",
    borderRadius: "4px",
    textAlign: "center",
    fontWeight: "bold",
  },
  incompleteStatus: {
    backgroundColor: "#fff4ce",
    color: "#815001",
    padding: "10px",
    borderRadius: "4px",
    textAlign: "center",
    fontWeight: "bold",
  },
  statusIcon: {
    marginRight: "8px",
  },
  updateButton: {
    backgroundColor: "transparent",
    color: "inherit",
    border: "none",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: "bold",
    padding: 0,
    display: "inline",
    fontSize: "inherit",
  },
  educationPrompt: {
    marginTop: "15px",
    padding: "12px",
    backgroundColor: "#e3f2fd",
    borderRadius: "6px",
    border: "1px solid #bbdefb",
  },
  promptMessage: {
    margin: "0 0 10px 0",
    color: "#0d47a1",
    fontWeight: "500",
  },
  promptButton: {
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 12px",
    fontWeight: "500",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  institutionAlert: {
    backgroundColor: "#e3f2fd",
    borderRadius: "6px",
    padding: "15px",
    marginBottom: "20px",
    border: "1px solid #bbdefb",
  },
  alertTitle: {
    fontWeight: "bold",
    fontSize: "1.1rem",
    marginTop: 0,
    marginBottom: "8px",
    color: "#0d47a1",
  },
  alertText: {
    marginBottom: "15px",
    fontSize: "0.95rem",
  },
  confirmButton: {
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 12px",
    fontWeight: "500",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  pendingTag: {
    display: "inline-block",
    backgroundColor: "#fff3cd",
    color: "#856404",
    borderRadius: "3px",
    padding: "2px 6px",
    fontSize: "0.75rem",
    marginTop: "5px",
    fontWeight: "bold",
  },
}

export default ProfileCard
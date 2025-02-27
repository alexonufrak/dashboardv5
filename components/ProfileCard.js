const ProfileCard = ({ profile }) => {
  // Use real data or fallback to placeholders if no profile is provided
  const userData = profile || {};
  
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.profilePicture}></div>
        <div style={styles.profileInfo}>
          <h2 style={styles.name}>{userData.name || "No Name"}</h2>
          <p style={styles.email}>{userData.email || "No Email"}</p>
        </div>
      </div>

      <div style={styles.academicInfo}>
        <h3 style={styles.sectionHeading}>Academic Information</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.label}>Institution:</span>
            <span style={styles.value}>{userData.institutionName || "Not specified"}</span>
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
            Profile Incomplete - Please update your information
          </>
        )}
      </div>
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
}

export default ProfileCard
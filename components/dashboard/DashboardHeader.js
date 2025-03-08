import Link from "next/link"
import Logo from "@/components/common/Logo"

const DashboardHeader = ({ profile }) => {
  // Get first name from full name or use "Student" as fallback
  const firstName = profile?.name ? profile.name.split(' ')[0] : "Student";
  
  return (
    <header style={styles.header}>
      <div style={styles.headerTop}>
        <Logo variant="horizontal" color="eden" height={40} className="mb-4" />
        <h1 style={styles.heading}>Welcome, {firstName}!</h1>
        <p style={styles.subtitle}>
          Welcome to your xFoundry student dashboard. Here you can view your profile information and explore available programs.
        </p>
      </div>
      {!profile?.isProfileComplete && (
        <div style={styles.alert}>
          <span style={styles.warningIcon}>⚠</span>
          <div style={styles.alertContent}>
            <p style={styles.alertText}>
              <strong>Please complete your profile</strong>
            </p>
            <p style={styles.alertDescription}>
              Your profile is incomplete. Complete your profile to unlock all features and opportunities.
            </p>
            <Link href="/profile" style={styles.updateButton}>
              Update Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

const styles = {
  header: {
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    padding: "30px 20px",
    marginBottom: "30px",
  },
  headerTop: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "10px",
    color: "var(--color-primary)",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#555",
    marginBottom: "20px",
  },
  alert: {
    backgroundColor: "#fff4ce",
    color: "#815001",
    padding: "15px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "flex-start",
  },
  warningIcon: {
    fontSize: "1.5rem",
    marginRight: "15px",
  },
  alertContent: {
    flex: 1,
  },
  alertText: {
    fontWeight: "bold",
    marginBottom: "5px",
  },
  alertDescription: {
    marginBottom: "15px",
  },
  updateButton: {
    display: "inline-block",
    backgroundColor: "var(--color-primary)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "4px",
    textDecoration: "none",
    fontWeight: "bold",
    transition: "background-color 0.3s ease",
  },
}

export default DashboardHeader
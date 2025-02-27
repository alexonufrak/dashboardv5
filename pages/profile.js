"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import LoadingScreen from "../components/LoadingScreen"

const Profile = () => {
  const { user, isLoading: isUserLoading } = useUser()
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    degreeType: "",
    major: "",
    graduationYear: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile")
        if (!response.ok) {
          throw new Error("Failed to fetch profile")
        }
        const data = await response.json()
        setProfile(data)
        
        // Initialize form with profile data
        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          degreeType: data.degreeType || "",
          major: data.major || "",
          graduationYear: data.graduationYear || ""
        })
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsUpdating(true)
    setError(null)
    setSuccessMessage("")

    try {
      // Add contact ID to the update data
      const updateData = {
        ...formData,
        contactId: profile.contactId
      }
      
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setSuccessMessage("Profile updated successfully!")
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isUserLoading || isLoading) {
    return <LoadingScreen />
  }

  return (
    <Layout title="xFoundry Profile">
      <div style={styles.container}>
        <h1 style={styles.heading}>Your Profile</h1>

        {successMessage && <div style={styles.successMessage}>{successMessage}</div>}
        {error && <div style={styles.errorMessage}>{error}</div>}

        <div style={styles.card}>
          <div style={styles.profileHeader}>
            <div style={styles.profilePicture}></div>
            <div style={styles.profileInfo}>
              <h2 style={styles.name}>{profile.name || ""}</h2>
              <p style={styles.email}>{profile.email || ""}</p>
              <p style={styles.institution}>
                {profile.institutionName || profile.institution?.name || ""}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <h3 style={styles.sectionHeading}>Personal Information</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="firstName" style={styles.label}>
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="lastName" style={styles.label}>
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
            </div>

            <h3 style={styles.sectionHeading}>Academic Information</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="institution" style={styles.label}>
                  Institution
                </label>
                <input
                  type="text"
                  id="institution"
                  value={profile.institutionName || profile.institution?.name || ""}
                  style={styles.input}
                  disabled
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="degreeType" style={styles.label}>
                  Degree Type
                </label>
                <select
                  id="degreeType"
                  name="degreeType"
                  value={formData.degreeType}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="">Select Degree Type</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                  <option value="Associate">Associate</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Undergraduate">Undergraduate</option>
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="major" style={styles.label}>
                  Major/Field of Study
                </label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="graduationYear" style={styles.label}>
                  Graduation Year
                </label>
                <input
                  type="text"
                  id="graduationYear"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.buttonContainer}>
              <button type="submit" style={styles.button} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps = withPageAuthRequired()

export default Profile

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
  },
  heading: {
    fontSize: "2rem",
    color: "var(--color-primary)",
    marginBottom: "20px",
  },
  successMessage: {
    backgroundColor: "#dff0d8",
    color: "#3c763d",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  errorMessage: {
    backgroundColor: "#f2dede",
    color: "#a94442",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  card: {
    backgroundColor: "var(--color-white)",
    borderRadius: "8px",
    padding: "30px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "30px",
  },
  profilePicture: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "var(--color-light)",
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
    color: "var(--color-secondary)",
    marginBottom: "5px",
  },
  institution: {
    color: "var(--color-primary)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sectionHeading: {
    fontSize: "1.2rem",
    color: "var(--color-primary)",
    marginBottom: "10px",
  },
  formRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
  },
  formGroup: {
    flex: "1 1 calc(50% - 10px)",
    minWidth: "200px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    color: "var(--color-dark)",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid var(--color-secondary)",
    fontSize: "1rem",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "20px",
  },
  button: {
    backgroundColor: "var(--color-primary)",
    color: "var(--color-white)",
    border: "none",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
}
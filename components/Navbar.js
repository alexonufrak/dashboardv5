"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useState, useEffect } from "react"
import ProfileEditModal from "./ProfileEditModal"

const Navbar = () => {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  // Fetch user profile when needed
  useEffect(() => {
    const fetchProfile = async () => {
      if (user && isProfileModalOpen && !profile) {
        setIsProfileLoading(true)
        try {
          const response = await fetch("/api/user/profile")
          if (response.ok) {
            const data = await response.json()
            setProfile(data)
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
        } finally {
          setIsProfileLoading(false)
        }
      }
    }
    
    fetchProfile()
  }, [user, isProfileModalOpen, profile])

  const handleOpenProfileModal = (e) => {
    e.preventDefault()
    setIsProfileModalOpen(true)
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
  }

  const handleProfileUpdate = async (updatedData) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      
      // If we're on the dashboard, refresh the page to show updated data
      if (router.pathname === "/dashboard") {
        router.reload();
      }
      
      return updatedProfile;
    } catch (err) {
      console.error("Error updating profile:", err);
      throw err;
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <Link href="/" className="logo">
            xFoundry
          </Link>
          <div className="nav-links">
            {isLoading ? (
              <span>Loading...</span>
            ) : user ? (
              <>
                <Link href="/dashboard" className={router.pathname === "/dashboard" ? "active" : ""}>
                  Dashboard
                </Link>
                <a href="#" onClick={handleOpenProfileModal} className={router.pathname === "/profile" ? "active" : ""}>
                  Profile
                </a>
                <div className="sign-out-button">
                  <a href="/api/auth/logout" className="logout">
                    Sign Out
                  </a>
                </div>
                {user.picture && (
                  <div className="profile-picture-container">
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="profile-picture"
                    />
                  </div>
                )}
              </>
            ) : (
              <Link href="/login" className="login">
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>
      
      {isProfileModalOpen && (
        <ProfileEditModal 
          isOpen={isProfileModalOpen} 
          onClose={handleCloseProfileModal} 
          profile={profile}
          onSave={handleProfileUpdate}
        />
      )}

      <style jsx>{`
        .navbar {
          height: 70px;
          background-color: var(--color-white);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          width: 100%;
        }
        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 100%;
        }
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--color-primary);
          text-decoration: none;
        }
        .nav-links {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .nav-links a {
          color: var(--color-dark);
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .nav-links a:hover {
          color: var(--color-primary);
        }
        .nav-links a.active {
          color: var(--color-primary);
          font-weight: 600;
        }
        .sign-out-button {
          margin-left: 10px;
        }
        .logout {
          background-color: var(--color-danger);
          color: white !important;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        .logout:hover {
          background-color: #c82333;
        }
        .login {
          color: var(--color-primary) !important;
          font-weight: 600;
        }
        .login:hover {
          text-decoration: underline;
        }
        .profile-picture-container {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
        }
        .profile-picture {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </>
  )
}

export default Navbar
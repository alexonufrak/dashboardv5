"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import Image from "next/image"

const Navbar = () => {
  const router = useRouter()
  const { user, isLoading } = useUser()

  return (
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
              <Link href="/profile" className={router.pathname === "/profile" ? "active" : ""}>
                Profile
              </Link>
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
            <a href="/api/auth/login" className="login">
              Log In
            </a>
          )}
        </div>
      </div>

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
    </nav>
  )
}

export default Navbar
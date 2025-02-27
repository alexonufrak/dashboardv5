"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const LoginModal = ({ isOpen, onClose, initialEmail = "" }) => {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState("");
  const [institutionStatus, setInstitutionStatus] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [userExists, setUserExists] = useState(null);
  
  // Update email if initialEmail prop changes
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);
  
  if (!isOpen) return null;

  // Function to verify the institution and check if user exists
  const verifyEmailAndInstitution = async () => {
    // Basic email validation
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    setIsVerifying(true);
    setEmailError("");
    setInstitutionStatus(null);
    setUserExists(null);
    
    try {
      console.log(`Checking if email exists: ${email}`);
      // First check if the user already exists
      const userCheckResponse = await fetch("/api/user/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      console.log(`User check response status: ${userCheckResponse.status}`);
      
      if (!userCheckResponse.ok) {
        console.error("Failed user check response:", userCheckResponse);
        throw new Error("Failed to check user existence");
      }
      
      const userCheckData = await userCheckResponse.json();
      console.log("User check data:", userCheckData);
      
      // Set whether the user exists
      setUserExists(userCheckData.exists);
      
      // Check institution regardless of whether user exists
      console.log(`Verifying institution for email: ${email}`);
      const institutionResponse = await fetch("/api/institution-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (!institutionResponse.ok) {
        throw new Error("Failed to verify institution");
      }
      
      const data = await institutionResponse.json();
      console.log("Institution lookup response:", data);
      
      if (data.success) {
        console.log(`Institution found: ${data.institution.name}`);
        setInstitution(data.institution);
        setInstitutionStatus("success");
      } else {
        console.log("No matching institution found");
        setInstitutionStatus("error");
      }
    } catch (error) {
      console.error("Error verifying email or institution:", error);
      setInstitutionStatus("error");
    } finally {
      setIsVerifying(false);
    }
  };

  // Function to proceed to login or signup based on user existence
  const proceedToAuth = () => {
    setIsRedirecting(true);
    const encodedEmail = encodeURIComponent(email);
    
    if (userExists) {
      // If user exists, redirect to login with email prefilled
      window.location.href = `/api/auth/login?login_hint=${encodedEmail}`;
    } else {
      // If user doesn't exist, redirect to signup with email prefilled
      router.push(`/signup?email=${encodedEmail}`);
    }
  };

  // Handle clicking outside the modal to close it
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={handleOverlayClick}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Sign In to xFoundry</h3>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div style={styles.modalBody}>
          <p style={styles.description}>
            Please enter your institutional email to continue. 
            We'll verify your institution and check if you already have an account.
          </p>
          
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Institutional Email 
              <span style={styles.tooltipIcon} title="Use your school email (e.g., name@school.edu)">ⓘ</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@school.edu"
              style={styles.input}
              disabled={isVerifying || isRedirecting}
            />
            {emailError && <div style={styles.errorText}>{emailError}</div>}
          </div>
          
          {/* Only show verify button when not yet verified or there was an error */}
          {(institutionStatus === null || institutionStatus === "error") && (
            <button 
              onClick={verifyEmailAndInstitution}
              style={styles.verifyButton}
              disabled={isVerifying || !email || isRedirecting}
            >
              {isVerifying ? "Verifying..." : "Continue"}
            </button>
          )}
          
          {/* User exists message */}
          {userExists === true && institutionStatus === "success" && (
            <div style={styles.successBadge}>
              <span style={styles.badgeIcon}>✓</span>
              Welcome back! Your account was found. Continue to sign in.
            </div>
          )}
          
          {/* User doesn't exist message */}
          {userExists === false && institutionStatus === "success" && (
            <div style={styles.infoBadge}>
              <span style={styles.badgeIcon}>ℹ</span>
              No account found with this email. Continue to create a new account.
            </div>
          )}
          
          {/* Institution verification success */}
          {institutionStatus === "success" && (
            <div style={styles.institutionBadge}>
              <span style={styles.badgeIcon}>✓</span>
              Verified: {institution.name}
            </div>
          )}
          
          {/* Institution verification error */}
          {institutionStatus === "error" && (
            <div style={styles.errorBadge}>
              <span style={styles.badgeIcon}>✕</span>
              Institution not recognized. Please use your institutional email.
            </div>
          )}
          
          {/* Sign In button - only shown when user exists */}
          {institutionStatus === "success" && userExists === true && (
            <button
              onClick={proceedToAuth}
              style={styles.continueButton}
              disabled={isRedirecting}
            >
              {isRedirecting ? "Redirecting..." : "Sign In to Your Account"}
            </button>
          )}
          
          {/* Create Account button - only shown when user doesn't exist */}
          {institutionStatus === "success" && userExists === false && (
            <button
              onClick={proceedToAuth}
              style={styles.continueButton}
              disabled={isRedirecting}
            >
              {isRedirecting ? "Redirecting..." : "Create New Account"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Darker background
    backdropFilter: "blur(5px)", // Blur effect
    WebkitBackdropFilter: "blur(5px)", // Safari support
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "var(--color-primary, #333)",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#777",
  },
  modalBody: {
    padding: "20px",
  },
  description: {
    color: "var(--color-dark, #333)",
    marginBottom: "20px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "500",
    color: "var(--color-dark, #333)",
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #ddd",
    transition: "border-color 0.3s ease",
  },
  tooltipIcon: {
    marginLeft: "5px",
    fontSize: "14px",
    color: "var(--color-secondary, #666)",
    cursor: "help",
  },
  errorText: {
    color: "var(--color-danger, #dc3545)",
    fontSize: "0.9rem",
    marginTop: "5px",
  },
  verifyButton: {
    backgroundColor: "var(--color-primary, #007bff)",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    marginBottom: "20px",
    transition: "background-color 0.3s ease",
    width: "100%",
  },
  successBadge: {
    backgroundColor: "#d4edda",
    color: "#155724",
    padding: "12px 15px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    fontWeight: "500",
  },
  infoBadge: {
    backgroundColor: "#cce5ff",
    color: "#004085",
    padding: "12px 15px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    fontWeight: "500",
  },
  institutionBadge: {
    backgroundColor: "#f0f8ff",
    color: "#0366d6",
    padding: "12px 15px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    fontWeight: "500",
  },
  errorBadge: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "12px 15px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    fontWeight: "500",
  },
  badgeIcon: {
    marginRight: "10px",
    fontSize: "1.2rem",
  },
  continueButton: {
    backgroundColor: "var(--color-success, #28a745)",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    width: "100%",
  },
};

export default LoginModal;
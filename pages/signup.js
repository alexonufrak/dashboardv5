"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/router"
import Layout from "../components/Layout"
import { useUser } from "@auth0/nextjs-auth0/client"
import LoadingScreen from "../components/LoadingScreen"

// SignupStep component to handle each step of the form
const SignupStep = ({ currentStep, stepNumber, children }) => {
  // Calculate whether this step is active to determine display properties
  const isActive = currentStep === stepNumber;
  
  return (
    <div 
      style={{
        ...styles.formStep,
        transform: `translateX(${(stepNumber - currentStep) * 100}%)`,
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 1 : 0,
        // When not active, remove from layout flow to prevent issues with container sizing
        position: isActive ? 'relative' : 'absolute',
        display: isActive ? 'block' : 'none',
      }}
    >
      {children}
    </div>
  );
};

// Main SignUp component
export default function SignUp() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [institutionStatus, setInstitutionStatus] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    graduationYear: "",
    degreeType: "",
    referralSource: ""
  });
  const formStepRefs = useRef([]);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
    
    // Get email from URL query parameters if available
    if (router.query.email) {
      setEmail(router.query.email);
      // Automatically initiate verification if email is provided via URL
      if (router.query.email.includes('@')) {
        // Need to wait for component to fully mount
        setTimeout(() => verifyInstitution(), 500);
      }
    }
  }, [user, router, router.query]);

  // Function to check email domain against institution domains and check if user exists
  const verifyInstitution = async () => {
    // Basic email validation
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    setIsVerifying(true);
    setEmailError("");
    setInstitutionStatus(null);
    
    try {
      console.log(`Verifying institution for email: ${email}`);
      
      // First check if the user already exists
      console.log(`Checking if email exists: ${email}`);
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
      
      // If user exists, show message and prepare for redirect
      if (userCheckData.exists) {
        console.log("User already exists, redirecting to login");
        setUserExists(true);
        setIsRedirecting(true);
        
        // Delay redirect to show message to user for 2 seconds
        setTimeout(() => {
          // Encode the email to use as a query parameter
          const encodedEmail = encodeURIComponent(email);
          window.location.href = `/api/auth/login?login_hint=${encodedEmail}`;
        }, 2000);
        return;
      }
      
      // If user doesn't exist, continue with institution verification
      const response = await fetch("/api/institution-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to verify institution");
      }
      
      const data = await response.json();
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
      console.error("Error verifying institution:", error);
      setInstitutionStatus("error");
    } finally {
      setIsVerifying(false);
    }
  };

  // Function to handle input changes for personal info form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Function to continue to the next step
  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Function to go back to the previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Function to handle the Google sign up/in
  const handleGoogleSignup = () => {
    // Create query params with user data for Auth0
    const queryParams = new URLSearchParams({
      institution: institution?.name || "",
      institutionId: institution?.id || "",
      degreeType: formData.degreeType,
      graduationYear: formData.graduationYear,
      firstName: formData.firstName,
      lastName: formData.lastName,
      referralSource: formData.referralSource,
      login_hint: email, // Pre-fill email in Auth0
    }).toString();
    
    // Redirect to Auth0 login with Google, directly bypassing the Auth0 login screen if possible
    window.location.href = `/api/auth/login?connection=google-oauth2&${queryParams}&prompt=login`;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Layout title="Sign Up - xFoundry">
      <div style={styles.container}>
        <h1 style={styles.heading}>Create Your xFoundry Account</h1>
        
        <div style={styles.formContainer}>
          {/* Step indicators */}
          <div style={styles.stepIndicators}>
            <div style={{
              ...styles.stepIndicator,
              backgroundColor: currentStep >= 1 ? "var(--color-primary)" : "var(--color-secondary)"
            }}>1</div>
            <div style={styles.stepConnector}></div>
            <div style={{
              ...styles.stepIndicator,
              backgroundColor: currentStep >= 2 ? "var(--color-primary)" : "var(--color-secondary)"
            }}>2</div>
          </div>
          
          <div style={styles.formStepsContainer}>
            {/* Step 1: Email verification */}
            <SignupStep currentStep={currentStep} stepNumber={1}>
              <h2 style={styles.stepHeading}>Verify Your Institution</h2>
              <p style={styles.stepDescription}>
                Enter your institutional email to get started. We'll verify that your school is part of our network.
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
                  disabled={isVerifying}
                />
                {emailError && <div style={styles.errorText}>{emailError}</div>}
              </div>
              
              <button 
                onClick={verifyInstitution}
                style={styles.verifyButton}
                disabled={isVerifying || !email || isRedirecting}
              >
                {isVerifying ? "Verifying..." : "Verify Institution"}
              </button>
              
              {/* User exists message */}
              {userExists && (
                <div style={styles.redirectBadge}>
                  <span style={styles.badgeIcon}>ℹ</span>
                  An account with this email already exists. Redirecting you to the login page...
                </div>
              )}
              
              {/* Institution verification result */}
              {institutionStatus === "success" && !userExists && (
                <div style={styles.successBadge}>
                  <span style={styles.badgeIcon}>✓</span>
                  Verified: {institution.name}
                </div>
              )}
              
              {institutionStatus === "error" && !userExists && (
                <div style={styles.errorBadge}>
                  <span style={styles.badgeIcon}>✕</span>
                  Institution not recognized. Contact support if you believe this is an error.
                  <button 
                    onClick={() => {
                      // For debugging purposes, show an alert with the domain
                      const domain = email.split('@')[1];
                      alert(`Domain being checked: ${domain}`);
                    }}
                    style={styles.debugButton}
                  >
                    Debug
                  </button>
                </div>
              )}
              
              {institutionStatus === "success" && !userExists && (
                <button
                  onClick={nextStep}
                  style={styles.continueButton}
                >
                  Continue
                </button>
              )}
            </SignupStep>
            
            {/* Step 2: Personal Information */}
            <SignupStep currentStep={currentStep} stepNumber={2}>
              <h2 style={styles.stepHeading}>Complete Your Profile</h2>
              <p style={styles.stepDescription}>
                Please provide the following information to complete your profile.
              </p>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label htmlFor="firstName" style={styles.label}>First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label htmlFor="lastName" style={styles.label}>Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label htmlFor="graduationYear" style={styles.label}>
                    Expected Graduation Year
                    <span style={styles.tooltipIcon} title="Year you expect to graduate">ⓘ</span>
                  </label>
                  <input
                    type="text"
                    id="graduationYear"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    placeholder="YYYY"
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label htmlFor="degreeType" style={styles.label}>Degree Type</label>
                  <select
                    id="degreeType"
                    name="degreeType"
                    value={formData.degreeType}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  >
                    <option value="">Select Degree Type</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Doctorate">Doctorate</option>
                    <option value="Certificate">Certificate</option>
                  </select>
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label htmlFor="referralSource" style={styles.label}>
                  How did you hear about xFoundry?
                  <span style={styles.tooltipIcon} title="Help us understand how you found us">ⓘ</span>
                </label>
                <select
                  id="referralSource"
                  name="referralSource"
                  value={formData.referralSource}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                >
                  <option value="">Please select...</option>
                  <option value="Friend">Friend or Classmate</option>
                  <option value="Professor">Professor or Advisor</option>
                  <option value="Email">Email</option>
                  <option value="SocialMedia">Social Media</option>
                  <option value="Event">Campus Event</option>
                  <option value="Search">Search Engine</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div style={styles.buttonsRow}>
                <button onClick={prevStep} style={styles.backButton}>
                  Back
                </button>
                
                <button
                  onClick={handleGoogleSignup}
                  style={styles.googleButton}
                  disabled={!formData.firstName || !formData.lastName || !formData.graduationYear || !formData.degreeType}
                >
                  Continue with Google
                </button>
              </div>
            </SignupStep>
          </div>
        </div>
        
        <div style={styles.loginPrompt}>
          Already have an account? <a href="/api/auth/login" style={styles.loginLink}>Log in</a>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  heading: {
    fontSize: "2.5rem",
    textAlign: "center",
    color: "var(--color-primary)",
    marginBottom: "40px",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
    overflow: "visible", // Changed from hidden to visible
    padding: "30px",
    marginBottom: "30px",
    maxWidth: "100%",
  },
  stepIndicators: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "30px",
  },
  stepIndicator: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    transition: "background-color 0.3s ease",
  },
  stepConnector: {
    height: "2px",
    width: "80px",
    backgroundColor: "var(--color-secondary)",
    margin: "0 10px",
  },
  formStepsContainer: {
    position: "relative",
    overflow: "visible", // Changed from hidden to visible to prevent content being cut off
    width: "100%",
  },
  formStep: {
    width: "100%",
    transition: "transform 0.5s ease, opacity 0.5s ease",
    height: "auto", // Allow height to adjust to content
  },
  stepHeading: {
    fontSize: "1.5rem",
    color: "var(--color-primary)",
    marginBottom: "10px",
  },
  stepDescription: {
    color: "var(--color-secondary)",
    marginBottom: "30px",
  },
  formGroup: {
    marginBottom: "20px",
    flex: "1 1 calc(50% - 10px)",
    minWidth: "200px", // Ensure form fields don't get too narrow on small screens
  },
  formRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "15px", // Add bottom margin to ensure spacing between rows
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "500",
    color: "var(--color-dark)",
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
    color: "var(--color-secondary)",
    cursor: "help",
  },
  errorText: {
    color: "var(--color-danger)",
    fontSize: "0.9rem",
    marginTop: "5px",
  },
  verifyButton: {
    backgroundColor: "var(--color-primary)",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    marginBottom: "20px",
    transition: "background-color 0.3s ease",
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
  redirectBadge: {
    backgroundColor: "#e8f0fe",
    color: "#0d47a1",
    padding: "12px 15px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    fontWeight: "500",
    borderLeft: "4px solid #1976d2",
  },
  badgeIcon: {
    marginRight: "10px",
    fontSize: "1.2rem",
  },
  continueButton: {
    backgroundColor: "var(--color-success)",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  buttonsRow: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap", // Allow buttons to wrap on small screens
    gap: "15px", // Add gap between buttons
    marginTop: "30px",
    marginBottom: "10px", // Add bottom margin
  },
  backButton: {
    backgroundColor: "var(--color-light)",
    color: "var(--color-dark)",
    border: "1px solid var(--color-secondary)",
    padding: "12px 20px",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    flex: "0 1 auto", // Allow button to shrink but not grow
    minWidth: "100px", // Minimum width for the button
  },
  googleButton: {
    backgroundColor: "var(--color-primary)",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 1 auto", // Allow button to shrink but not grow
    minWidth: "150px", // Minimum width for the button
  },
  loginPrompt: {
    textAlign: "center",
    color: "var(--color-secondary)",
  },
  loginLink: {
    color: "var(--color-primary)",
    fontWeight: "500",
  },
  debugButton: {
    padding: "4px 8px",
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.8rem",
    cursor: "pointer",
    marginLeft: "10px",
  },
};
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import Layout from "../components/Layout";
import LoginModal from "../components/LoginModal";
import LoadingScreen from "../components/LoadingScreen";

export default function Login() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [email, setEmail] = useState("");

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }

    // Get email from URL query parameters if available
    if (router.query.email) {
      setEmail(router.query.email);
    }
  }, [user, router, router.query]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    router.push("/"); // Return to home page if modal is closed
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Layout title="Sign In - xFoundry">
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.contentCard}>
            <div style={styles.cardHeader}>
              <h1 style={styles.heading}>Welcome Back</h1>
              <p style={styles.subheading}>
                Sign in to access your xFoundry account and continue your journey.
              </p>
            </div>
            
            <LoginModal 
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              initialEmail={email}
            />
            
            <div style={styles.divider}>
              <span style={styles.dividerText}>Don't have an account?</span>
            </div>
            
            <div style={styles.alternateActions}>
              <a href="/signup" style={styles.secondaryButton}>Create Account</a>
            </div>
          </div>
          
          <div style={styles.infoPanel}>
            <div style={styles.infoPanelContent}>
              <h2 style={styles.infoPanelTitle}>Why Join xFoundry?</h2>
              <ul style={styles.benefitsList}>
                <li style={styles.benefitItem}>
                  <span style={styles.benefitIcon}>✓</span>
                  <span style={styles.benefitText}>Access to exclusive educational opportunities</span>
                </li>
                <li style={styles.benefitItem}>
                  <span style={styles.benefitIcon}>✓</span>
                  <span style={styles.benefitText}>Connect with mentors and fellow students</span>
                </li>
                <li style={styles.benefitItem}>
                  <span style={styles.benefitIcon}>✓</span>
                  <span style={styles.benefitText}>Discover programs tailored to your interests</span>
                </li>
                <li style={styles.benefitItem}>
                  <span style={styles.benefitIcon}>✓</span>
                  <span style={styles.benefitText}>Track your applications and progress</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  pageWrapper: {
    width: "100%",
    padding: "40px 20px",
    minHeight: "calc(100vh - 200px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    display: "flex",
    flexWrap: "wrap",
    maxWidth: "1200px",
    margin: "0 auto",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
    borderRadius: "16px",
    overflow: "hidden",
  },
  contentCard: {
    flex: "1 1 400px",
    padding: "40px",
    backgroundColor: "white",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: "30px",
  },
  heading: {
    fontSize: "2.3rem",
    color: "var(--color-primary)",
    marginBottom: "15px",
    fontWeight: "600",
  },
  subheading: {
    fontSize: "1.1rem",
    color: "var(--color-secondary)",
    lineHeight: "1.6",
  },
  divider: {
    position: "relative",
    margin: "40px 0 30px",
    textAlign: "center",
    borderTop: "1px solid #e0e0e0",
  },
  dividerText: {
    position: "relative",
    top: "-12px",
    padding: "0 15px",
    backgroundColor: "white",
    color: "var(--color-secondary)",
    fontSize: "0.95rem",
  },
  alternateActions: {
    textAlign: "center",
  },
  secondaryButton: {
    display: "inline-block",
    padding: "12px 24px",
    color: "var(--color-primary)",
    backgroundColor: "transparent",
    border: "2px solid var(--color-primary)",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "1rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  infoPanel: {
    flex: "1 1 400px",
    backgroundImage: "linear-gradient(135deg, #0056b3, #3a7bd5)",
    color: "white",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  infoPanelContent: {
    maxWidth: "400px",
  },
  infoPanelTitle: {
    fontSize: "2rem",
    fontWeight: "600",
    marginBottom: "30px",
  },
  benefitsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  benefitItem: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "20px",
    fontSize: "1.1rem",
  },
  benefitIcon: {
    fontSize: "1.2rem",
    marginRight: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    lineHeight: "1.5",
  },
};
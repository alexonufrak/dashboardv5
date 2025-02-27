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
      <div style={styles.container}>
        <h1 style={styles.heading}>Sign In to xFoundry</h1>
        <p style={styles.subheading}>
          Please use your institutional email to sign in. If you don't have an account yet, 
          we'll help you create one.
        </p>
        
        <LoginModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialEmail={email}
        />
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
    textAlign: "center",
  },
  heading: {
    fontSize: "2.5rem",
    color: "var(--color-primary)",
    marginBottom: "20px",
  },
  subheading: {
    fontSize: "1.2rem",
    color: "var(--color-secondary)",
    marginBottom: "40px",
  },
};
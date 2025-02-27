"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import { FilloutPopupEmbed } from "@fillout/react"

const OnboardingChecklist = ({ profile, onComplete }) => {
  const { user } = useUser()
  const router = useRouter()
  const [steps, setSteps] = useState([
    { id: 'register', title: 'Create an account', completed: true, description: 'Sign up with your institutional email' },
    { id: 'selectCohort', title: 'Get involved', completed: false, description: 'Select a program to join' },
    { id: 'connexions', title: 'Join ConneXions', completed: false, description: 'Connect with the community' }
  ])
  const [activeFilloutForm, setActiveFilloutForm] = useState(null)
  const [checkedCohortSubmission, setCheckedCohortSubmission] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(true)

  // Check if user came from a specific cohort link
  useEffect(() => {
    const checkUserMetadata = async () => {
      try {
        // Fetch user metadata to see if steps are already completed
        const response = await fetch('/api/user/metadata')
        if (response.ok) {
          const metadata = await response.json()
          
          // Update steps based on metadata
          if (metadata.onboarding) {
            setSteps(prevSteps => 
              prevSteps.map(step => ({
                ...step,
                completed: metadata.onboarding.includes(step.id)
              }))
            )
          }
          
          // Check if onboarding is completed or skipped
          if (metadata.onboardingCompleted || metadata.onboardingSkipped) {
            setShowOnboarding(false)
            if (onComplete) onComplete()
          }
          
          // Set selected cohort if any
          if (metadata.selectedCohort) {
            setSelectedCohort(metadata.selectedCohort)
          }
        }
      } catch (error) {
        console.error('Error fetching user metadata:', error)
      }
    }

    // Check URL params for cohort ID
    const cohortId = router.query.cohortId
    if (cohortId && !selectedCohort) {
      // Save cohort ID to user metadata
      saveCohortToMetadata(cohortId)
      setSelectedCohort(cohortId)
    }
    
    checkUserMetadata()
  }, [router.query, user])

  // Check if user has already submitted an application for the selected cohort
  useEffect(() => {
    const checkCohortSubmission = async () => {
      if (selectedCohort && !checkedCohortSubmission && profile?.contactId) {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/user/check-application?cohortId=${selectedCohort}&contactId=${profile.contactId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.hasApplied) {
              // Mark the selectCohort step as completed
              completeStep('selectCohort')
            }
          }
        } catch (error) {
          console.error('Error checking cohort submission:', error)
        } finally {
          setCheckedCohortSubmission(true)
          setIsLoading(false)
        }
      }
    }
    
    checkCohortSubmission()
  }, [selectedCohort, profile, checkedCohortSubmission])

  // Save selected cohort to user metadata
  const saveCohortToMetadata = async (cohortId) => {
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedCohort: cohortId
        })
      })
    } catch (error) {
      console.error('Error saving cohort to metadata:', error)
    }
  }

  // Complete a step
  const completeStep = async (stepId) => {
    // Update local state
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      )
    )
    
    // Save to user metadata
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboarding: [...steps.filter(s => s.completed).map(s => s.id), stepId]
        })
      })
    } catch (error) {
      console.error('Error saving step completion to metadata:', error)
    }
  }

  // Handle clicking a cohort card to apply
  const handleCohortApply = (cohort) => {
    if (cohort && cohort["Application Form ID (Fillout)"]) {
      setActiveFilloutForm({
        formId: cohort["Application Form ID (Fillout)"],
        cohortId: cohort.id,
        initiativeName: cohort.initiativeDetails?.name || "Program Application"
      })
    }
  }

  // Handle completion of form submission
  const handleFormCompleted = () => {
    setActiveFilloutForm(null)
    completeStep('selectCohort')
  }

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingCompleted: true
        })
      })
      
      setShowOnboarding(false)
      if (onComplete) onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  // Skip onboarding
  const skipOnboarding = async () => {
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingSkipped: true
        })
      })
      
      setShowOnboarding(false)
      if (onComplete) onComplete()
    } catch (error) {
      console.error('Error skipping onboarding:', error)
    }
  }

  // Function to render individual cohort cards
  const renderCohortCard = (cohort) => {
    const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative"
    const topics = cohort.topicNames || []
    const status = cohort["Status"] || "Unknown"
    const actionButtonText = cohort["Action Button"] || "Apply Now"
    const filloutFormId = cohort["Application Form ID (Fillout)"]
    
    const buttonStyle = {
      ...styles.actionButton,
      backgroundColor: status === "Applications Open" ? "var(--color-primary)" : "var(--color-secondary)",
    }
    
    return (
      <div key={cohort.id} style={styles.cohortCard}>
        <div style={styles.cohortHeader}>
          <div>
            <h3 style={styles.cohortTitle}>{initiativeName}</h3>
            
            <div style={styles.badgesContainer}>
              {Array.isArray(topics) && topics.length > 0 && 
                topics.map((topic, index) => (
                  <span key={`topic-${index}`} style={styles.topicBadge}>{topic}</span>
                ))
              }
              
              <span style={{
                ...styles.statusBadge,
                backgroundColor: status === "Applications Open" ? "#dff0d8" : "#f2dede",
                color: status === "Applications Open" ? "#3c763d" : "#a94442",
              }}>
                {status}
              </span>
            </div>
          </div>
        </div>
        
        <div style={styles.cohortContent}>
          <div style={styles.actionButtonContainer}>
            <button 
              style={buttonStyle} 
              disabled={status !== "Applications Open" || !filloutFormId}
              onClick={() => handleCohortApply(cohort)}
            >
              {actionButtonText}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If onboarding is hidden, don't render anything
  if (!showOnboarding) {
    return null
  }

  const allStepsCompleted = steps.every(step => step.completed)

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Welcome to xFoundry!</h2>
      <p style={styles.subheading}>Complete these steps to get started</p>
      
      {/* Fillout form popup */}
      {activeFilloutForm && (
        <FilloutPopupEmbed
          filloutId={activeFilloutForm.formId}
          onClose={() => setActiveFilloutForm(null)}
          onSubmit={handleFormCompleted}
          parameters={{
            cohortId: activeFilloutForm.cohortId,
            initiativeName: activeFilloutForm.initiativeName,
            userEmail: user?.email,
            userName: user?.name,
            userContactId: profile?.contactId
          }}
        />
      )}
      
      <div style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <div key={step.id} style={styles.step}>
            <div style={styles.stepHeader}>
              <div 
                style={{
                  ...styles.stepNumber,
                  backgroundColor: step.completed ? 'var(--color-success)' : 'var(--color-primary)'
                }}
              >
                {step.completed ? '✓' : index + 1}
              </div>
              <div style={styles.stepInfo}>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
            
            <div style={styles.stepContent}>
              {step.id === 'selectCohort' && !step.completed && (
                <>
                  <p style={styles.stepInstructions}>
                    Select a program to apply for:
                  </p>
                  
                  {isLoading ? (
                    <div style={styles.loadingContainer}>
                      <p>Loading available programs...</p>
                    </div>
                  ) : profile.cohorts && profile.cohorts.length > 0 ? (
                    <div style={styles.cohortsGrid}>
                      {profile.cohorts.map(cohort => renderCohortCard(cohort))}
                    </div>
                  ) : (
                    <div style={styles.noCohorts}>
                      No programs are currently available for your institution.
                    </div>
                  )}
                </>
              )}
              
              {step.id === 'connexions' && (
                <div style={styles.connexionsContainer}>
                  <p style={styles.connexionsDescription}>
                    Join ConneXions to connect with students, mentors, and faculty in your program.
                  </p>
                  <a 
                    href="https://connexions.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={styles.connexionsButton}
                    onClick={() => completeStep('connexions')}
                  >
                    Go to ConneXions
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div style={styles.actionsContainer}>
        {allStepsCompleted ? (
          <button 
            style={styles.completeButton}
            onClick={completeOnboarding}
          >
            Complete Onboarding
          </button>
        ) : (
          <button 
            style={styles.skipButton}
            onClick={skipOnboarding}
          >
            Skip for Now
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  heading: {
    fontSize: '2rem',
    color: 'var(--color-primary)',
    marginBottom: '10px',
    textAlign: 'center',
  },
  subheading: {
    fontSize: '1.1rem',
    color: 'var(--color-secondary)',
    marginBottom: '30px',
    textAlign: 'center',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  step: {
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
  },
  stepNumber: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    marginRight: '15px',
    flexShrink: 0,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    margin: 0,
    marginBottom: '5px',
  },
  stepDescription: {
    fontSize: '0.9rem',
    color: 'var(--color-secondary)',
    margin: 0,
  },
  stepContent: {
    padding: '20px',
  },
  stepInstructions: {
    marginBottom: '20px',
    fontSize: '1rem',
  },
  loadingContainer: {
    padding: '20px',
    textAlign: 'center',
    color: 'var(--color-secondary)',
  },
  cohortsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  noCohorts: {
    padding: '20px',
    textAlign: 'center',
    color: 'var(--color-secondary)',
    fontStyle: 'italic',
  },
  connexionsContainer: {
    textAlign: 'center',
    padding: '20px 0',
  },
  connexionsDescription: {
    marginBottom: '20px',
  },
  connexionsButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '30px',
  },
  completeButton: {
    padding: '12px 24px',
    backgroundColor: 'var(--color-success)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  skipButton: {
    padding: '12px 24px',
    backgroundColor: 'white',
    color: 'var(--color-secondary)',
    border: '1px solid var(--color-secondary)',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  // Cohort card styles
  cohortCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  cohortHeader: {
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  cohortTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  badgesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  topicBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#e0f7fa',
    color: '#00838f',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
  cohortContent: {
    padding: '20px',
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '15px',
  },
  actionButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease',
  },
}

export default OnboardingChecklist
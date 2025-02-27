"use client"

import { useState, useEffect } from 'react';

const ProfileEditModal = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    degreeType: profile?.degreeType || "",
    major: profile?.programId || "", // Use programId for the value
    graduationYear: profile?.graduationYear || "",
    educationId: profile?.educationId || null,
    institutionId: profile?.institution?.id || null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [majors, setMajors] = useState([]);
  const [isLoadingMajors, setIsLoadingMajors] = useState(false);

  // Fetch majors if this is for a UMD student (showMajor is true)
  useEffect(() => {
    if (isOpen && profile?.showMajor) {
      const fetchMajors = async () => {
        setIsLoadingMajors(true);
        try {
          const response = await fetch('/api/user/majors');
          if (!response.ok) {
            throw new Error('Failed to fetch majors');
          }
          const data = await response.json();
          setMajors(data.majors || []);
        } catch (err) {
          console.error('Error fetching majors:', err);
          setError('Failed to load majors. Please try again.');
        } finally {
          setIsLoadingMajors(false);
        }
      };
      
      fetchMajors();
    }
  }, [isOpen, profile?.showMajor]);

  if (!isOpen) return null;
  
  // Handle clicking outside the modal to close it
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special validation for graduation year - ensure it's a valid year format
    if (name === "graduationYear") {
      // Only allow digits
      const onlyDigits = value.replace(/\D/g, '');
      
      // Limit to 4 digits
      const yearValue = onlyDigits.slice(0, 4);
      
      setFormData(prev => ({
        ...prev,
        [name]: yearValue
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate graduation year
      const graduationYear = formData.graduationYear;
      if (graduationYear) {
        // Make sure it's 4 digits and a valid year
        const yearPattern = /^[0-9]{4}$/;
        if (!yearPattern.test(graduationYear)) {
          throw new Error("Please enter a valid 4-digit graduation year (e.g., 2025)");
        }
        
        const yearValue = parseInt(graduationYear, 10);
        const currentYear = new Date().getFullYear();
        
        // Check if it's a reasonable graduation year (not too far in past or future)
        if (yearValue < currentYear - 10 || yearValue > currentYear + 10) {
          throw new Error(`Graduation year ${yearValue} seems unusual. Please verify and try again.`);
        }
      }
      
      // Add contact ID and institution ID to the data
      const updateData = {
        ...formData,
        contactId: profile.contactId,
        institutionId: formData.institutionId || profile.institution?.id
      };
      
      // Call the callback with the updated data
      await onSave(updateData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={handleOverlayClick}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Edit Profile</h3>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        {error && <div style={styles.errorMessage}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formSection}>
            <h4 style={styles.sectionTitle}>Personal Information</h4>
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
          </div>
          
          <div style={styles.formSection}>
            <h4 style={styles.sectionTitle}>Academic Information</h4>
            <div style={styles.formGroup}>
              <label htmlFor="institution" style={styles.label}>Institution</label>
              {profile.needsInstitutionConfirm && profile.suggestedInstitution ? (
                <>
                  <div style={styles.suggestedInstitution}>
                    <p>Based on your email domain, we suggest:</p>
                    <div style={styles.institutionOption}>
                      <input
                        type="radio"
                        id="suggestedInstitution"
                        name="institutionId"
                        value={profile.suggestedInstitution.id}
                        checked={formData.institutionId === profile.suggestedInstitution.id}
                        onChange={handleInputChange}
                        style={styles.radioInput}
                      />
                      <label htmlFor="suggestedInstitution" style={styles.radioLabel}>
                        {profile.suggestedInstitution.name}
                      </label>
                    </div>
                    <div style={styles.institutionOption}>
                      <input
                        type="radio"
                        id="noInstitution"
                        name="institutionId"
                        value=""
                        checked={!formData.institutionId}
                        onChange={() => setFormData(prev => ({...prev, institutionId: null}))}
                        style={styles.radioInput}
                      />
                      <label htmlFor="noInstitution" style={styles.radioLabel}>
                        None of the above / Other Institution
                      </label>
                    </div>
                    <small style={styles.helperText}>Please confirm your institution to see relevant programs.</small>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    id="institution"
                    value={profile.institutionName || profile.institution?.name || "Not specified"}
                    style={{...styles.input, ...styles.disabledInput}}
                    disabled
                  />
                  <small style={styles.helperText}>Institution cannot be changed. Contact support if needed.</small>
                </>
              )}
            </div>
            
            <div style={styles.formRow}>
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
              {profile.showMajor && (
                <div style={styles.formGroup}>
                  <label htmlFor="major" style={styles.label}>Major/Field of Study</label>
                  {isLoadingMajors ? (
                    <div style={styles.loadingText}>Loading majors...</div>
                  ) : (
                    <select
                      id="major"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                      style={styles.input}
                      required={profile.showMajor}
                    >
                      <option value="">Select a Major</option>
                      {majors.map(major => (
                        <option key={major.id} value={major.id}>
                          {major.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="graduationYear" style={styles.label}>Expected Graduation Year</label>
              <input
                type="text"
                id="graduationYear"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="YYYY"
                pattern="[0-9]{4}"
                inputMode="numeric"
                maxLength="4"
                title="Please enter a valid 4-digit year (e.g., 2025)"
                required
              />
              <small style={styles.helperText}>Enter 4-digit year (e.g., 2025)</small>
            </div>
          </div>
          
          <div style={styles.actionButtons}>
            <button type="button" style={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.saveButton} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
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
  loadingText: {
    padding: "8px 12px",
    color: "#777",
    fontSize: "0.9rem",
    fontStyle: "italic",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "600px",
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
  formSection: {
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
  },
  sectionTitle: {
    fontSize: "1rem",
    marginTop: 0,
    marginBottom: "15px",
    color: "var(--color-primary, #333)",
  },
  formRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "15px",
  },
  formGroup: {
    flex: "1 1 calc(50% - 7.5px)",
    minWidth: "200px",
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "1rem",
  },
  disabledInput: {
    backgroundColor: "#f9f9f9",
    color: "#777",
  },
  helperText: {
    display: "block",
    fontSize: "0.8rem",
    color: "#777",
    marginTop: "5px",
  },
  suggestedInstitution: {
    backgroundColor: "#f5f9ff",
    padding: "12px",
    borderRadius: "5px",
    marginBottom: "10px",
    border: "1px solid #e0eaff"
  },
  institutionOption: {
    display: "flex",
    alignItems: "center",
    margin: "8px 0",
  },
  radioInput: {
    margin: "0 10px 0 0",
  },
  radioLabel: {
    fontWeight: "500",
    color: "#333",
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "10px 15px",
    borderRadius: "4px",
    margin: "10px 20px",
    fontSize: "0.9rem",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "15px 20px",
    gap: "10px",
  },
  cancelButton: {
    padding: "8px 15px",
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  saveButton: {
    padding: "8px 15px",
    backgroundColor: "var(--color-primary, #4285f4)",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};

export default ProfileEditModal;
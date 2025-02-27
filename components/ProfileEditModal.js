"use client"

import { useState } from 'react';

const ProfileEditModal = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    degreeType: profile?.degreeType || "",
    major: profile?.showMajor ? profile?.major || "" : "",
    graduationYear: profile?.graduationYear || "",
    educationId: profile?.educationId || null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
      // Add contact ID and institution ID to the data
      const updateData = {
        ...formData,
        contactId: profile.contactId,
        institutionId: profile.institution?.id
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
    <div style={styles.modalOverlay}>
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
              <input
                type="text"
                id="institution"
                value={profile.institutionName || profile.institution?.name || "Not specified"}
                style={{...styles.input, ...styles.disabledInput}}
                disabled
              />
              <small style={styles.helperText}>Institution cannot be changed. Contact support if needed.</small>
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
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                  <option value="Associate">Associate</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Undergraduate">Undergraduate</option>
                </select>
              </div>
              {profile.showMajor && (
                <div style={styles.formGroup}>
                  <label htmlFor="major" style={styles.label}>Major/Field of Study</label>
                  <input
                    type="text"
                    id="major"
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    style={styles.input}
                    required={profile.showMajor}
                  />
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
                required
              />
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
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
/**
 * Application-wide constants
 */

/**
 * File upload configurations
 */
export const FILE_UPLOAD = {
  // Team Images
  TEAM_IMAGE: {
    MAX_SIZE: 20 * 1024 * 1024, // 20MB
    ALLOWED_TYPES: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp'],
      'image/x-icon': ['.ico'],
      'image/vnd.microsoft.icon': ['.ico']
    },
    FOLDER_PATH: 'team-headers',
  },
  
  // Milestone Submissions
  MILESTONE_SUBMISSION: {
    MAX_SIZE: 10 * 1024 * 1024 * 1024, // 10GB
    ALLOWED_TYPES: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'application/zip': ['.zip'],
      'text/plain': ['.txt']
    },
    FOLDER_PATH: 'milestone-submissions',
  },
  
  // Default file upload settings
  DEFAULT: {
    MAX_SIZE: 2 * 1024 * 1024, // 2MB
  }
};

/**
 * Utility function to get an array of allowed MIME types from ALLOWED_TYPES object
 * @param {Object} allowedTypesObj - Object with MIME types as keys and file extensions as values
 * @returns {string[]} Array of allowed MIME types
 */
export const getAllowedMimeTypes = (allowedTypesObj) => {
  return Object.keys(allowedTypesObj);
};

/**
 * Format file size to human-readable string
 * @param {number} bytes File size in bytes
 * @returns {string} Formatted file size (e.g., "5.0 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Named export of all constants
const constants = {
  FILE_UPLOAD,
  formatFileSize
};

export default constants;
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts team data from an API response, handling both wrapped and unwrapped formats
 * @param {Object} response - The API response
 * @returns {Object} The team data
 */
export function extractTeamData(response) {
  // Handle both formats (wrapped with .team or unwrapped)
  return response.team ? response.team : response;
}

/**
 * Standardizes an API response by wrapping the data in a named object if needed
 * @param {Object} data - The data to standardize
 * @param {string} resourceName - The name of the resource (e.g., 'team', 'submission')
 * @returns {Object} The standardized response
 */
export function standardizeApiResponse(data, resourceName) {
  // If data is already in the format { resourceName: ... }, return it as is
  if (data && data[resourceName] !== undefined) {
    return data;
  }
  
  // Otherwise, wrap it
  return { [resourceName]: data };
}

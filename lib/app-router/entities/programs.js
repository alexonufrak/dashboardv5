/**
 * Server-side data fetching for Programs
 * For use in Server Components with App Router
 */

import { cache } from 'react';
import { 
  fetchProgramById, 
  fetchPrograms, 
  fetchCohortsByProgramId 
} from '../airtable';

/**
 * Fetch all active programs with their cohorts
 */
export const getActivePrograms = cache(async () => {
  try {
    // Fetch active programs
    const { records } = await fetchPrograms({
      filterByFormula: "{Status} = 'Active'",
      sort: [{ field: 'Name', direction: 'asc' }]
    });
    
    if (!records || records.length === 0) {
      return [];
    }
    
    // Fetch cohorts for each program in parallel
    const programsWithCohorts = await Promise.all(
      records.map(async (program) => {
        const cohorts = await fetchCohortsByProgramId(program.id);
        return {
          ...formatProgram(program),
          cohorts: cohorts.map(formatCohort)
        };
      })
    );
    
    return programsWithCohorts;
  } catch (error) {
    console.error('Error fetching active programs:', error);
    return [];
  }
});

/**
 * Fetch a single program with its cohorts
 */
export const getProgramWithCohorts = cache(async (programId) => {
  try {
    // Fetch program
    const program = await fetchProgramById(programId);
    
    // Fetch cohorts for this program
    const cohorts = await fetchCohortsByProgramId(programId);
    
    return {
      ...formatProgram(program),
      cohorts: cohorts.map(formatCohort)
    };
  } catch (error) {
    console.error(`Error fetching program ${programId} with cohorts:`, error);
    return null;
  }
});

/**
 * Format program record for client consumption
 */
export function formatProgram(program) {
  if (!program) return null;
  
  const { id, fields } = program;
  
  return {
    id,
    recordId: id,
    name: fields['Name'] || '',
    description: fields['Description'] || '',
    shortDescription: fields['Short Description'] || '',
    status: fields['Status'] || '',
    primaryColor: fields['Primary Color'] || '#000000',
    secondaryColor: fields['Secondary Color'] || '#FFFFFF',
    logo: fields['Logo']?.[0]?.url || null,
    banner: fields['Banner']?.[0]?.url || null,
    applicationUrl: fields['Application URL'] || '',
    website: fields['Website'] || '',
    contactEmail: fields['Contact Email'] || '',
    startDate: fields['Start Date'] || '',
    endDate: fields['End Date'] || '',
    initiative: fields['Initiative']?.[0] || null
  };
}

/**
 * Format cohort record for client consumption
 */
export function formatCohort(cohort) {
  if (!cohort) return null;
  
  const { id, fields } = cohort;
  
  return {
    id,
    recordId: id,
    name: fields['Name'] || '',
    description: fields['Description'] || '',
    status: fields['Status'] || '',
    startDate: fields['Start Date'] || '',
    endDate: fields['End Date'] || '',
    applicationDeadline: fields['Application Deadline'] || '',
    program: fields['Program']?.[0] || null,
    isActive: fields['Status'] === 'Active'
  };
}
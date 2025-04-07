/**
 * Programs Section 
 * Server Component that fetches program data
 */
import { getActivePrograms } from '@/lib/airtable/entities/programs';
import { getParticipationRecords } from '@/lib/airtable/entities/participation';
import { getCohortsByProgram } from '@/lib/airtable/entities/cohorts';

// Import client component for interactive elements
import { ClientSideProgramList } from './client-program-list';

/**
 * Server component for programs section
 * This component fetches data server-side and streams it to the client
 */
export default async function ProgramsSection({ userId }) {
  // Fetch active programs - can be cached longer since they don't change often
  const programs = await getActivePrograms({
    cache: 'force-cache',
    next: { revalidate: 3600 } // Revalidate every hour
  });
  
  // Fetch user's participation records - this is dynamic user data
  const participationRecords = await getParticipationRecords(userId, {
    cache: 'no-store' // Don't cache user-specific data
  });
  
  // Get cohorts for each program in parallel
  const programCohorts = await Promise.all(
    programs.map(async program => {
      if (!program.id) return { programId: program.id, cohorts: [] };
      
      const cohorts = await getCohortsByProgram(program.id, {
        next: { revalidate: 1800 } // Revalidate every 30 minutes
      });
      
      return {
        programId: program.id,
        cohorts: cohorts || []
      };
    })
  );
  
  // Create a map of program ID to cohorts for easy lookup
  const cohortsByProgramId = {};
  programCohorts.forEach(item => {
    cohortsByProgramId[item.programId] = item.cohorts;
  });
  
  // Process programs to add participation status
  const processedPrograms = programs.map(program => {
    // Check if user is participating in this program
    const isParticipating = participationRecords.some(
      p => p.programId === program.id
    );
    
    // Find the first active cohort for this program
    const programCohorts = cohortsByProgramId[program.id] || [];
    const activeCohort = programCohorts.find(c => 
      c.isActive && c.status !== 'Completed' && c.status !== 'Archived'
    );
    
    // Return enhanced program object
    return {
      ...program,
      isParticipating,
      activeCohort: activeCohort || null,
      cohorts: programCohorts
    };
  });
  
  // Separate programs into active and other
  const activePrograms = processedPrograms.filter(p => 
    p.isParticipating || (p.activeCohort && p.activeCohort.isActive)
  );
  
  const otherPrograms = processedPrograms.filter(p => 
    !activePrograms.some(ap => ap.id === p.id)
  );
  
  // Return server component with data passed to client component
  return (
    <section className="programs-section mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Programs</h2>
      
      {/* Pass data to client-side component for interactivity */}
      <ClientSideProgramList 
        activePrograms={activePrograms}
        otherPrograms={otherPrograms}
        userId={userId}
      />
    </section>
  );
}
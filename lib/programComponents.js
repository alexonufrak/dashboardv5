// Define program types as constants
export const PROGRAM_TYPES = {
  XTRAPRENEURS: 'xtrapreneurs',
  XPERIENCE: 'xperience',
  HORIZONS: 'horizons',
  // Default type for other programs
  DEFAULT: 'default'
};

// Single component map for all program types
export const programComponentMap = {
  // All program types share the same component imports
  overview: () => import('../components/program/ProgramOverview'),
  milestones: () => import('../components/program/ProgramMilestones'),
  team: () => import('../components/program/ProgramTeam'),
  activity: () => import('../components/program/ProgramActivity')
};

// Helper to determine program type from program data
export function getProgramType(programData) {
  if (!programData?.name) return PROGRAM_TYPES.DEFAULT;
  
  const name = programData.name.toLowerCase();
  if (name.includes('xtrapreneurs')) return PROGRAM_TYPES.XTRAPRENEURS;
  if (name.includes('xperience')) return PROGRAM_TYPES.XPERIENCE;
  if (name.includes('horizons')) return PROGRAM_TYPES.HORIZONS;
  
  return PROGRAM_TYPES.DEFAULT;
}

// Helper to get tab label based on program type
export function getTabLabels(programType) {
  return {
    milestones: programType === PROGRAM_TYPES.XTRAPRENEURS ? 'Bounties' : 'Milestones',
    team: 'Team Members',
    overview: 'Overview',
    activity: 'Activity'
  };
}
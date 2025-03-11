// Define program types as constants
export const PROGRAM_TYPES = {
  XTRAPRENEURS: 'xtrapreneurs',
  XPERIENCE: 'xperience',
  HORIZONS: 'horizons',
  // Default type for other programs
  DEFAULT: 'default'
};

// Map components to program types
export const programComponentMap = {
  [PROGRAM_TYPES.XTRAPRENEURS]: {
    overview: () => import('../components/program/xtrapreneurs/XtrapreneursOverview'),
    milestones: () => import('../components/program/xtrapreneurs/BountyList'),
    team: () => import('../components/program/xtrapreneurs/XtrapreneursTeam'),
    activity: () => import('../components/program-dashboard/ActivityTab')
  },
  [PROGRAM_TYPES.XPERIENCE]: {
    overview: () => import('../components/program/xperience/XperienceOverview'),
    milestones: () => import('../components/program/xperience/XperienceMilestones'),
    team: () => import('../components/program/xperience/XperienceTeam'),
    activity: () => import('../components/program-dashboard/ActivityTab')
  },
  [PROGRAM_TYPES.HORIZONS]: {
    overview: () => import('../components/program/horizons/HorizonsOverview'),
    milestones: () => import('../components/program/horizons/HorizonsMilestones'),
    team: () => import('../components/program/horizons/HorizonsTeam'),
    activity: () => import('../components/program-dashboard/ActivityTab')
  },
  // Default components for other programs
  [PROGRAM_TYPES.DEFAULT]: {
    overview: () => import('../components/program-dashboard/OverviewTab'),
    milestones: () => import('../components/program-dashboard/MilestonesTab'),
    team: () => import('../components/program-dashboard/TeamMembersTab'),
    activity: () => import('../components/program-dashboard/ActivityTab')
  }
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
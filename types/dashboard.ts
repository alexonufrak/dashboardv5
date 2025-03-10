/**
 * Type definitions for the Dashboard components and data models
 */

// Profile data
export interface Profile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  institutionName?: string;
  institution?: {
    name?: string;
    [key: string]: any;
  };
  headshot?: string;
  [key: string]: any;
}

// Team member
export interface TeamMember {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
  submissions?: string[];
  [key: string]: any;
}

// Team data
export interface Team {
  id: string;
  name?: string;
  members?: TeamMember[];
  cohortIds?: string[];
  fields?: {
    Submissions?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

// Cohort data
export interface Cohort {
  id: string;
  name?: string;
  'Current Cohort'?: boolean;
  'Is Current'?: boolean;
  initiativeDetails?: {
    id: string;
    name?: string;
    'Participation Type'?: string;
    [key: string]: any;
  };
  participationType?: string;
  [key: string]: any;
}

// Participation data
export interface Participation {
  id?: string;
  cohort?: Cohort;
  teamId?: string;
  [key: string]: any;
}

// API response for participation data
export interface ParticipationData {
  participation: Participation[];
  [key: string]: any;
}

// Milestone data
export interface Milestone {
  id: string;
  name?: string;
  number?: number;
  dueDate?: string;
  description?: string;
  status?: 'completed' | 'in-progress' | 'upcoming' | string;
  progress?: number;
  completedDate?: string | null;
  score?: number | null;
  cohortId?: string;
  [key: string]: any;
}

// API response for milestone data
export interface MilestoneData {
  milestones: Milestone[];
  [key: string]: any;
}

// Application data
export interface Application {
  id: string;
  status?: string;
  programId?: string;
  [key: string]: any;
}

// Initiative data (program initiative)
export interface Initiative {
  id: string;
  name: string;
  participationType: string;
  isTeamBased: boolean;
  teamId: string | null;
  cohortId: string;
}

// Program data with team info
export interface ProgramData {
  programId: string;
  cohort: Cohort;
  initiativeName: string;
  participationType: string;
  isTeamBased: boolean;
  teamId: string | null;
  teamData?: Team | null;
  userHasMultipleTeams: boolean;
  availableTeams: Team[];
}

// Simplified program data
export interface ProcessedProgramData {
  cohort: Cohort | null;
  initiativeName: string;
  participationType: string | null;
}

// Enhanced profile with participation info and helper functions
export interface EnhancedProfile extends Profile {
  participations: Participation[];
  teamParticipations: Participation[];
  hasActiveTeamParticipation: boolean;
  hasActiveParticipation: boolean;
  isTeamBasedParticipation: (participationType: string | null | undefined) => boolean;
  getParticipationType: (p: Participation) => string;
  findParticipationByCohortId: (cohortId: string) => Participation | null;
  findParticipationsByInitiativeId: (initiativeId: string) => Participation[];
  getActiveParticipationInitiatives: () => Initiative[];
  participationByCohortId: Record<string, Participation>;
}

// Map from program ID to active team ID
export interface ProgramTeams {
  [programId: string]: string;
}

// Point Transactions and Activity Types
export interface PointTransaction {
  id: string;
  date: string;
  description?: string;
  achievementId?: string;
  achievementName?: string;
  pointsValue: number;
  contactId?: string;
  contactName?: string;
  teamId?: string;
  teamName?: string;
  type?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  pointsValue: number;
  type: string;
}

export type ActivityType = 
  | 'milestone_completed'
  | 'points_earned'
  | 'milestone_started' 
  | 'document_updated'
  | 'submission_created'
  | 'comment_added';

export interface ActivityMember {
  id: string;
  name: string;
  avatar?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  points?: number;
  member: ActivityMember;
  timestamp: Date;
  details?: string;
}
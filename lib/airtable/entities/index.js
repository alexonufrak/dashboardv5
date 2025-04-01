/*
 * Expose all Airtable entity modules in a single export
 */

// Core entity modules
import users from './users';
import education from './education';
import institutions from './institutions';
import participation from './participation';
import teams from './teams';
import cohorts from './cohorts';
import programs from './programs';
import submissions from './submissions';
import points from './points';
import resources from './resources';
import events from './events';
import partnerships from './partnerships';

export {
  users,
  education,
  institutions,
  participation,
  teams,
  cohorts,
  programs,
  submissions,
  points,
  resources,
  events,
  partnerships
};

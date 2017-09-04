import {Deliverable} from './DeliverableModel'

// Requires a 'settings' property in the Course model on the 
// Classportal-backend MongoDB schema

export interface CourseSettings {
  bootstrapImage: string;
  testingDelay: boolean;
  delayTime: number;
  markDelivsByBatch: boolean;
  deliverables: [Deliverable];
}

export class Course {
  courseId: string;
  minTeamSize: number;
  maxTeamSize: number;
  modules: string[];
  customData: any;
  classList: Object[];
  batchDeliverables: Object[];
  deliverables: Object[];
  labSections: Object[];
  urlWebhook: string;
  githubOrgs: Object[];
  grades: Object[];
  batchSourceUrl: string;
  studentsSetTeams: boolean;
  teamsEnabled: boolean;
  description: string;
  settings: CourseSettings;
  admins: [string];
  teamMustBeInSameLab: Boolean;
}
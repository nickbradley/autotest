
// Requires a 'settings' property in the Course model on the 
// Classportal-backend MongoDB schema

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
  admins: [string];
  teamMustBeInSameLab: Boolean;
}
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
  deliverables: Object[];
  grades: [Object];
  settings: CourseSettings;
  admins: [string];
  teamMustBeInSameLab: Boolean;
}
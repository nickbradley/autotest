// Models ported over from Classportal-backend repo (should remain up to date)
// https://github.com/ubccpsc/classportal-backend/models/deliverable.model

import * as Url from 'url';
import {Commit} from '../GithubUtil';

export interface Deliverable {
  courseId: string;
  name: string;
  url: string;
  open: Date;
  close: Date;
  gradesReleased: Boolean;
  deliverableSettings: DeliverableSettings;
}

export enum Visibility {
  Public,
  Private,
  Restricted
}

export interface Repository {
  name: string;  // name of the repo on GitHub
  url: Url.Url;
  commit?: Commit;
  visibility: Visibility;
}

export interface DeliverableSettings {
  description?: string;
  dueDate: Date;
  releaseDate: Date;
  repos: Repository[];
  gradeFormula: string;
  rate: number;  // milliseconds
  runs?: number;  // total number of requests to view test results
  // external servers that should be accessible inside the test container
  externalUrls?: Url.Url[];
}
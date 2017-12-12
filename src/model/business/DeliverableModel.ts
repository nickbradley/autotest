// Models ported over from Classportal-backend repo (should remain up to date)
// https://github.com/ubccpsc/classportal-backend/models/deliverable.model

import * as Url from 'url';
import {Commit} from '../GithubUtil';

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
import * as Url from 'url';

import {Commit} from '../GithubUtil';
import {DatabaseRecord, CouchDatabase, InsertResponse} from '../Database';
import {Deliverable} from './DeliverableRecord'

interface IDictionary<T> {

}

export interface CourseSettings {
  bootstrapImage: string;
  testingDelay: boolean;
  delayTime: number;
  markDelivsByBatch: boolean;
  deliverables: { [id: string]: Deliverable };
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

export class CourseRecord implements DatabaseRecord {
  private _courses: { [id: string]: Course } = {};

  constructor(courses: { [id: string]: Course }) {
    for (const key of Object.keys(courses)) {
      this.add(key, courses[key])
    }
    //console.log(this._deliverables);
    //this._deliverables = deliverables.filter();
  }

  get courses() {
    return this._courses;
  }

  public add(name: string, deliverable: Course) {
    // TODO Will this overwrite the value? Hope so.
    this._courses[name] = deliverable;
  }

  public remove(name: string) {
    // TODO Does this work?
    this._courses[name] = null;
  }

  public item(key: string): Course {
    return this._courses[key];
  }

  public keys(): string[] {
    return Object.keys(this._courses);
  }

  public values(): Course[] {
    let values: Course[] = [];

    for (const key of Object.keys(this._courses)) {
      values.push(this._courses[key]);
    }
    return values;
  }

  public containsKey(key: string): boolean {
    return this._courses.hasOwnProperty(key);
  }

  public async create(db: CouchDatabase): Promise<InsertResponse> {
    return this.insert(db);
  }

  public async update(db: CouchDatabase, rev: string): Promise<InsertResponse> {
    return this.insert(db, rev)
  }

  private async insert(db: CouchDatabase, rev?: string) {
    let doc: { [id: string]: Course } = this._courses;
    let params = {'_id': 'courses'};
    if (rev) params['_rev'] = rev;

    return new Promise<InsertResponse>((fulfill, reject) => {
      db.insert(doc, params, (err, result) => {
        if (err) reject(err);
        fulfill(result);
      });
    });
  }
}

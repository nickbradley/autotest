import * as Url from 'url';

import {Commit} from '../GithubUtil';
import {DatabaseRecord, CouchDatabase, InsertResponse} from '../Database';

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

export interface Deliverable {
  description?: string
  dueDate: Date;
  releaseDate: Date;
  repos: Repository[];
  rate: number;  // milliseconds
  gradeFormula: string;
  runs?: number;  // total number of requests to view test results
  // external servers that should be accessible inside the test container
  externalUrls?: Url.Url[];
}

export class DeliverableRecord implements DatabaseRecord {
  private _deliverables: { [id: string]: Deliverable };

  constructor(deliverables: { [id: string]: Deliverable }) {
    this._deliverables = deliverables;
  }

  get deliverables() {
    return this._deliverables;
  }

  public add(name: string, deliverable: Deliverable) {
    // TODO Will this overwrite the value? Hope so.
    this._deliverables[name] = deliverable;
  }

  public remove(name: string) {
    // TODO Does this work?
    this._deliverables[name] = null;
  }

  public async create(db: CouchDatabase): Promise<InsertResponse> {
    return this.insert(db);
  }

  public async update(db: CouchDatabase, rev: string): Promise<InsertResponse> {
    return this.insert(db, rev)
  }

  private async insert(db: CouchDatabase, rev?: string) {
    let doc: { [id: string]: Deliverable } = this._deliverables;
    let params = {'_id': 'deliverables'};
    if (rev) params['_rev'] = rev;

    return new Promise<InsertResponse>((fulfill, reject) => {
      db.insert(doc, params, (err, result) => {
        if (err) reject(err);
        fulfill(result);
      });
    });
  }
}

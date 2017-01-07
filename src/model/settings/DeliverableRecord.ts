import * as Url from 'url';

import {Commit} from '../GithubUtil';
import {DatabaseRecord, CouchDatabase, InsertResponse} from '../Database';

interface IDictionary<T> {

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

export interface Deliverable {
  description?: string
  dueDate: Date;
  releaseDate: Date;
  repos: Repository[];
  gradeFormula: string;
  rate: number;  // milliseconds
  runs?: number;  // total number of requests to view test results
  // external servers that should be accessible inside the test container
  externalUrls?: Url.Url[];
}

export class DeliverableRecord implements DatabaseRecord {
  private _deliverables: { [id: string]: Deliverable } = {};

  constructor(deliverables: { [id: string]: Deliverable }) {
    for (const key of Object.keys(deliverables)) {
      if (key.match(/d\d+/)) {
        this.add(key, deliverables[key])
      }
    }
    //console.log(this._deliverables);
    //this._deliverables = deliverables.filter();
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

  public item(key: string): Deliverable {
    return this._deliverables[key];
  }

  public keys(): string[] {
    return Object.keys(this._deliverables);
  }

  public values(): Deliverable[] {
    let values: Deliverable[] = [];

    for (const key of Object.keys(this._deliverables)) {
      values.push(this._deliverables[key]);
    }
    return values;
  }

  public containsKey(key: string): boolean {
    return this._deliverables.hasOwnProperty(key);
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

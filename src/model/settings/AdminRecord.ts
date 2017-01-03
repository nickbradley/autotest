import {DatabaseRecord, CouchDatabase, InsertResponse} from '../Database';
import {GithubUsername, GithubAccount} from '../GithubUtil';

export enum Role {
  Instructor,
  GTA,
  UTA
}

export interface Admin {
  details: GithubAccount;
  role: Role
}

export class AdminRecord implements DatabaseRecord {
  private admins: { [id: string]: Admin };

  constructor(admins: { [id: string]: Admin }) {
    this.admins = admins;
  }

  public add(username: GithubUsername, admin: Admin) {
    this.admins[username] = admin;
  }
  public remove(username: GithubUsername) {
    this.admins[username] = null;
  }

  public async create(db: CouchDatabase): Promise<InsertResponse> {
    return this.insert(db);
  }

  public async update(db: CouchDatabase, rev: string): Promise<InsertResponse> {
    return this.insert(db, rev);
  }

  private async insert(db: CouchDatabase, rev?: string) {
    let doc: { [id: string]: Admin } = this.admins;
    let params = {'_id': 'admins'};
    if (rev) params['_rev'] = rev;

    return new Promise<InsertResponse>((fulfill, reject) => {
      db.insert(doc, params, (err, result) => {
        if (err) reject(err);
        fulfill(result);
      });
    });
  }
}

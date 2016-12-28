import {DatabaseRecord, CouchDatabase, InsertResponse} from '../Database';
import {User} from '../github/GithubUtil';

export interface Team {
  members: User[];
}
export class TeamRecord implements DatabaseRecord {
  private teams: { [id: string]: Team };

  constructor(teams: { [id: string]: Team }) {
    this.teams = teams;
  }

  public add(name: string, team: Team) {
    this.teams[name] = team;
  }
  public remove(name: string) {
    this.teams[name] = null;
  }

  public async create(db: CouchDatabase): Promise<InsertResponse> {
    return this.insert(db);
  }

  public async update(db: CouchDatabase, rev: string): Promise<InsertResponse> {
    return this.insert(db, rev);
  }

  private async insert(db: CouchDatabase, rev?: string) {
    let doc: { [id: string]: Team } = this.teams;
    let params = {'_id': 'teams'};
    if (rev) params['_rev'] = rev;

    return new Promise<InsertResponse>((fulfill, reject) => {
      db.insert(doc, params, (err, result) => {
        if (err) reject(err);
        fulfill(result);
      });
    });
  }
}

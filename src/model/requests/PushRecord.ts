import {CouchDatabase, DatabaseRecord, InsertResponse} from '../Database';
import {GithubUtil, Commit} from '../GithubUtil';


export default class PushRecord implements DatabaseRecord {
  private payload: JSON;
  private _team: string;
  private user: string;
  private _commit: Commit;
  private timestamp: number;

  constructor(payload: any) {
    try {
      this.payload = payload;
      this._team = GithubUtil.getTeam(payload.repository.name);
      this.user = payload.pusher.name;
      this._commit = new Commit(payload.after);
      this.timestamp = +new Date();
    } catch(err) {
      throw 'Failed to create new PushRecord. ' + err;
    }
  }

  get team(): string {
    return this._team;
  }

  get commit(): Commit {
    return this._commit;
  }

  public async create(db: CouchDatabase): Promise<InsertResponse> {
    return this.insert(db);
  }

  public async update(db: CouchDatabase, rev: string): Promise<InsertResponse> {
    return new Promise<InsertResponse>((fulfill, reject) => {
      reject('Failed to update push record. Operation not supported.');
    });
  }

  private async insert(db: CouchDatabase): Promise<InsertResponse> {
    let payload = JSON.stringify(this.payload);
    let doc = {team: this.team, user: this.user, commit: this.commit.toString(), type: 'push', timestamp: this.timestamp}
    let attachments = [{name: 'push.json', data: payload, content_type: 'application/json'}];
    let docName = this.timestamp + '_' + this.team + ':' + this._commit.short;

    let that = this;
    return new Promise<InsertResponse>((fulfill, reject) => {
      db.multipart.insert(doc, attachments, docName, (err, result) => {
        if (err) {
          reject(err);
        }

        fulfill(result);
      });
    });
  }
}

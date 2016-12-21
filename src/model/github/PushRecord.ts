import {CouchDatabase, Record, InsertResponse} from '../Database';
import GithubUtil from './GithubUtil';


export default class PushRecord implements Record {
  private payload: JSON;
  private team: string;
  private user: string;
  private commit: string;
  private timestamp: number;

  constructor(payload: any) {
    try {
      this.payload = payload;
      this.team = GithubUtil.getTeam(payload.repository.name);
      this.user = payload.pusher.name;
      this.commit = payload.after;
      this.timestamp = +new Date();
    } catch(err) {
      throw 'Failed to create new PushRecord. ' + err;
    }
  }

  async insert(db: CouchDatabase): Promise<InsertResponse> {
    let payload = JSON.stringify(this.payload);
    let doc = {team: this.team, user: this.user, commit: this.commit, type: 'push', timestamp: this.timestamp}
    let attachments = [{name: 'push.json', data: payload, content_type: 'application/json'}];
    let docName = this.timestamp + '_' + this.team + ':' + this.commit.substring(0,7);

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

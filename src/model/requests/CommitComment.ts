
import Log from '../../Util';

import {CouchDatabase, Record, InsertResponse} from '../Database';
import GithubUtil from './GithubUtil';




export default class CommitCommentRecord implements Record {
  private payload: JSON;
  private team: string;
  private user: string;
  private hook: string;
  private commit: string;
  private message: string;
  private timestamp: number;

  private _deliverable: string;
  private _isRequest: boolean;

  constructor(payload: any, requestMention: string, defaultDeliverable: string) {
    try {
      this.payload = payload;
      this.commit = payload.comment.commit_id;
      this.team = GithubUtil.getTeam(payload.repository.name);
      this.user = payload.comment.user.login;
      this.hook = payload.repository.commits_url.replace('{/sha}', '/' + this.commit) + '/comments';
      this.message = payload.comment.body;

      this.timestamp = +new Date();

      this._isRequest = payload.comment.body.toLowerCase().includes(requestMention);
      if (this._isRequest) {
        // TODO Set the default deliverable
        this._deliverable = this.extractDeliverable() || defaultDeliverable;
      }
    } catch(err) {
      console.log(err);
      throw 'Invalid commit comment.';
    }
  }
  public get isRequest(): boolean {
    return this._isRequest;
  }
  public get deliverable(): string {
    return this._deliverable;
  }

  public async insert(db: CouchDatabase): Promise<InsertResponse> {
    Log.trace('CommitCommentRecord::insert()');
    let that = this;
    let comment = JSON.stringify(this.payload);
    let doc = {team: this.team, user: this.user, commit: this.commit, body: this.message, type: 'commit_comment', timestamp: this.timestamp}
    let attachments = [{name: 'comment.json', payload: comment, content_type: 'application/json'}];
    let docName = this.timestamp + '_' + this.team + ':' + this.user + '_' + this._deliverable;

    return new Promise<InsertResponse>((fulfill, reject) => {
      db.multipart.insert(doc, attachments, docName, (err, result) => {
        if (err) {
          reject(err);
        }

        fulfill(result);
      });
    });
  }

  private extractDeliverable(): string {
    let deliverable: string;
    let matches: string[] = /.*#[dD](\d{1,2}).*/i.exec(this.message);
    if (matches) {
      deliverable = 'd' + +matches[1];
    }

    return deliverable;
  }
}

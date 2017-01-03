import * as Url from 'url';

import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, CouchDatabase, DatabaseRecord, InsertResponse} from '../Database';
import {GithubUtil, Commit} from '../GithubUtil';
import {Deliverable, DeliverableRecord} from '../settings/DeliverableRecord';

interface FetchedDeliverable {
  key: string;
  deliverable: Deliverable
}



export default class CommitCommentRecord implements DatabaseRecord {

  private config: IConfig;



  private payload: JSON;
  private _team: string;
  private _user: string;
  private _hook: Url.Url;
  private _commit: Commit;
  private message: string;
  private timestamp: number;

  private _deliverable: string;
  private _deliverableRate: number;
  private _isRequest: boolean;

  constructor() {
    try {
      this.config = new AppConfig();
      this.timestamp = +new Date();

    } catch(err) {
      throw 'Invalid commit comment.';
    }
  }

  public async process(payload: any) {
    let that = this;
    return new Promise(async (fulfill, reject) => {
      try {
        that.payload = JSON.parse(payload);
        that._commit = new Commit(payload.comment.commit_id);
        that._team = GithubUtil.getTeam(payload.repository.name);
        that._user = payload.comment.user.login;
        that._hook = Url.parse(payload.repository.commits_url.replace('{/sha}', '/' + this.commit) + '/comments');
        that.message = payload.comment.body;

        that._isRequest = payload.comment.body.toLowerCase().includes(this.config.getMentionTag());

        if (that._isRequest) {
          let reqDeliverable: string = that.extractDeliverable(that.message);
          let deliverable: FetchedDeliverable = await that.fetchDeliverable(reqDeliverable);
          that._deliverable = deliverable.key;
          that._deliverableRate = deliverable.deliverable.rate;
        }
        fulfill();
      } catch(err) {
        throw 'Unable to process grading request. ' + err;
      }
    });
  }



  private async fetchDeliverable(key: string): Promise<FetchedDeliverable> {
    let that = this;
    return new Promise<FetchedDeliverable>(async (fulfill, reject) => {
      try {
        let resultsDB = new Database(that.config.getDBConnection(), 'settings');
        let deliverablesDoc = await resultsDB.readRecord('deliverables');
        let deliverableRecord: DeliverableRecord = new DeliverableRecord(deliverablesDoc);
        let now: Date = new Date();

        if (Object.keys(deliverableRecord).includes(key)) {
          fulfill({
            key: key,
            deliverable: deliverableRecord[key]
          });
        } else {
          let fetchedDeliverables: FetchedDeliverable[];
          for (const key of Object.keys(deliverableRecord.deliverables)) {
            if (key.match(/d\d+/)) {
              fetchedDeliverables.push({key: key, deliverable: deliverableRecord[key]});
            }
          }
          let latestDeliverable: FetchedDeliverable = fetchedDeliverables.filter(record => {
            return record.deliverable.dueDate <= now;
          }).reduce((prev, current) => (prev.deliverable.dueDate > current.deliverable.dueDate) ? prev : current)
          fulfill(latestDeliverable);
        }
      } catch(err) {
          reject(err);
      }
    });
  }

  get team(): string {
    return this._team;
  }

  get user(): string {
    return this._user;
  }

  get commit(): Commit {
    return this._commit;
  }
  get hook(): Url.Url {
    return this._hook;
  }

  public get isRequest(): boolean {
    return this._isRequest;
  }
  public get deliverable(): string {
    return this._deliverable;
  }
  get deliverableRate(): number {
    return this._deliverableRate;
  }



  public async create(db: CouchDatabase): Promise<InsertResponse> {
    return this.insert(db);
  }
  public async update(db: CouchDatabase): Promise<InsertResponse> {
    return new Promise<InsertResponse>((fulfill, reject)=> {
      reject('Cannot update commit comment record. Invalid operation.');
    });
  }

  private async insert(db: CouchDatabase): Promise<InsertResponse> {
    Log.trace('CommitCommentRecord::insert()');
    let that = this;
    let comment = JSON.stringify(this.payload);
    let doc = {isRequest: this._isRequest, deliverable: this._deliverable, team: this.team, user: this.user, commit: this.commit, body: this.message, type: 'commit_comment', timestamp: this.timestamp}
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

  private extractDeliverable(comment: string): string {
    let deliverable: string;
    let matches: string[] = /.*#[dD](\d{1,2}).*/i.exec(this.message);
    if (matches) {
      deliverable = 'd' + +matches[1];
    }

    return deliverable;
  }
}

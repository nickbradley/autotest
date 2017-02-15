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
  private _isProcessed: boolean;
  private _options: string[] = [];
  private _note: string;

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
        that.payload = JSON.parse(JSON.stringify(payload));
        that._commit = new Commit(payload.comment.commit_id);
        that._team = GithubUtil.getTeam(payload.repository.name);
        that._user = payload.comment.user.login;
        that._hook = Url.parse(payload.repository.commits_url.replace('{/sha}', '/' + this.commit) + '/comments');
        that.message = payload.comment.body;

        that._isRequest = payload.comment.body.toLowerCase().includes(this.config.getMentionTag());
        that._isProcessed = true;
        if (that._isRequest) {
          that._options = this.extractOptions(this.message);
          let reqDeliverable: string = this._options[0];//that.extractDeliverable(that.message);
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
    if (!key) this._note = 'No deliverable specified; using latest. To specify an earlier deliverable, follow the metion with `#dX`.';
    let that = this;
    return new Promise<FetchedDeliverable>(async (fulfill, reject) => {
      try {
        let resultsDB = new Database(that.config.getDBConnection(), 'settings');
        let deliverablesDoc = await resultsDB.readRecord('deliverables');
        let deliverableRecord: DeliverableRecord = new DeliverableRecord(deliverablesDoc);
        let fetchedDeliverables: FetchedDeliverable[] = [];
        let now: Date = new Date();

        if (deliverableRecord.containsKey(key)) {
          let deliverable: Deliverable = deliverableRecord.item(key);

          // The key refers to a vaild deliverable that has been released
          if (new Date(deliverable.releaseDate) <= now) {
            return fulfill({
              key: key,
              deliverable: deliverableRecord.item(key)
            });
          // The key refers to a vaild deliverable that hasn't been released
          // Get all deliverables that have been released
          } else {
            this._note = 'The specified deliverable has not been released yet; using latest released.';
            for (const key of deliverableRecord.keys()) {
              let deliverable: Deliverable = deliverableRecord.item(key);
              if (new Date(deliverable.releaseDate) <= now) {
                fetchedDeliverables.push({key: key, deliverable: deliverable});
              }
            }
          }
          // The key refers to an invaild deliverable
          // Get all deliverables that have been released
        } else {
          if (!this._note)
            this._note = 'Invalid deliverable specified; using latest. To specify an earlier deliverable, follow the metion with `#dX`, where `X` is the deliverable.';
          for (const key of deliverableRecord.keys()) {
            let deliverable: Deliverable = deliverableRecord.item(key);
            if (new Date(deliverable.releaseDate) <= now) {
              fetchedDeliverables.push({key: key, deliverable: deliverable});
            }
          }
        }
        // Of the released deliverables, return the one with the latest due date
        let latestDeliverable: FetchedDeliverable = fetchedDeliverables.reduce((prev, current) => {
          return (prev.deliverable.dueDate > current.deliverable.dueDate) ? prev : current
        }, fetchedDeliverables[0]);

        fulfill(latestDeliverable);
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

  get note(): string {
    return this._note;
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
  get isProcessed(): boolean {
    return this._isProcessed;
  }
  set isProcessed(value: boolean) {
    this._isProcessed = value;
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
    let that = this;
    let comment = JSON.stringify(this.payload);
    let doc = {isRequest: this._isRequest, isProcessed: this._isProcessed, deliverable: this._deliverable, team: this.team, user: this.user, commit: this.commit, body: this.message, type: 'commit_comment', timestamp: this.timestamp}
    let attachments = [{name: 'comment.json', data: comment, content_type: 'application/json'}];
    let docName = this.timestamp + '_' + this.team + ':' + this.user + (this.deliverable ? '_' + this._deliverable : '');

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
    let matches: string[] = /.*#[dD](\d{1,2}).*/i.exec(comment);
    if (matches) {
      deliverable = 'd' + +matches[1];
    }

    return deliverable;
  }

  private extractOptions(comment: string): string[] {
    let options: string[] = [];
    let mentionTag: string = this.config.getMentionTag();
    let re: RegExp = new RegExp(mentionTag + '\\s*#([a-zA-Z0-9]+)','gi');
    let matches: string[] = re.exec(comment);
    if (matches) {
      matches.shift()
      options = matches.map(option => {
        return option.toLowerCase();
      });
    }
    return options;
  }
}

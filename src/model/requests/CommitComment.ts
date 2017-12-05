import * as Url from 'url';
import * as Moment from 'moment';

import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, CouchDatabase, DatabaseRecord, InsertResponse} from '../Database';
import {GithubUtil, Commit} from '../GithubUtil';
import {Deliverable, DeliverableRecord} from '../settings/DeliverableRecord';
import db from '../../db/MongoDB';
import DeliverableRepo from '../../repos/DeliverableRepo';

interface FetchedDeliverable {
  key: string;
  deliverable: Deliverable;
}

export interface CommitComment {
  isRequest: boolean;
  isProcessed: boolean;
  deliverable: string;
  team: string;
  user: string;
  commit: string;
  orgName: string;
  body: string;
  type: string;
  timestamp: number;
  attachments: object;
  idStamp: string;
}

export default class CommitCommentRecord {

  private config: IConfig;
  private payload: JSON;
  private courseNum: number;
  private team: string;
  private user: string;
  private hook: Url.Url;
  private commit: Commit;
  private message: string;
  private timestamp: number;

  private deliverable: string;
  private deliverableRate: number;
  private isRequest: boolean;
  private isProcessed: boolean;
  private options: string[] = [];
  private orgName: string;
  private note: string;

  constructor(courseNum: number) {
    try {
      this.config = new AppConfig();
      this.timestamp = +new Date();
      this.courseNum = courseNum;

    } catch(err) {
      throw 'Invalid commit comment.';
    }
  }

  public async process(payload: any) {
    let that = this;
    return new Promise(async (fulfill, reject) => {
      try {
        that.payload = JSON.parse(JSON.stringify(payload));
        that.commit = new Commit(payload.comment.commit_id);
        that.team = GithubUtil.getTeamOrProject(payload.repository.name);
        that.user = payload.comment.user.login;
        that.orgName = payload.organization.login;
        that.hook = Url.parse(payload.repository.commits_url.replace('{/sha}', '/' + this.commit) + '/comments');
        that.message = payload.comment.body;

        that.isRequest = payload.comment.body.toLowerCase().includes(this.config.getMentionTag());
        that.isProcessed = true;
        if (that.isRequest) {
          that.options = this.extractOptions(this.message);
          let reqDeliverable: string = this.options[0];//that.extractDeliverable(that.message);
          let deliverable: FetchedDeliverable = await that.fetchDeliverable(reqDeliverable, this.courseNum);
          that.deliverable = deliverable.key;
          that.deliverableRate = deliverable.deliverable.rate;
        }
        fulfill();
      } catch(err) {
        throw 'Unable to process grading request. ' + err;
      }
    });
  }

  private async fetchDeliverable(key: string, courseNum: number): Promise<FetchedDeliverable> {

    if (!key) this.note = 'No deliverable specified; using latest. To specify an earlier deliverable, follow the mention (ie. @autobot #d5).';
    let that = this;
    return new Promise<FetchedDeliverable>(async (fulfill, reject) => {
      try {
        let deliverableRepo = new DeliverableRepo();
        let deliverable: Deliverable = await deliverableRepo.getDeliverable(key, courseNum);
        let deliverables: Deliverable[] = await deliverableRepo.getDeliverables(this.courseNum);
        let fetchedDeliverables: FetchedDeliverable[] = [];
        let now: Date = new Date();

        if (typeof deliverable.name !== 'undefined' && deliverable.name === key) {

          // The key refers to a vaild deliverable that has been released
          if (new Date(deliverable.open) <= now && new Date(deliverable.close) >= now) {
            return fulfill({
              key: key,
              deliverable: deliverable
            });
          // The key refers to a vaild deliverable that hasn't been released
          // Get all deliverables that have been released
          } else if (new Date(deliverable.open) >= now && new Date(deliverable.close) >= now) {
            let date = Moment(deliverable.open).format('MMMM Do YYYY, h:mm:ss a');
            this.note = `The deliverable '${key}' has not been released. Please wait until ${date}.`;
            for (const deliv of deliverables) {
              if (new Date(deliv.open) <= now && new Date(deliv.close) >= now) {
                fetchedDeliverables.push({key: key, deliverable: deliv});
              }
            }
          // The key refers to a vaild deliverable that has been released but have been closed
          // Get all such deliverables
          } else if (new Date(deliverable.open) <= now && new Date(deliverable.close) >= now) {
            let date = Moment(deliverable.close).format('MMMM Do YYYY, h:mm:ss a');
            this.note = `The deliverable '${key}' is closed; The due date was ${date}.`;
            for (const deliv of deliverables) {
              if (new Date(deliv.open) <= now && new Date(deliv.close) >= now) {
                fetchedDeliverables.push({key: key, deliverable: deliv});
              }
            }
          }
          // The key refers to an invaild deliverable
          // Get all deliverables that have been released
        } else {
          if (!this.note)
            this.note = 'Invalid deliverable specified; using latest. To specify an earlier deliverable, follow the metion with `#dX`, where `X` is the deliverable.';
          for (const deliv of deliverables) {
            if (new Date(deliv.open) <= now) {
              fetchedDeliverables.push({key: key, deliverable: deliv});
            }
          }
        }
        // Of the released deliverables, return the one with the latest due date
        let latestDeliverable: FetchedDeliverable = fetchedDeliverables.reduce((prev, current) => {
          return (prev.deliverable.close > current.deliverable.close) ? prev : current
        }, fetchedDeliverables[0]);

        fulfill(latestDeliverable);
      } catch(err) {
          Log.error(`CommitComment::fulfill(latestDeliverable) ${err}`);
      }
    });
  }

  public getTeam(): string {
    return this.team;
  }

  public getUser(): string {
    return this.user;
  }

  public getCommit(): Commit {
    return this.commit;
  }
  public getHook(): Url.Url {
    return this.hook;
  }

  public getNote(): string {
    return this.note;
  }

  public getIsRequest(): boolean {
    return this.isRequest;
  }
  
  public getDeliverable(): string {
    return this.deliverable;
  }
  
  public getDeliverableRate(): number {
    return this.deliverableRate;
  }

  public getIsProcessed(): boolean {
    return this.isProcessed;
  }

  public getOrgName(): string {
    return this.orgName;
  }

  public setIsProcessed(value: boolean) {
    this.isProcessed = value;
  }

  public convertToJSON(): CommitComment {
    let that = this;
    let comment = JSON.stringify(this.payload);
    let docName = this.timestamp + '_' + this.team + ':' + this.user + (this.deliverable ? '_' + this.deliverable : '');
    let doc: CommitComment = {
      isRequest: this.isRequest,
      isProcessed: this.isProcessed,
      deliverable: this.deliverable,
      team: this.team, 
      user: this.user, 
      orgName: this.orgName,
      commit: this.commit.toString(), 
      body: this.message, 
      type: 'commit_comment', 
      timestamp: this.timestamp, 
      attachments: [{name: 'comment.json', data: comment, content_type: 'application/json'}],
      idStamp: docName
    }

    return doc;
  }

  private extractDeliverable(comment: string): string {
    let deliverable: string;
    let matches: string[] = /.*#[dDpP](\d|p{1,2}).*/i.exec(comment);
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

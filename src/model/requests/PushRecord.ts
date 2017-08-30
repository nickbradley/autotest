import {GithubUtil, Commit} from '../GithubUtil';
import * as Url from 'url';

export interface Push {
  team: string;
  user: string;
  commit: string;
  type: string;
  timestamp: number;
  attachments: object;
  idStamp: string;
}

export default class PushRecord {
  private payload: JSON;
  private _team: string;
  private _user: string;
  private _commit: Commit;
  private _deliverable: string;
  private _commentHook: Url.Url;
  private _ref: string;
  private _githubOrg: string;
  private timestamp: number;

  constructor(payload: any) {
    try {
      this.payload = payload;
      this._team = GithubUtil.getTeam(payload.repository.name);
      this._user = payload.pusher.name;
      this._deliverable = this.parseDeliverable(payload.repository.name);
      this._commit = new Commit(payload.after);
      this._githubOrg = payload.repository.owner.name;
      this._commentHook = Url.parse(payload.repository.commits_url.replace('{/sha}', '/' + this._commit) + '/comments');
      this._ref = payload.ref;
      this.timestamp = +new Date();
    } catch(err) {
      throw 'Failed to construct new PushRecord. ' + err;
    }
  }

  get deliverable(): string {
    return this._deliverable;
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
  get commentHook(): Url.Url {
    return this._commentHook;
  }
  get ref(): string {
    return this._ref;
  }

  get githubOrg(): string {
    return this._githubOrg;
  }

  public convertToJSON(): Push {
    let that = this;
    let docName = this.timestamp + '_' + this.team + ':' + this._commit.short;
    let payload = JSON.stringify(this.payload);
    let attachments = [{name: 'push.json', data: payload, content_type: 'application/json'}];
    let doc: Push = {
      team: this.team,
      user: this.user,
      commit: this.commit.toString(),
      type: 'push',
      timestamp: this.timestamp,
      attachments: attachments,
      idStamp: docName
    }

    return doc;
  }

  private parseDeliverable(fullRepoName: string): string {
    let deliverable = fullRepoName.match(/\_(.*)\_/);
    if (deliverable) {
      return deliverable.pop();
    }
  }
}

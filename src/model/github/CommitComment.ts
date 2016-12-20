// import 'reflect-metadata';
import Log from '../../Util';
// import {JsonObject, JsonMember, TypedJSON} from 'typedjson-npm';
import {CouchDatabase, Record, InsertResponse} from '../Database';
// import {Repository, Organization, Sender, Comment} from './Github';

// export default class CommitComment implements Record {
//   record: CommitCommentRecord;
//
//   constructor(data: JSON) {
//     this.record = TypedJSON.parse(JSON.stringify(data), CommitCommentRecord);
//   }
//
//   public async insert(db: CouchDatabase): Promise<InsertResponse> {
//     let that = this;
//     return new Promise<InsertResponse>((fulfill, reject) => {
//       db.insert(that.record, "", (err, result) => {
//         if (err) {
//           reject(err);
//         }
//
//         fulfill(result);
//       });
//     });
//   }
// }


export default class CommitCommentRecord implements Record {
  private data: JSON;
  private team: string;
  private user: string;
  private hook: string;
  private commit: string;
  private message: string;
  private timestamp: number;

  private _deliverable: string;
  private _isRequest: boolean;

  constructor(data: any, requestMention: string, defaultDeliverable: string) {
    try {
      // NOTE assume repository name is of the form: CS310-2016Fall/cpsc310project_team10
      let idx = data.repository.name.lastIndexOf('_')+1;

      this.data = data;
      this.commit = data.comment.commit_id;
      this.team = data.repository.name.slice(idx);
      this.user = data.comment.user.login;
      this.hook = data.repository.commits_url.replace('{/sha}', '/' + this.commit) + '/comments';
      this.message = data.comment.body;

      this.timestamp = +new Date();

      this._isRequest = data.comment.body.toLowerCase().includes(requestMention);
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
    let comment = JSON.stringify(this.data);
    let doc = {team: this.team, user: this.user, commit: this.commit, body: this.message, type: 'commit_comment', timestamp: this.timestamp}
    let attachments = [{name: 'comment.json', data: comment, content_type: 'application/json'}];
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



// @JsonObject
// class CommitCommentRecord {
//   @JsonMember({ type: String })
//   action: string;
//
//   @JsonMember({ type: Comment })
//   comment: Comment;
//
//   @JsonMember({ type: Repository })
//   repository: Repository;
//
//   @JsonMember({ type: Organization })
//   organization: Organization;
//
//   @JsonMember({ type: Sender })
//   sender: Sender;
// }






// @JsonObject
// export interface ICommitCommentRecord {
//     @JsonMember({ type: String })
//     action: string;
//
//     @JsonMember({ type: Comment })
//     comment: Comment;
//
//     @JsonMember({ type: Repository })
//     repository: Repository;
//
//     @JsonMember({ type: Organization })
//     organization: Organization;
//
//     @JsonMember({ type: Sender })
//     sender: Sender;
//
// }
//
// @JsonObject
// export class CommitCommentRecord implements Record {
//   @JsonMember({ type: String })
//   action: string;
//
//   @JsonMember({ type: Comment })
//   comment: Comment;
//
//   @JsonMember({ type: Repository })
//   repository: Repository;
//
//   @JsonMember({ type: Organization })
//   organization: Organization;
//
//   @JsonMember({ type: Sender })
//   sender: Sender;
//
//
//   constructor(data: JSON) {
//     this.data = TypedJSON.parse(data, CommitCommentRecord);
//   }
//
//   public insert(db: CouchDatabase): Promise<InsertResponse> {
//     let that = this;
//     return new Promise<InsertResponse>((fulfill, reject) => {
//       db.insert(that.data, "", (err, result) => {
//         if (err) {
//           reject(err);
//         }
//
//         fulfill(result);
//       });
//     });
//   }
// }

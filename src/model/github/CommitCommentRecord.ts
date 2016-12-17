import 'reflect-metadata';

import {JsonObject, JsonMember, TypedJSON} from 'typedjson-npm';
import {CouchDatabase, Record, InsertResponse} from '../Database';
import {Repository, Organization, Sender, Comment} from './Github';

export default class CommitComment implements Record {
  record: CommitCommentRecord;

  constructor(data: JSON) {
    this.record = TypedJSON.parse(JSON.stringify(data), CommitCommentRecord);
  }

  public async insert(db: CouchDatabase): Promise<InsertResponse> {
    let that = this;
    return new Promise<InsertResponse>((fulfill, reject) => {
      db.insert(that.record, "", (err, result) => {
        if (err) {
          reject(err);
        }

        fulfill(result);
      });
    });
  }
}


@JsonObject
class CommitCommentRecord {
  @JsonMember({ type: String })
  action: string;

  @JsonMember({ type: Comment })
  comment: Comment;

  @JsonMember({ type: Repository })
  repository: Repository;

  @JsonMember({ type: Organization })
  organization: Organization;

  @JsonMember({ type: Sender })
  sender: Sender;
}






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

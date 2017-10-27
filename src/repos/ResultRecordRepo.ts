/**
 * Created by steca
 */

import Log from '../Util';
import { IConfig, AppConfig } from '../Config';
import mongodb = require('mongodb');
import db, {Database, InsertOneResponse} from '../db/MongoDB';
import CommitCommentRecord, {CommitComment} from '../model/requests/CommitComment';
import ResultRecord, {Result} from '../model/results/ResultRecord';
import { Deliverable } from '../model/settings/DeliverableRecord';
import { Course } from '../model/settings/CourseRecord';

const REQUESTS_COLLECTION = 'requests';
const DELIVERABLES_COLLECTION = 'deliverables';
const OBJECT_ID_PROPERTY = '_id';

export default class CommitCommentRepo {

  private db: Database;

  constructor() {
    this.db = db;
  }
  
  /**
   * Retrieves the latest result record based on Query
   * @param _user: username of the github account
   * @param _deliverable: the abbreivation, ie. d1, d2, of the Deliverable.
   * @return Promise<CommitComment> CommitComment interface object
   */
  public getGithubGradeComments(_username: string, _commit: string): Promise<Result[]> {
    let query: object = { user: _username, commit: _commit };

    return new Promise<Result[]>((fulfill, reject) => {
      try {
        db.getRecords(REQUESTS_COLLECTION, query).then((results: Result[]) => {
          fulfill(results);
        });
      }
      catch (err) {
        Log.error(`CommitCommentRepo::getLatestGradeRequest: ${err}`);
        reject(err)
      }
    });
  }

  /**
   * Insert a CommitComment to the 'requests' collection on MongoDB
   * @param _commitComment CommitComment object that is being stored
   * @return <InsertOneResponse> that includes number of successful DB entries
   */
  public insertCommitComment(_commitComment: CommitComment): Promise<InsertOneResponse> {
    try {
      return new Promise<InsertOneResponse>((fulfill, reject) => {
        db.insertRecord(REQUESTS_COLLECTION, _commitComment)
          .then((response: InsertOneResponse) => {
            if (response.insertedCount > 0) {
              fulfill(response);
            }
            reject(response);
        });
      });
    }
    catch (err) {
      throw `CommitCommentRepo::insertCommitComment: ${err}.`
    }
  }
}

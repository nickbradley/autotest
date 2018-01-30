/**
 * Created by steca
 */

import Log from '../Util';
import { IConfig, AppConfig } from '../Config';
import mongodb = require('mongodb');
import db, {Database, InsertOneResponse} from '../db/MongoDB';
import PushRecord, {Push} from '../model/requests/PushRecord';
import CommitCommentRecord, {CommitComment} from '../model/requests/CommitComment';
import { Deliverable } from '../model/settings/DeliverableRecord';
import { Course } from '../model/settings/CourseRecord';

const REQUESTS_COLLECTION = 'requests';
const OBJECT_ID_PROPERTY = '_id';

export default class PushRecordRepo {

  private db: Database;

  constructor() {
    this.db = db;
  }

  /**
   * Insert a Push to the 'requests' collection on MongoDB
   * @param _push Push object that is being stored
   * @return <InsertOneResponse> that includes number of successful DB entries
   */
  public insertPushRecord(_push: Push): Promise<InsertOneResponse> {
    try {
      return new Promise<InsertOneResponse>((fulfill, reject) => {
        db.insertRecord(REQUESTS_COLLECTION, _push)
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

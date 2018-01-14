/**
 * Created by steca
 */

import Log from '../Util';
import { IConfig, AppConfig } from '../Config';
import mongodb = require('mongodb');
import db, {Database, InsertOneResponse} from '../db/MongoDB';
import CommitCommentRecord, {CommitComment} from '../model/requests/CommitComment';
import { Deliverable } from '../model/settings/DeliverableRecord';
import { Course } from '../model/settings/CourseRecord';

const REQUESTS_COLLECTION = 'requests';
const OBJECT_ID_PROPERTY = '_id';

export default class RequestRepo {

  private db: Database;

  constructor() {
    this.db = db;
  }
  
  /**
   * Retrieves the latest grade request **That has been graded/processed**
   * @param _user: username of the github account
   * @param _deliverable: the abbreivation, ie. d1, d2, of the Deliverable.
   * @return Promise<CommitComment> CommitComment interface object
   */
  public getLatestGradeRequest(_user: string, _deliverable: string, _repo: string, _orgName: string): Promise<CommitComment> {
    const PROCESSED = true;
    let query: object = { user: _user, deliverable: _deliverable, repo: _repo, orgName: _orgName, isProcessed: true };
    console.log(query);
    return new Promise<CommitComment>((fulfill, reject) => {
      try {
        db.getLatestRecord(REQUESTS_COLLECTION, query).then((latestCommitComment: CommitComment) => {
          console.log('fulfilled', latestCommitComment);
          fulfill(latestCommitComment);
        });
      }
      catch (err) {
        Log.error(`CommitCommentRepo::getLatestGradeRequest: ${err}`);
        reject(err)
      }
    });
  }

    /**
   * Retrieves the latest CommitComment where gradeRequested = true on repo and commit SHA.
   * @param _user: username of the github account
   * @param _repo: repo name of the repository
   * @param _commit: long SHA commit.
   * @return Promise<CommitComment> CommitComment interface object
   */
  public getLatestCommitGradeRequest(_user: string, _repo: string, _commit: string): Promise<CommitComment> {
    let query: object = { user: _user, repo: _repo, commit: _commit, isRequest: true };

    return new Promise<CommitComment>((fulfill, reject) => {
      try {
        db.getLatestRecord(REQUESTS_COLLECTION, query).then((latestCommitComment: CommitComment) => {
          fulfill(latestCommitComment);
        });
      }
      catch (err) {
        Log.error(`CommitCommentRepo::getLatestCommitGradeRequest: ${err}`);
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

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

const RESULTS_COLLECTION = 'results';
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
        db.getRecords(RESULTS_COLLECTION, query).then((results: Result[]) => {
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
   * Update ResultRecords with gradeRequested boolean flag based on isProcessed 
   * && isRequest == true in RequestRecord.
   * @param _commitComment CommitComment object that is being stored
   * @return <InsertOneResponse> that includes number of successful DB entries
   */
  public updateGradeRequestedStatus(_request: CommitCommentRecord): Promise<mongodb.UpdateWriteOpResult> {
    let context: mongodb.Db; 
    let requests: Request[];
    let results: Result[];
    let resultIds: string[] = [];
    let orgName: string = _request.getOrgName();
    let deliverable: string = _request.getDeliverable();
    let user: string = _request.getUser();
    let commit: string = _request.getCommit().short;
    let repo: string = _request.getRepo();
    let requestTimeStamp: number;
    let requestCommentUrl: string = _request.getHtmlUrl().substring(0, _request.getHtmlUrl().indexOf('#'));

    return new Promise<mongodb.UpdateWriteOpResult>((fulfill, reject) => {
      return db.initDB()
        .then((_db: mongodb.Db) => {
          if (_db) {
            context = _db;
            return _db;
          }
          throw `Could not retrieve DB connection in updateResultRecords()`;
        })
        .then(() => {
          return new Promise<Result[]>((fulfill, reject) => {
            context.collection(RESULTS_COLLECTION).find({user, commit, deliverable, orgName, repo})
              .toArray((err: Error, _results: Result[]) => {
                if (_results.length > 0) {
                  results = _results;
                  _results.map((result: any) => {
                    resultIds.push(result._id); 
                  })
                  fulfill(_results);
                  return;
                }
                reject(`Could not find any results under commit ${commit} with username ${user}`);
            });
          });
        })
        .then(() => {
          let updateIds: any = [];
          return new Promise<mongodb.UpdateWriteOpResult>((fulfill, reject) => {
            context.collection(REQUESTS_COLLECTION).find({'commit.commitString': { $regex: commit}, user: user})
              .toArray((err: Error, requests: Request[]) => {

              // if isProcessed becomes true, then all ResultRecords get updated gradeRequested flag with
              // the timestamp from the Request.
              let isRequest: boolean = false;
              let firstGradeRequestTime: number = -1;

              requests.some((request: any, index: number) => {

                let requestCommentData = JSON.parse(request.attachments[0].data);

                if (request.isRequest || _request.getIsProcessed()) {
                  isRequest = true;
                  firstGradeRequestTime = new Date(requestCommentData.comment.created_at).getTime();
                  return request.isRequest === true || _request.getIsProcessed();
                }
              });

              context.collection(RESULTS_COLLECTION).updateMany({_id: {$in: resultIds}}, { 
                $set: { 
                  gradeRequested: isRequest, 
                  gradeRequestedTimeStamp: firstGradeRequestTime
                }
              })
              .then((onFulfilled: mongodb.UpdateWriteOpResult) => {
                if (onFulfilled) {
                  Log.info('ResultRecordRepo::updateGradeRequestStatus() matched ' + onFulfilled.matchedCount
                   + 'result records on ' + `${deliverable}, ${orgName}, ${user}, and ${repo} for ${commit}`);
                  fulfill(onFulfilled);    
                } else {
                  throw 'ResultRecordRepo::updateResultRecordsGradeRequested() ERROR No ResultRecords could ' + 
                  'be updated';
                }
                return;
              });
            });
          });
        })
        .then((onfulfilled: mongodb.UpdateWriteOpResult) => {
          fulfill(onfulfilled);
        })
        .catch((err: any) => {
          Log.error('ResultRecordRepo::updateGradeRequestedStatus() ERROR ' + err);
        });
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
        db.insertRecord(RESULTS_COLLECTION, _commitComment)
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

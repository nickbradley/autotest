import * as Moment from 'moment';
import * as Url from 'url'

import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
import CommitCommentRecord, {CommitComment} from '../../model/requests/CommitComment';
import {GithubResponse, Commit} from '../../model/GithubUtil';
import PostbackController from './PostbackController'
import {Course} from '../../model/business/CourseModel';
import {AdminRecord, Admin} from '../../model/settings/AdminRecord';
import TestJobController from '../TestJobController';
import GithubGradeComment from '../../model/results/GithubGradeComment';
import {Job} from '../../model/JobQueue';
import {RedisUtil} from '../../model/RedisUtil';
import RedisManager from '../RedisManager';
import db from '../../db/MongoDB';
import RequestRepo from '../../repos/RequestRepo';
import ResultRecordRepo from '../../repos/ResultRecordRepo';
import DeliverableRepo from '../../repos/DeliverableRepo';
import {Deliverable} from '../../model/settings/DeliverableRecord';
import CourseRepo from '../../repos/CourseRepo';


const COURSE_210: number = 210;
const COURSE_310: number = 310;
const IMAGE_NAME_310: string = 'cpsc310__bootstrap';
const IMAGE_NAME_210: string = 'cpsc210__bootstrap';

export interface PendingRequest {
  requestor: string;
  commit: string;
  team: string;
  user: string;
  orgName: string;
  deliverable: string;
  hook: string;
  commitComment: string // must be converted to string for redis and converted back to CommitComment type;
}

export interface JobIdData {
  dockerImage: string;
  dockerBuild: string;
  deliverable: string;
  team: string;
  commit: string;
}

export default class CommitCommentContoller {
  private config: IConfig;
  private record: CommitCommentRecord;
  private courseNum: number;
  
  constructor(courseNum: number) {
    this.config = new AppConfig();
    this.courseNum = courseNum;
  }

  private getImageName(): string {
    switch (this.courseNum) {
      case COURSE_210:
        return IMAGE_NAME_210;
      case COURSE_310:
        return IMAGE_NAME_310;
    }
  }

  async process(data: JSON): Promise<GithubResponse> {
    let that = this;
    return new Promise<GithubResponse>(async (fulfill, reject) => {
      try {
        let redisPort = RedisUtil.getRedisPort(this.courseNum);
        let redis: RedisManager = new RedisManager(redisPort);
        let queue: TestJobController = TestJobController.getInstance(this.courseNum);
        let record: CommitCommentRecord = new CommitCommentRecord(this.courseNum);
        let response: GithubResponse;
        let delivRepo: DeliverableRepo = new DeliverableRepo();
        let deliv: Deliverable;

        await redis.client.connect();
        await record.process(data);
        this.record = record;

        await delivRepo.getDeliverable(record.getDeliverable(), this.courseNum)
          .then((_deliv: Deliverable) => {
            deliv = _deliv;
          });

        let isAdmin: boolean = await that.isAdmin(record.getUser())
          .catch((err) => {
            Log.error(`CommitCommentController:: isAdmin ERROR ` + err);
            return null;
          });

        if (record.getIsRequest()) {
          let team: string = record.getTeam();
          let user: string = record.getUser();
          let requestor: string = record.getRequestor();
          let orgName: string = record.getOrgName();
          let commit: string = record.getCommit().short;
          let deliverable: string = record.getDeliverable();
          let reqId: string = team + '-' + commit + '-' + deliverable;

          let req: PendingRequest = {
            requestor: requestor,
            commit: commit,
            team: team,
            user: user,
            orgName: orgName,
            deliverable: deliverable,
            commitComment: JSON.stringify(that.record.convertToJSON()),
            hook: record.getHook().toString()
          }

          console.log('debuggin req', req);

          let hasPending: boolean = true;
          let pendingRequest: PendingRequest
          try {
            await redis.client.isReady
            await redis.client.connect();
            console.log('made it to connect');
            pendingRequest = await redis.client.get(reqId);
            console.log('pendingRequest state', pendingRequest);
            // await redis.client.disconnect();
          } catch(err) {
            Log.info(`CommitCommentController:: INFO CommentComment requested. No prior pending request found for ` + err);
            hasPending = false;
          }

          if (hasPending) {
            Log.info('CommitCommentController::process() - ['+ reqId +'] User has pending request.');
            let body: string;
            if (pendingRequest.commit === commit) {
              body = 'You have already requested a grade for **'+deliverable+'** on this commit. Please wait for a response before making another request.';
            } else {
              body = 'You have a pending grade request for **'+deliverable+'** on commit ' + pendingRequest.commit + '. Please wait for a response before making another request.';
            }
            response = {
              statusCode: 429,
              body: body
            }
          } else {
            // Is a grade request that is not already being waited for.
            let lastRequest: Date = await that.getLatestRequest(record.getUser(), record.getRepo(), record.getDeliverable(), record.getOrgName());
            let diff: number = +new Date() - +lastRequest;
            if (diff > record.getDeliverableRate() || isAdmin) {
              try {
                let githubGradeComment: GithubGradeComment = new GithubGradeComment(record.getTeam(), record.getCommit().short, record.getDeliverable(), this.record.getOrgName(), this.record.getNote());
                await githubGradeComment.fetch();
                let postbackOnComplete: boolean = githubGradeComment.getPostbackOnComplete()
                if (githubGradeComment.getPostbackOnComplete()) {
                  // postback on complete is a freebie, such as if a build fails, and does not count as a request even if they make a request
                  record.setIsProcessed(false); 
                }
                let githubFeedback: string = await githubGradeComment.formatResult();
                response = {
                  statusCode: 200,
                  body: githubFeedback
                }
              } catch(err) {
                Log.info('CommitCommentController::process() - No results for request.');
                record.setIsProcessed(false)
                try {
                  Log.info('CommitCommentController::process() - Checking if commit is queued.')
                  let maxPos: number = await that.isQueued(deliv, record.getTeam(), record.getCommit())
                  let body: string;
                  try {
                    let imageName = this.getImageName();
                    let jobIdData: JobIdData = { 
                        dockerImage: deliv.dockerImage,
                        dockerBuild: deliv.dockerBuild,
                        deliverable: req.deliverable,
                        team: req.team,
                        commit: req.commit,
                      };
                    let jobId: string = deliv.dockerImage + ':' + deliv.dockerBuild + '|' + req.deliverable + '-' + req.team+ '#' + req.commit;
                    await redis.client.set(reqId, req);
                    await queue.promoteJob(jobId, jobIdData, redis.client);

                    body = 'This commit is still queued for processing against **'+deliverable+'**. Your results will be posted here as soon as they are ready.' + (this.record.getNote() ? '\n_Note: ' + this.record.getNote() + '_' : '');// There are ' + maxPos + (maxPos > 1 ? ' jobs' : ' job') + ' queued.';
                  } catch(err) {
                    body = 'This commit is still queued for processing against **'+deliverable+'**. Please try again in a few minutes.';
                  }
                  response = {
                    statusCode: 200,
                    body: body
                  }
                } catch(err) {
                  Log.error('CommitCommentContoller::process() - ERROR Unable to locate test results. ' + err);
                  response = {
                    statusCode: 404,
                    body: 'We can\'t seem to find any results for this commit. We even tried the latest **' + deliverable +'** on this commit. Please make a new commit and try again.' + (this.record.getNote() ? '\n_Note: ' + this.record.getNote() + '_' : '')
                  }
                }
              }
            } else {
              Log.info('CommitCommentContoller::process() - Request rate exceeded.');
              let waitTime: number = record.getDeliverableRate() - diff;
              record.setIsProcessed(false);
              response = {
                statusCode: 429,
                body: 'Sorry, you must wait ' + Moment.duration(waitTime).humanize() + ' before you make another request for '+deliverable+'.'
              }
            }
          }
          try {
            let status: number = await that.postComment(record.getHook(), response.body);
          } catch(err) {
            Log.error('CommitCommentContoller::process() - ERROR. Failed to post result. ' + err);
          }
        } else {
          // Just logs an empty note if the CommitCommentController is hit without a request.
          response = {
            statusCode: 204,
            body: ''
          }
        }


        try {
          await that.store(record);
        } catch(err) {
          Log.error('CommitCommentContoller::process() - ERROR. Failed to store result. ' + err);
        }

        //Log.info('CommitCommentContoller::process() - Request completed with status ' + response.statusCode + '.');
        fulfill(response);
        redis.client.disconnect();

      } catch(err) {
        throw 'Failed to process commit comment. ' + err;
      }
    });
  }


  /**
   * Extract the mention options which can be 'force' or the deliverable name.
   *
   * @param requestMsg: string
   */
  //  private async extractMentionOptions(requestMsg: string): string {
  //
  //  }

  /**
   * Checks to see if the user is in the admin list in the database.
   *
   *  @param user
   */
  private async isAdmin(user: string): Promise<boolean> {
    
    let that = this;
    return new Promise<boolean>(async (fulfill, reject) => {
      try {
        // convert database result of strings[] to ObjectIDs[] to be queried with MongoDB        
        let adminRecordsIds: string[] = await db.getRecord('courses', { courseId: this.courseNum.toString() })
          .then((course: Course) => {
            return course.admins;
          });

        let adminRecords = await db.getObjectIds('users', '_id', adminRecordsIds)

        adminRecords.map((adminObject: Admin) => {

          let adminRecord = new AdminRecord(adminObject);
          
          if (adminRecord.getUsername().toLowerCase().indexOf(user) > -1) {
            fulfill(true);
          }
        });
        // if no admin course records are found
        fulfill(false);
      } catch(err) {
        Log.error(`CommitCommentController::isAdmin() Failed to retrieve admin list. ${err}`)
        reject('Failed to retrieve admin list. ' + err);
      }
    });
  }

  private async postComment(hook: Url.Url, msg: string): Promise<number> {
    let controller: PostbackController = new PostbackController(hook);
    return controller.submit(msg);
  }

  /**
   * Checks if the request is in the job queue.
   *
   */
  private async isQueued(deliverable: Deliverable, team: string, commit: Commit): Promise<number> {
    //  jobId: job.test.image + '|'  + job.team + '#' + job.commit,
    return new Promise<number>((fulfill, reject) => {
      let imageName = this.getImageName();
      let jobId: string = deliverable.dockerImage + ':' + deliverable.dockerBuild + '|' + deliverable.name + '-' + team + '#' + commit.short;
      let queue: TestJobController = TestJobController.getInstance(this.courseNum);

      queue.getJob(jobId).then(job => {
        if (!job)
          return reject('Job not found');
        job.getState().then(state => {
          if (state == 'completed' || state == 'failed')
            return reject('Job already completed');
          fulfill(0);
        }).catch(err => {
          return reject(err);
        })
      }).catch(err => {
        reject(err);
      });
   });
  }

  /**
   * Query the database to determine the date of the most recent request for the
   * deliverable made by the user.
   *
   * @param user - GitHub username.
   * @param deliverable - Deliverable identifier (i.e. d1, d2, etc.).
   */
  private async getLatestRequest(user: string, repo: string, deliverable: string, orgName: string): Promise<Date> {
    let requestRepo: RequestRepo = new RequestRepo();
    let that = this;
    return new Promise<Date>(async (fulfill, reject) => {
      try {
        let latestCommitComment: CommitComment = await requestRepo.getLatestGradeRequest(user, deliverable, repo, orgName);
        let latestDate: Date = new Date(0);
        if (latestCommitComment) {
          latestDate = new Date(latestCommitComment.timestamp)
        }
        fulfill(latestDate);
      } catch(err) {
        reject('Failed to get latest request of user ' + user + ' for deliverable ' + deliverable + '. ' + err);
      }
    });
  }

  /**
   * Updates corresponding GithubGradeComment, with the same username, branch, and commit in the ResultRecord,
   * if isProcessed and isRequest are both set to True in the @param CommitCommentRecord. If not processed, 
   * ResultRecords with same commit, branch and user are set to False;
   * 
   *  @param record - the record to analyze if isProcessed and isRequest is true
   */

  private async addGradeRequestedStatus(_record: CommitCommentRecord) {
    let commit: string = _record.getCommit().short;
    let commitUrl: string = _record.getCommitCommentUrl().split('#')[0];
    let gradeRequested: boolean = true;
    let requestor: string = this.record.getUser();
    let resultRecordRepo: ResultRecordRepo = new ResultRecordRepo();    
    
    if (_record.getIsProcessed() && _record.getIsRequest()) {
      

      return resultRecordRepo.addGradeRequestedInfo(commitUrl, requestor)
      .then((fulfilledResponse) => {
        // If results found, update ResultRecords with true/false isProcessed and isRequest statuses
        Log.info(`CommitCommentController::addGradeRequestedStatus Succesfully updated ${fulfilledResponse.result.nModified} record.`)
        return;
        // throw `CommitCommentController:: addGradeRequestedStatus() No ResultRecords could be found for Commit ${commit}`;
      });
    }




  }

  /**
   * Insert the request into the database.
   *
   * @param record - the record to insert into the database.
   */
  private async store(record: CommitCommentRecord) {
    let commitCommentRepo: RequestRepo = new RequestRepo();
    
    return commitCommentRepo.insertCommitComment(record.convertToJSON())
      .then((fulfilledResponse) => {
        if (fulfilledResponse.insertedCount > 0) {
          return this.addGradeRequestedStatus(record);
        }
      });
  }
}
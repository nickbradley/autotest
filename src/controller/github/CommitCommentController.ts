import * as Moment from 'moment';
import * as Url from 'url'

import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
import CommitCommentRecord from '../../model/requests/CommitComment';
import {GithubResponse, Commit} from '../../model/GithubUtil';
import PostbackController from './PostbackController'
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import TestJobController from '../TestJobController';
import * as redis from 'redis';
import ResultRecord from '../../model/results/ResultRecord';
import {Job} from '../../model/JobQueue';


interface PendingRequest {
  commit: string;
  team: string;
  user: string;
  deliverable: string;
  hook: string;
}


export default class CommitCommentContoller {
  private config: IConfig;
  private record: CommitCommentRecord;
  private rclient: redis.RedisClient;
  private ready: boolean;

  constructor() {
    this.config = new AppConfig();
    this.ready = false;
    this.rclient = redis.createClient();
    this.rclient.on('connect', () => {
      this.ready = true;
    });
  }


  async process(data: JSON): Promise<GithubResponse> {
    let that = this;
    return new Promise<GithubResponse>(async (fulfill, reject) => {
      try {
        let record: CommitCommentRecord = new CommitCommentRecord();
        let response: GithubResponse;


        await record.process(data);
        this.record = record;







        let isAdmin: boolean = await that.isAdmin(record.user);

        if (record.isRequest) {
          let team: string = record.team;
          let user: string = record.user;
          let commit: string = record.commit.short;
          let deliverable: string = record.deliverable;
          let reqId: string = team + '-' + user + '#' + commit + ':' + deliverable;


          let req: PendingRequest = {
            commit: commit,
            team: team,
            user: user,
            deliverable: deliverable,
            hook: record.hook.toString()
          }

          let hasPending: boolean = true;
          let pendingRequest: PendingRequest
          try {
            pendingRequest = await this.getPendingRequest(user, deliverable);
          } catch(err) {
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
            let lastRequest: Date = await that.getLatestRequest(record.user, record.deliverable);
            let diff: number = +new Date() - +lastRequest;
            if (diff > record.deliverableRate || isAdmin) {
              try {
                let resultRecord: ResultRecord = new ResultRecord(record.team, record.commit.short, record.deliverable, this.record.note);
                await resultRecord.fetch();
                let body: string = resultRecord.formatResult();
                response = {
                  statusCode: 200,
                  body: body
                }
              } catch(err) {
                Log.info('CommitCommentContoller::process() - No results for request.');
                record.isProcessed = false;
                try {
                  Log.info('CommitCommentController::process() - Checking if commit is queued.')
                  let maxPos: number = await that.isQueued(record.deliverable, record.team, record.commit);
                  let body: string;
                  try {
                    await this.setRequest(req);
                    body = 'This commit is still queued for processing against **'+deliverable+'**. Your results will be posted here as soon as they are ready.' + (this.record.note ? '\n_Note: ' + this.record.note + '_' : '');// There are ' + maxPos + (maxPos > 1 ? ' jobs' : ' job') + ' queued.';
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
                    body: 'We can\'t seem to find any results for **'+deliverable+'** on this commit. Please make a new commit and try again.' + (this.record.note ? '\n_Note: ' + this.record.note + '_' : '')
                  }
                }
              }
            } else {
              Log.info('CommitCommentContoller::process() - Request rate exceeded.');
              let waitTime: number = record.deliverableRate - diff;
              record.isProcessed = false;
              response = {
                statusCode: 429,
                body: 'Sorry, you must wait ' + Moment.duration(waitTime).humanize() + ' before you make another request for '+deliverable+'.'
              }
            }
          }
          try {
            let status: number = await that.postComment(record.hook, response.body);
          } catch(err) {
            Log.error('CommitCommentContoller::process() - ERROR. Failed to post result. ' + err);
          }
        } else {
          //Log.info('CommitCommentContoller::process() - Not request.');
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

      } catch(err) {
        throw 'Failed to process commit comment. ' + err;
      }
    });
  }

  private async setRequest(req: PendingRequest) {
    let key: string = req.user+'-'+req.deliverable;
    let jobId: string = 'autotest/'+req.deliverable+'-testsuite:latest|'+req.team+'#'+req.commit;
    return new Promise((fulfill, reject) => {
      this.rclient.hmset(key, req, (err, reply) => {
        if (err) {
          Log.warn('CommitCommentContoller::setRequest() - ['+jobId+'] Failed to store request. ' + err);
          reject(err);
        } else {
          Log.info('CommitCommentContoller::setRequest() - ['+jobId+'] Set up auto post.');
          let queue: TestJobController = TestJobController.getInstance();
          this.rclient.expire(key, 60*60*2);
          queue.promoteJob(jobId);
          fulfill();
        }
      });
    });
  }
  private async getPendingRequest(user: string, deliverable: string): Promise<PendingRequest> {
    let id: string = user+'-'+deliverable;
    return new Promise<PendingRequest>((fulfill, reject) => {
      this.rclient.hgetall(id, (err, object) => {
        if (err || !object) {
          Log.warn('CommitCommentContoller::getPendingRequest() - ['+id+'] Failed to get pending request. ' + err);
          reject(err || 'null value');
        } else {
          Log.info('CommitCommentContoller::getPendingRequest - ['+id+'] Found PendingRequest. ');
          fulfill(object);
        }
      });
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
    let db = new Database(this.config.getDBConnection(), 'settings');
    let that = this;
    return new Promise<boolean>(async (fulfill, reject) => {
      try {
        let adminRecord: any = await db.readRecord('admins');
        let admins: string[] = Object.keys(adminRecord).filter(key => {
          return !key.startsWith('_');
        }).map(name => {
          return name.toLowerCase()
        });
        fulfill(admins.indexOf(user.toLowerCase()) !== -1);
      } catch(err) {
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
  private async isQueued(deliverable: string, team: string, commit: Commit): Promise<number> {
    //  jobId: job.test.image + '|'  + job.team + '#' + job.commit,
    return new Promise<number>((fulfill, reject) => {
      let jobId: string = 'autotest/' + deliverable + '-testsuite:latest|' + team + '#' + commit.short;
      let queue: TestJobController = TestJobController.getInstance();

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
  private async getLatestRequest(user: string, deliverable: string): Promise<Date> {
    let db: Database = new Database(this.config.getDBConnection(), 'requests');
    let designName: string = 'latest';
    let viewName: string = 'byUserDeliverable';
    let params: QueryParameters = {
      key: [user, deliverable]
    };
    let that = this;
    return new Promise<Date>(async (fulfill, reject) => {
      try {
        let view: ViewResponse = await db.view(designName, viewName, params);
        let latestDate: Date = new Date(0);
        if (view.rows.length > 0) {
          latestDate = new Date(+view.rows[0].value)
        }
        fulfill(latestDate);
      } catch(err) {
        reject('Failed to get latest request of user ' + user + ' for deliverable ' + deliverable + '. ' + err);
      }
    });
  }





  /**
   * Insert the request into the database.
   *
   * @param record - the record to insert into the database.
   */
  private async store(record: CommitCommentRecord) {
    let db: Database = new Database(this.config.getDBConnection(), 'requests');
    return db.createRecord(record);
  }
}

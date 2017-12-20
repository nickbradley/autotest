import Log from '../Util';
import {JobQueue, ProcessJobCallback, ActiveJobCallback, CompletedJobCallback, FailedJobCallback, Job,JobOpts,JobPromise, CallbackOpts} from '../model/JobQueue';
import {IConfig, AppConfig} from '../Config';
import TestController from './TestController';
import {TestStatus} from '../model/results/TestRecord';
import * as Url from 'url';
import {GithubUsername, Commit} from '../model/GithubUtil';
import {RedisUtil} from '../model/RedisUtil';
import {Visibility} from '../model/settings/DeliverableRecord';
import PostbackController from './github/PostbackController';
import CommitCommentController from './github/CommitCommentController'
import RequestRepo from '../repos/RequestRepo';
import RedisManager from './RedisManager';
import Server from '../../src/rest/Server'

// types are basic because queue strips out functions
export interface TestJobDeliverable {
  dockerInput: object;
  deliverable: string;
  dockerImage: string;
  dockerBuild: string;
  stamp: string;
}

export interface TestJob {
  username: string;
  team: string;
  repo: string;
  closeDate: number;
  openDate: number;
  projectUrl: string;
  commitUrl: string;
  commit: string;
  hook: Url.Url;
  timestamp: number;
  ref: string;
  test: TestJobDeliverable;
  courseNum: number;
  githubOrg: string;
}

export interface TestQueueStats {
  qname: string;
  completed: number;
  failed: number;
  delayed: number;
  active: number;
  waiting: number;
  paused: number;
}

interface Manager {
  qname: string;
  qconcurrency: number;
  queue: JobQueue;
}

export default class TestJobController {
  private static instance: TestJobController;
  private static instances: TestJobController[];
  private stdManager: Manager;
  private expManager: Manager;

  private redisPort: number;
  private _redisAddress: Url.Url;
  private process: ProcessJobCallback;
  private completed: CompletedJobCallback;
  private failed: FailedJobCallback;
  private active: ActiveJobCallback;
  private testQueue: JobQueue;

  get redisAddress(): Url.Url {
    return this._redisAddress;
  }

  set redisAddress(redisAddress: Url.Url) {
    this._redisAddress = redisAddress;
  }

  private constructor(redisPort: number) {
    let config: IConfig = new AppConfig();
    this._redisAddress = config.getRedisAddress();
    this._redisAddress.port = redisPort.toString();
    this.redisPort = redisPort;

    let stdQName: string = 'autotest-testqueue-std';
    let stdQPool: number = 1;

    let expQName: string = 'autotest-testqueue-exp';
    let expQPool: number = 2;

    let that = this;

    this.process = function(job: Job, opts: CallbackOpts) {
      return new Promise((fulfill, reject) => {
        let testJob: TestJob = job.data as TestJob;
        let controller: TestController = new TestController(testJob);
        controller.exec().then((result) => {
          let testStatus: TestStatus = result;
          controller.store().then(() => {
            fulfill(testStatus);
          }).catch(err => {
            reject(err);
          })
        }).catch(err => {
          console.log('TestJobController:: Error executing Test Job')
          reject(err);
        });
      });
    };

    this.completed = async function(job: Job, result: any, opts: CallbackOpts) { // Result was TestStatus
      Log.info('JobQueue::completed() - ['+opts.qname+']' + job.jobId + '.');
      let jobData: TestJob = job.data as TestJob;
      let controller: PostbackController = new PostbackController(jobData.hook);
      let msg: string;

      let pendingRequest;
      let pendingRequest2;
      let dl: string = jobData.test.deliverable;

      let reqId: string = jobData.team + '-' + jobData.commit + '-' + jobData.test.deliverable;

      try {
        let redis: RedisManager = new RedisManager(that.redisPort);
        let requestRepo = new RequestRepo();
        await redis.client.connect();
        pendingRequest = await redis.client.get(reqId);
        
        pendingRequest2 = await requestRepo.getLatestCommitGradeRequest(jobData.username, jobData.repo, jobData.commit);


        // replace pendingRequest with 
        await redis.client.del(reqId);
        await redis.client.disconnect();
      }
      catch(err) {
        Log.error('JobQueue::completed() - ERROR ' + err);
      }

      // Check if GradeRequested flag hit on commit. If so, Postback the githubComment property right away.   
      
      msg = "textplace holder for git commit comments to Github -- refactor in progress"
      
      if (pendingRequest2) {
        Log.info('TestJobController:: Pending Request on commit ' + pendingRequest.commit + ' and ' + pendingRequest.team);
        let team: string = pendingRequest.team;
        let orgName: string = pendingRequest.orgName;
        let commit: string = pendingRequest.commit;
        let deliverable: string = pendingRequest.deliverable;
        let controller: CommitCommentController = new CommitCommentController(this.courseNum);
        // let githubGradeComment: GithubGradeComment = new GithubGradeComment(team, commit, deliverable, orgName, '');
        // await githubGradeComment.fetch();
        // msg = githubGradeComment.formatResult();
        msg = JSON.stringify('pendingRequest2, ', pendingRequest2);
      }
      await controller.submit(msg);
    }

    this.failed = function(job: Job, error: Error, opts: CallbackOpts) {
      Log.error('JobQueue::failed() - [' + opts.qname + '] ' + job.jobId + '. ' + error);
    }
    this.active = function(job: Job, jobPromise: JobPromise, opts: CallbackOpts) {
      Log.trace('JobQueue::active() - [' + opts.qname + '] ' + job.jobId + '.');
    }

    this.stdManager = {
      qname: stdQName,
      qconcurrency: stdQPool,
      queue: new JobQueue(stdQName, stdQPool, this.redisAddress, this.process, this.completed, this.failed, this.active)
    }

    this.expManager = {
      qname: expQName,
      qconcurrency: expQPool,
      queue: new JobQueue(expQName, expQPool, this.redisAddress, this.process, this.completed, this.failed, this.active)
    }
  }

  public static getInstance(courseNum: number): TestJobController {

    // Instantiates and reuses a Singleton for each port/class, and keeps it stored in an array.

    let redisPort = RedisUtil.getRedisPort(courseNum);
    if (!TestJobController.instances) {
      let testJobController: TestJobController = new TestJobController(redisPort);
      TestJobController.instances = new Array();
      TestJobController.instance = testJobController;
      TestJobController.instances.push(testJobController);
    return testJobController;
    } else {
      for ( let testJobController of TestJobController.instances) {
        if (testJobController.redisPort === redisPort) {
          return testJobController;
        } 
      }
      let testJobController = new TestJobController(redisPort);
      TestJobController.instances.push(testJobController);
      return testJobController;
    }
  }

  /**
   * Adds the given job to the standard queue.
   *
   * @param job
   */
  public async addJob(job: TestJob): Promise<Job> {
    let opts: JobOpts = {
      jobId: job.test.dockerImage + ':' + job.test.dockerBuild + '|' + job.test.deliverable + '-'  + job.team + '#' + job.commit,
      removeOnComplete: true
    }
    return <Promise<Job>>this.stdManager.queue.add(job, opts);
  }

  /**
   * Remove the job from the standard queue and move it to the express queue. If
   * the job is active in the standard queue, do not add to express queue, as we do 
   * not want duplicate ResultRecords produced.
   *
   * @param id: the id of the job to prioritize.
   */
  public async promoteJob(id: string) {
    try {
      let job: Job = await this.stdManager.queue.getJob(id);
      let jobState: string = await job.getState();
      if (jobState !== 'active' && jobState !== 'failed') {
        await this.stdManager.queue.remove(job.jobId);
        await this.expManager.queue.add(job.data, job.opts);
        Log.info('TestJobController::promoteJob() - The job ' + id + ' was successfully moved to the express queue.');
      } else if (jobState === 'active') {
        Log.info('TestJobController::promoteJob() - The job ' + id + ' cannot be promoted because it is already ' + jobState);        
      } else {
        Log.info('TestJobController::promoteJob() - The job ' + id + ' was not be promoted because it is ' + jobState);
      }
    } catch(err) {
      Log.warn('TestManager::promoteJob() - Failed to promote job' + id + '. ' + err);
      throw 'Failed to promote job.';
    }
  }

  public async getJob(jobId: string) {
    return this.stdManager.queue.getJob(jobId);
    //
    //   this.expManager.queue.getJob(jobId).then((job) => {
    //     if (job)
    //       fulfill(job);
    //     else
    //       reject('Job no longer exists');
    //     // console.log('fulfill for exp queue', job)
    //   }).catch(() => {
    //     // console.log('Job not in the express queue.')
    //     this.stdManager.queue.getJob(jobId).then((job) => {
    //       // console.log('fulfill from std queue', job)
    //       if (job)
    //         fulfill(job);
    //       else
    //       reject('Job no longer exists');
    //     }).catch((err) => {
    //       // console.log('Job not in the standard queue either.')
    //       reject(err);
    //     });
    //   });
    // });
  }

  /**
   * Returns the number of jobs that are waiting or paused in the express queue.
   */
  public async getCount(): Promise<number> {
    if (!TestJobController.instance) {
      Log.warn('TestJobController::count() - Called before init.');
      return Promise.resolve(0);
    }
    return this.expManager.queue.count();
  }

  /**
   *  Returns the number of jobs by state for jobs in each queue.
   */
  public async getStats(): Promise<TestQueueStats[]> {
    let promises: Promise<TestQueueStats>[] = [];
    return new Promise<TestQueueStats[]>((fulfill, reject) => {
      promises.push(this.stdManager.queue.stats());
      promises.push(this.expManager.queue.stats());
      Promise.all(promises).then((stats: TestQueueStats[]) => {
        fulfill(stats);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Closes the underlying bull queues.
   */
  public async close() {
    let promises: Promise<any>[] = [];
    return new Promise((fulfill, reject) => {
      promises.push(this.stdManager.queue.close());
      promises.push(this.expManager.queue.close());
      Promise.all(promises).then(() => {
        fulfill();
      }).catch((err) => {
        Log.error('TestJobController::close - ERROR closing the underlying queues. ' + err);
        reject(err);
      });
    });
  }
}

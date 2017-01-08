import Log from '../Util';
import {JobQueue, ProcessJobCallback, ActiveJobCallback, CompletedJobCallback, FailedJobCallback, Job,JobOpts,JobPromise} from '../model/JobQueue';
import {IConfig, AppConfig} from '../Config';
import TestController from './TestController';
import {TestStatus} from '../model/results/TestRecord';
import * as Url from 'url';
import {GithubUsername, Commit} from '../model/GithubUtil';
import {Visibility} from '../model/settings/DeliverableRecord';
import PostbackController from './github/PostbackController';

// types are basic because queue strips out functions
export interface TestJobDeliverable {
  name: string;
  image: string;
  visibility: number;
  deliverable: string;
}
export interface TestJob {
  user: string;
  team: string;
  commit: string;
  hook: Url.Url
  test: TestJobDeliverable;
}


export default class TestJobController {
  private static instance: TestJobController;
  private name: string;
  private concurrency: number = 1;
  private redisAddress: Url.Url;
  private process: ProcessJobCallback;
  private completed: CompletedJobCallback;
  private failed: FailedJobCallback;
  private active: ActiveJobCallback;
  private testQueue: JobQueue;

  private constructor() {
    let config: IConfig = new AppConfig();
    this.name = 'autotest-testqueue';
    this.redisAddress = config.getRedisAddress();

    this.process = function(job: Job) {
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
          reject(err);
        })
      });
    };

    this.completed = async function(job: Job, result: TestStatus) {
      Log.info('JobQueue::init() - Job Completed.')
      let jobData: TestJob = job.data as TestJob;
      let controller: PostbackController = new PostbackController(jobData.hook);

      if (result.buildFailed) {
        let msg: string = ':warning:**AutoTest Warning**: Unable to build project.\n\n```' + result.buildMsg + '\n```';
        await controller.submit(msg);
      } else if (result.containerExitCode > 0) {
        let msg: string = ':warning:**AutoTest Warning**: Unable to run tests. Please ensure all promises return to avoid hitting a timeout. Exit ' + result.containerExitCode +'.';
        await controller.submit(msg);
      }
    }
    this.failed = function(job: Job, error: Error) {
      Log.error('JobQueue::init() - Job failed.')
    }
    this.active = function(job: Job, jobPromise: JobPromise) {}

    this.testQueue = new JobQueue(this.name, this.concurrency, this.redisAddress, this.process, this.completed, this.failed, this.active);
  }

  public static getInstance(): TestJobController {
    if (!TestJobController.instance) {
      TestJobController.instance = new TestJobController();
    }
    return TestJobController.instance;
  }

  public async addJob(job: TestJob): Promise<Job> {
    let opts: JobOpts = {
      jobId: job.test.image + '|'  + job.team + '#' + job.commit,
      removeOnComplete: true
    }
    return this.testQueue.add(job, opts);
  }

  public async count(): Promise<number> {
    return this.testQueue.count();
  }

  public async close() {
    return this.testQueue.close();
  }
}

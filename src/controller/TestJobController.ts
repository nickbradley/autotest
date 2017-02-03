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
  private concurrency: number = 3;
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
          console.log('Error executing')
          reject(err);
        })
      });
    };

    this.completed = async function(job: Job, result: TestStatus) {
      Log.info('JobQueue::completed() - ' + job.jobId + '.');
      let jobData: TestJob = job.data as TestJob;
      let controller: PostbackController = new PostbackController(jobData.hook);

      if (result.buildFailed) {
        Log.info('JobQueue::completed() - build failed for ' + job.jobId + '.');
        let msg: string = ':warning:**AutoTest Warning**: Unable to build project.\n\n```' + result.buildMsg + '\n```';
        await controller.submit(msg);
      } else if (result.containerExitCode > 0) {
        Log.info('JobQueue::completed() - container exited with code ' + result.containerExitCode + ' for ' + job.jobId + '.');
        let msg: string = ':warning:**AutoTest Warning**: Unable to run tests. Exit ' + result.containerExitCode +'.';
        switch(result.containerExitCode) {
          case 124:
            msg = ':warning:**AutoTest Warning**: Test container forcefully terminated after executing for >5 minutes. (Exit 124: Test cotnainer timeout exceeded).';
          break;
          case 29:
            msg = ':warning:**AutoTest Warning**: You are logging too many messages to the console. Before you can receive a grade, you must reduce your output. (Exit 29: Test container stdio.txt exceeds 5MB).'
          break;
          case 30:
            msg = ':warning:**AutoTest Warning**: Test container failed to emit stdio. Try making another commit and, if it fails, post a comment on Piazza including your team and commit SHA. (Exit 30: Test container failed to emit stdio.txt).';
          break;
          case 31:
            msg = ':warning:**AutoTest Warning**: Unhandled exception occurred when AutoTest executed **your** tests. Please make sure your tests run without error on your computer before committing to GitHub. (Exit 31: Test container failed to emit coverage.json).';
          break;
          case 32:
            msg = ':warning:**AutoTest Warning**: Unhandled exception occurred when AutoTest executed its test suite. Please make sure you handle exceptions before committing to GitHub. (Exit 31: Test container failed to emit mocha.json).';
          break;
        }
        await controller.submit(msg);
      }
    }
    this.failed = function(job: Job, error: Error) {
      Log.error('JobQueue::failed() - ' + job.jobId + '. ' + error);
    }
    this.active = function(job: Job, jobPromise: JobPromise) {
      Log.trace('JobQueue::active() - ' + job.jobId + '.');
    }

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

  public async get(jobId: string) {
    return this.testQueue.get(jobId);
  }

  public async count(): Promise<number> {
    return this.testQueue.count();
  }

  public async close() {
    return this.testQueue.close();
  }
}

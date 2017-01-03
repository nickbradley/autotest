import {JobQueue, ProcessJobCallback, Job,JobOpts} from '../model/JobQueue';
import {IConfig, AppConfig} from '../Config';
import TestController from './TestController';
import * as Url from 'url';
import {GithubUsername, Commit} from '../model/GithubUtil';
import {Visibility} from '../model/settings/DeliverableRecord';


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
  test: TestJobDeliverable;
}


export default class TestJobController {
  private static instance: TestJobController;
  private name: string;
  private concurrency: number = 1;
  private redisAddress: Url.Url;
  private process: ProcessJobCallback;
  private testQueue: JobQueue;

  private constructor() {
    let config: IConfig = new AppConfig();
    this.name = 'autotest-testqueue';
    this.redisAddress = config.getRedisAddress();
    this.process = function(job: Job) {
      return new Promise((fulfill, reject) => {
        let testJob: TestJob = job.data as TestJob;
        let controller: TestController = new TestController(testJob);
        controller.exec().then(() => {
          controller.store().then(() => {
            fulfill();
          }).catch(err => {
            reject(err);
          })
        }).catch(err => {
          reject(err);
        })
      });
    };
    this.testQueue = new JobQueue(this.name, this.concurrency, this.redisAddress, this.process);
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

import {JobQueue, ProcessJobCallback, Job} from '../model/JobQueue';
import {IConfig, AppConfig} from '../Config';
import TestController from './TestController';
import * as Url from 'url';


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
        console.log('Processing job!');
        //let controller: TestController = new TestController()
        //reject('Process callback not implemented.');
        fulfill();
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

  public async addJob(job): Promise<Job> {
    return this.testQueue.add(job);
  }

  public async count(): Promise<number> {
    return this.testQueue.count();
  }

  public async close() {
    return this.testQueue.close();
  }
}

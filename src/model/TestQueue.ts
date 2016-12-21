let url = require('url')

import * as bull from 'bull';
import {Commit} from './GithubUtil';


interface TestError {}
interface TestResult {}

export interface TestComplete {
  job: bull.Job;
  failed: boolean;
  result: TestResult | TestError;
}

export interface TestQueueItem {
  team: string;
  commit: Commit;
}



// extend AddOptions interface defined in ts file.
// Newest version supports more options.
interface AddOptions extends bull.AddOptions{
  jobId?: number | string;
  removeOnComplete?: boolean;
}


export default class TestQueue {
  private queue: bull.Queue;
  private queueName: string;
  private redisHost: string;
  private redisPort: number;

  private isOpen: boolean = false;
  private isClosing: Promise<boolean>;
  private isClosed: boolean = false;

  private notifier: Promise<boolean>;
  private concurrency: number = 1;
  private size: number = 0;

  constructor(redisAddress: string, queueName: string) {
    try {
      let addr: URL = url.parse(redisAddress);
      this.queueName = queueName;
      this.redisHost = addr.host;
      this.redisPort = +addr.port;
    } catch(err) {
      throw 'Failed to create test queue. ' + err;
    }
  }

  public async open(): Promise<boolean> {
    let that = this;
    return new Promise<boolean>((fulfill, reject) => {
      try {
        that.queue = bull(that.queueName, that.redisPort, that.redisHost);
        that.queue.process(that.concurrency, job => {
          return that.process(job);
        });
        that.notifier = this.notify();
        that.ready().then(() => {
          that.isOpen = true;
          fulfill(true);
        }).catch(err => {
          reject(err)
        });
      } catch(err) {
        reject(err);
      }
    });
  }

  public async close(): Promise<boolean> {
    this.isClosing = Promise.resolve(true);
    await this.queue.close();
    await this.notifier;
    this.isClosed = true;

    return Promise.resolve(true);
  }

  private async ready(): Promise<boolean> {
    let that = this;
    return new Promise<boolean>(fulfill => {
      that.queue.on('ready', () => {
        fulfill(true);
      });
    })
  }

  /**
   * Returns the added Job.
   * Note: can only queue one team#commit job at a time (team#commit acts as the id)
   */
  public async add(item: TestQueueItem): Promise<bull.Job> {
    let op: AddOptions = {
      jobId: item.team + "#" + item.commit.short(),
      removeOnComplete: true
    }
    return this.queue.add(item, op);
  }

  private async notify(): Promise<boolean> {
    // while (!this.isClosing) {
    //   await new Promise<TestComplete>((fulfill, reject) => {
    //     this.queue.on('completed', (job: bull.Job, result: TestResult) => {
    //       fulfill({job: job, failed: false, result: result});
    //     });
    //     this.queue.on('failed', (job: bull.Job, testError: TestError) => {
    //       fulfill({job: job, failed: true, result: testError});
    //     })
    //     this.queue.on('error', err => {
    //       reject(err);
    //     })
    //   });
    // }
    // return Promise.resolve(true);


    this.queue.on('completed', (job: bull.Job, result: TestResult) => {

    });
    this.queue.on('failed', (job: bull.Job, testError: TestError) => {

    })
    this.queue.on('error', err => {

    })

    return this.isClosing;
  }

  public async isQueued(team: string, commit: Commit) {
    return this.queue.getJob(team + '#' + commit.short());
  }

  /**
   * Removes the specified job if it is still in the queue.
   */
  public async remove(job: bull.Job) {
    return job.remove();
  }



  private async process(job: bull.Job): Promise<TestResult> {

    // do processing here (i.e. run docker container)

    return Promise.resolve();
  }
}

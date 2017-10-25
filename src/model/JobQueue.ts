import Log from '../Util';
import * as bull from 'bull';
import {Url} from 'url';
import {Commit} from './GithubUtil';
import {Deliverable} from './settings/DeliverableRecord'

export {JobPromise} from 'bull';

// Newest version supports more option then specified in type file
export interface JobOpts extends bull.AddOptions {
  jobId?: number | string;
  removeOnComplete?: boolean;
}

// These are private methods within Bull
interface Queue extends bull.Queue {
  getCompletedCount(): Promise<number>;
  getFailedCount(): Promise<number>;
  getDelayedCount(): Promise<number>;
  getActiveCount(): Promise<number>;
  getWaitingCount(): Promise<number>;
  getPausedCount(): Promise<number>;
}

// Not defined in type file
export interface Job extends bull.Job {
  getState(): Promise<string>;
  opts: Object;
}

export interface CallbackOpts {
  qname: string;
}
export type ProcessJobCallback = (job: bull.Job, opts: CallbackOpts) => Promise<any>;
export type ActiveJobCallback = (job: bull.Job, jobPromise: bull.JobPromise, opts: CallbackOpts) => void;
export type CompletedJobCallback = (job: bull.Job, result: Object, opts: CallbackOpts) => void;
export type FailedJobCallback = (job: bull.Job, error: Error, opts: CallbackOpts) => void;

export class JobQueue {
  private queue: Queue;
  private redis: Url;
  private name: string;
  private concurrency: number;
  private processCallback: ProcessJobCallback;
  private activeCallback: ActiveJobCallback;
  private completedCallback: CompletedJobCallback;
  private failedCallback: FailedJobCallback;
  private initialized: boolean = false;

  constructor(name: string, concurrency: number, redisAddress: Url, process: ProcessJobCallback, completed: CompletedJobCallback, failed: FailedJobCallback, active: ActiveJobCallback) {
    this.name = name;
    this.redis = redisAddress;
    this.concurrency = (concurrency <= 0 ? 0 : concurrency);    
    this.processCallback = process;
    this.completedCallback = completed;
    this.failedCallback = failed;
    this.activeCallback = active;
  }

  public async init() {
    Log.trace('JobQueue::init() - ['+this.name+'] Starting.');
    try {
      if (!this.initialized) {
        this.initialized = true;
        console.log('Connected to' + this.name + ' ' + this.redis.port + ' ' + this.redis.host);
        this.queue = <Queue>bull(this.name, +this.redis.port, this.redis.host);
        this.queue.process(this.concurrency, (job: bull.Job) => {
          return this.processCallback(job, {qname: this.name});
        });
        this.queue.on('active', (job: bull.Job, jobPromise: bull.JobPromise) => {
          return this.activeCallback(job, jobPromise, {qname: this.name});
        });
        this.queue.on('completed', (job: bull.Job, result: Object) => {
          return this.completedCallback(job, result, {qname: this.name});
        });
        this.queue.on('failed', (job: bull.Job, error: Error) => {
          return this.failedCallback(job, error, {qname: this.name});
        });
        this.queue.on('error', err => {
          Log.error('JobQueue::init() - ['+this.name+'] ERROR with queue. ' + err);
        });
        this.queue.on('stalled', job => {
          Log.error('JobQueue::init() - ['+this.name+'] ERROR Job ' + job.jobId + ' is stalled.');
        });

        let that = this;
        return new Promise((fulfill, reject) => {
          that.queue.on('ready', () => {
            // that.queue.clean(1000, 'delayed').then(() => {
            //
            // })
            Log.trace('JobQueue::init() - ['+this.name+'] Ready.')
            fulfill();
          });
        });
      }
    } catch(err) {
      console.log(err);
      throw 'Failed to start job queue "' + this.name + '". ' + err;
    }
  }


  public async add(job: Object, opts: JobOpts): Promise<bull.Job> {
    if (!this.initialized) {
      await this.init();
    }
    Log.info('JobQueue::add() - ['+this.name+'] Added job ' + opts.jobId + '.')
    return this.queue.add(job, opts);
  }

  public async remove(id: string) {

  }

  public async getJob(id: string): Promise<Job> {
    if (!this.initialized) {
      await this.init();
    }
    return <Promise<Job>>this.queue.getJob(id);
  }

  public async count() {
    if (!this.initialized) {
      await this.init();
    }
    return this.queue.count();
  }

  // WARNING: using private methods from bull!
  public async stats() {
    if (!this.initialized) {
      await this.init();
    }
    let promises: Promise<number>[] = [];
    return new Promise((fulfill, reject) => {
      promises.push(this.queue.getCompletedCount());
      promises.push(this.queue.getFailedCount());
      promises.push(this.queue.getDelayedCount());
      promises.push(this.queue.getActiveCount());
      promises.push(this.queue.getWaitingCount());
      promises.push(this.queue.getPausedCount());
      Promise.all(promises).then((counts: number[]) => {
        fulfill({
          qname: this.name,
          completed: counts[0],
          failed: counts[1],
          delayed: counts[2],
          active: counts[3],
          waiting: counts[4],
          paused: counts[5]
        })
      }).catch((err) => {
        Log.warn('Err' + err);
        reject(err);
      });
    });
  }

  public async close() {
    Log.info('JobQueue::close() - Closing.')
    this.initialized = false;
    return this.queue.close();
  }
}

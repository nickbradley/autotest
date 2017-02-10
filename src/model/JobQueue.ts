import Log from '../Util';
import * as bull from 'bull';
import {Url} from 'url';
import {Commit} from './GithubUtil';
import {Deliverable} from './settings/DeliverableRecord'

export {Job, JobPromise} from 'bull';

// Newest version supports more option then specified in type file
export interface JobOpts extends bull.AddOptions {
  jobId?: number | string;
  removeOnComplete?: boolean;
}

// export interface JobData {
//   dName: string,
//   team: string,
//   commit: Commit
// }


// interface ProcessJobCallback {
//   (job: bull.Job) => void;
// }

export type ProcessJobCallback = (job: bull.Job) => Promise<any>;
export type ActiveJobCallback = (job: bull.Job, jobPromise: bull.JobPromise) => void;
export type CompletedJobCallback = (job: bull.Job, result: Object) => void;
export type FailedJobCallback = (job: bull.Job, error: Error) => void;

export class JobQueue {
  private queue: bull.Queue;
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
    Log.trace('JobQueue::init() - Starting.');
    try {
      if (!this.initialized) {
        this.initialized = true;
        this.queue = bull(this.name, +this.redis.port, this.redis.host);
        this.queue.process(this.concurrency, this.processCallback);
        this.queue.on('active', this.activeCallback);
        this.queue.on('completed', this.completedCallback);
        this.queue.on('failed', this.failedCallback);
        this.queue.on('error', err => {
          Log.error('JobQueue::init() - ERROR with queue. ' + err);
        });
        this.queue.on('stalled', job => {
          Log.error('JobQueue::init() - ERROR Job ' + job.jobId + ' is stalled.');
        });

        let that = this;
        return new Promise((fulfill, reject) => {
          that.queue.on('ready', () => {
            // that.queue.clean(1000, 'delayed').then(() => {
            //
            // })
            Log.trace('JobQueue::init() - Ready.')
            fulfill();
          });
        });
      }
    } catch(err) {
      throw 'Failed to start job queue "' + this.name + '". ' + err;
    }
  }


  public async add(job: Object, opts: JobOpts): Promise<bull.Job> {
    if (!this.initialized) {
      await this.init();
    }
    Log.info('JobQueue::add() - Added job ' + opts.jobId + '.')
    return this.queue.add(job, opts);
  }

  public async remove(id: string) {

  }

  public async get(id: string) {
    return this.queue.getJob(id);
  }

  public async count() {
    if (!this.initialized) {
      await this.init();
    }
    return this.queue.count();
  }

  public async close() {
    Log.info('JobQueue::close() - Closing.')
    this.initialized = false;
    return this.queue.close();
  }
}

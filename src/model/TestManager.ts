import Log from '../Util';
import * as bull from 'bull';
import {IConfig, AppConfig} from '../Config';
import {Url} from 'url';

export interface JobId {

}

export interface Job {

}



export class TestManager {
  private standardQueueName: string;
  private expressQueueName: string;
  private standardQueue: bull.Queue;
  private expressQueue: bull.Queue;
  private _ready: Promise<void>;

  constructor(name: string) {
    let config: IConfig = new AppConfig();
    let redisAddress: Url = config.getRedisAddress();

    let stdQueueName: string = name + '-std';
    let stdQueueConcurrency: number = 1;
    let stdQueueReady: boolean = false;

    let expQueueName: string = name + '-pri';
    let expQueueConcurrency: number = 2;
    let expQueueReady: boolean = false;

    this.standardQueue = bull(stdQueueName, +redisAddress.port, redisAddress.host);
    this.standardQueue.process(stdQueueConcurrency, function(job: bull.Job) {
       this.processCallback(stdQueueName, job);
    });
    this.standardQueue.on('ready', () => {
      stdQueueReady = true;
      if (expQueueReady)
        Promise.resolve(this._ready);
    });
    this.standardQueue.on('error', function(error: Error) {
      this.errorCallback(stdQueueName, error);
    });
    this.standardQueue.on('active', function(job: bull.Job, jobPromise: bull.JobPromise) {
      this.activeCallback(stdQueueName, job, jobPromise);
    });
    this.standardQueue.on('stalled', function(job: bull.Job) {
      this.stalledCallback(stdQueueName, job);
    });
    this.standardQueue.on('progress', function(job: bull.Job, progress: number) {
      this.progressCallback(stdQueueName, job, progress);
    });
    this.standardQueue.on('completed',function(job: bull.Job, result: any) {
      this.completedCallback(stdQueueName, job, result);
    });
    this.standardQueue.on('failed', function(job: bull.Job, error: Error) {
      this.failedCallback(stdQueueName, job, error);
    });
    this.standardQueue.on('paused', function() {
      this.pausedCallback(stdQueueName)
    });
    this.standardQueue.on('resumed', function(job: bull.Job) {
      this.resumedCallback(stdQueueName, job)
    });
    this.standardQueue.on('cleaned', function(jobs: bull.Job[], type: string) {
      this.cleanedCallback(stdQueueName, jobs, type);
    });


    this.expressQueue = bull(expQueueName, +redisAddress.port, redisAddress.host);
    this.expressQueue.process(expQueueConcurrency, function(job: bull.Job) {
       this.processCallback(expQueueName, job);
    });
    this.expressQueue.on('ready', () => {
      expQueueReady = true;
      if (stdQueueReady)
        Promise.resolve(this._ready);
    });
    this.expressQueue.on('error', function(error: Error) {
      this.errorCallback(expQueueName, error);
    });
    this.expressQueue.on('active', function(job: bull.Job, jobPromise: bull.JobPromise) {
      this.activeCallback(expQueueName, job, jobPromise);
    });
    this.expressQueue.on('stalled', function(job: bull.Job) {
      this.stalledCallback(expQueueName, job);
    });
    this.expressQueue.on('progress', function(job: bull.Job, progress: number) {
      this.progressCallback(expQueueName, job, progress);
    });
    this.expressQueue.on('completed',function(job: bull.Job, result: any) {
      this.completedCallback(expQueueName, job, result);
    });
    this.expressQueue.on('failed', function(job: bull.Job, error: Error) {
      this.failedCallback(expQueueName, job, error);
    });
    this.expressQueue.on('paused', function() {
      this.pausedCallback(expQueueName)
    });
    this.expressQueue.on('resumed', function(job: bull.Job) {
      this.resumedCallback(expQueueName, job)
    });
    this.expressQueue.on('cleaned', function(jobs: bull.Job[], type: string) {
      this.cleanedCallback(expQueueName, jobs, type);
    });
  }

  public get ready(): Promise<void> {
    return this._ready;
  }

// Abstract away the queue stuff (just showw the data attribute)
  public async addJob(job: Job): Promise<bull.Job> {
    let data = {};
    let opts = {};
    return this.standardQueue.add(data, opts);
  }
  public async getJob(id: JobId): Promise<bull.Job> {
    // TODO check both queues
    return this.standardQueue.getJob(<string>id);
  }
  public async removeJob(id: JobId): Promise<void> {
    let job: bull.Job;
    try {
      // TODO check both queues
      job = await this.standardQueue.getJob(<string>id);
    } catch(err) {
      Log.warn('TestManager::removeJob() - Job ' + id + ' not found. ' + err);
      throw ''
    }

    return job.remove();
  }

  /**
   * Remove the job from the standard queue and move it to the priority queue. If
   * the job is active in the standard queue, do nothing.
   *
   * @param id: the id of the job to prioritize.
   */
  public async prioritizeJob(id: JobId) {

  }

  /**
   * Close the underlying redis client for both queues.
   */
  public async close(): Promise<void> {
    let promises: Promise<void>[] = [];
    return new Promise<void>((fulfill, reject) => {
      promises.push(this.standardQueue.close());
      promises.push(this.priorityQueue.close());
      Promise.all(promises).then(() => {
        fulfill();
      }).catch((err) => {
        Log.warn('TestManager::close() - Failed to close queues. ' + err);
        reject(err);
      });
    });
  }



  private processCallback = async function(qname: string, job: bull.Job) {
    try {
      let testJob: TestJob = job.data as TestJob;
      let controller: TestController = new TestController(testJob);

      // execute the test container
      let testStatus = await controller.exec();

      // save the results to the database
      await controller.store();

      return testStatus;
    } catch (err) {
      Log.error('TestManager::process() - ERROR executing tests. ' + err);
    }
  }

  private completedCallback = async function(qname: string, job: Job, result: TestStatus) {


    Log.info('TestManager::completed() - ' + job.jobId + '.');
    let jobData: TestJob = job.data as TestJob;
    let controller: PostbackController = new PostbackController(jobData.hook);
    let postRequest = await this.pendingRequest('X');

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
    } else if (postRequest) {
      await controller.submit('Food goes in here!');
    }
    // If job has pending request, then post the results (unless their was an error)
  }

  private errorCallback = function(qname: string, error: Error) {
    Log.error('TestManager::error() - ' + qname + ' encountered an ERROR. ' + error);
  }
  private activeCallback = function(qname: string, job: bull.Job, jobPromise: bull.JobPromise) {
    Log.info('TestManager::active() - ' + job.jobId + ' is running on ' + qname + '.');
  }
  private stalledCallback = function(qname: string, job: bull.Job) {
    Log.warn('TestManager::stalled() - ' + job.jobId + ' is stalled on ' + qname + '.');
  }
  private progressCallback = function(qname: string, job: bull.Job, progress: number) {
    // We don't track job progress
  }
  private failedCallback = function(qname: string, job: bull.Job, error: Error) {
    Log.warn('TestManager::failed() - ' + job.jobId + ' failed on ' + qname + ' with error ' + error + '.');
  }
  private pausedCallback = function(qname: string) {
    Log.info('TestManager::paused() - ' + qname + ' has be paused.');
  }
  private resumedCallback = function(qname: string, job: bull.Job) {
    Log.info('TestManager::resumed() - ' + qname + ' has resumed.');
  }
  private cleanedCallback = function(qname: string, jobs: bull.Job[], type: string) {
    Log.info('TestManager::cleaned() - The following ' + type + ' jobs have be cleared from ' + qname + '. Jobs: ' +jobs.toString());
  }
}

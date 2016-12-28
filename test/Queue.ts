import * as Url from 'url';
import {JobQueue, ProcessJobCallback, Job, JobData} from '../src/model/JobQueue';
import {Commit} from '../src/model/GithubUtil';

describe('Queue', function() {
  let queue: JobQueue;
  before(async function () {
    this.timeout(6000);

    let redisAddress: Url.Url = Url.parse('http://localhost:6379');
    let process: ProcessJobCallback = function(job: Job) {
      return new Promise((fulfill, reject) => {
        console.log('****** JOB PROCESSED ******');
        fulfill(job);
      });
    };
    queue = new JobQueue('autotest-testqueue', 1, redisAddress, process)
    await queue.init();

  });

  it('should process an item.', async function() {
    this.timeout(6000);
    let commit: Commit = new Commit('35b8b42b554d2b98230320b727b452d0abe9aaae');
    let jobData: JobData = {
      team: 'team86',
      commit: commit
    }
    let promises: Promise<Job>[] = [];
    promises.push(queue.add(jobData));
    promises.push(queue.add({team:'team85', commit: commit}));
    promises.push(queue.add({team:'team84', commit: commit}));
    promises.push(queue.add({team:'team83', commit: commit}));
    //await queue.startProcessing();
  })
});

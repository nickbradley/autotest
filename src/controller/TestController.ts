import cp = require('child_process');
import tmp = require('tmp');
import fs = require('fs');
import {IConfig, AppConfig} from '../Config';
import {Database} from '../model/Database';
import TestRecord from '../model/results/TestRecord';
import {TestJob} from './TestJobController';
import TestRecordRepo from '../repos/TestRecordRepo';

export default class TestController {
  private config: IConfig;
  private resultsDB: Database;
  private testJob: TestJob
  private result: TestRecord;

  constructor(testJob: TestJob) {
    this.config = new AppConfig();
    this.result = new TestRecord(this.config.getGithubToken(), testJob);
    this.testJob = testJob;
  }

  public async exec() {
    return this.result.generate();
  }

  public async store() {
    let testRecordRepo: TestRecordRepo = new TestRecordRepo();
    // This may be have to turned off and the TestController may have to perform this function when it throws a 
    // timeout error from now on. --> Line 30: let result = await this.result.getTestRecord();
    // let result = await this.result.getTestRecord();
    // return testRecordRepo.insertTestRecord(result);
  }

}

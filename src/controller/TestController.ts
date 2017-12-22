import cp = require('child_process');
import tmp = require('tmp');
import fs = require('fs');
import Log from '../Util';
import {IConfig, AppConfig} from '../Config';
import {Database} from '../model/Database';
import TestRecord, {TestInfo} from '../model/results/TestRecord';
import {TestJob} from './TestJobController';
import TestRecordRepo from '../repos/TestRecordRepo';
import StdioRepo from '../repos/StdioRecordRepo';


export default class TestController {
  private config: IConfig;
  private resultsDB: Database;
  private testJob: TestJob
  private testRecord: TestRecord;

  constructor(testJob: TestJob) {
    this.config = new AppConfig();
    this.testRecord = new TestRecord(this.config.getGithubToken(), testJob);
    this.testJob = testJob;
  }

  public async exec() {
    return this.testRecord.generate()
      .then((testInfo: TestInfo) => {
        if (testInfo.containerExitCode === 124) {
          console.log('TestController:: exec() testRecord.getTestRecord()', this.testRecord.getTestRecord());
          // this.store(this.testRecord.getTestRecord());
          console.log('TestController::exec() This TIMED OUT successfully. ResultRecord should be saved in this case.');
        } else {
          // this.store(this.testRecord.getTestRecord());
          console.log('TestController::exec() This did not TIME OUT. ResultRecord should not be saved in this case.');
        }
        return testInfo;        
      });
  }

  public async store(testRecord) {
    let testRecordRepo: TestRecordRepo = new TestRecordRepo();
    testRecordRepo.insertTestRecord(testRecord);
    // This may be have to turned off and the TestController may have to perform this function when it throws a 
    // timeout error from now on. --> Line 30: let result = await this.result.getTestRecord();
    // let result = await this.result.getTestRecord();
    // return testRecordRepo.insertTestRecord(result);
  }

}

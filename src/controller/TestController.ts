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
import StdioRecordRepo, {StdioRecord} from '../repos/StdioRecordRepo';


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
        return testInfo;        
      });
  }

  public async store(testInfo: TestInfo) {

    let stdioRepo = new StdioRecordRepo();
    let testRecordRepo: TestRecordRepo = new TestRecordRepo();
    let stdioRecord: StdioRecord = {stdio: null, idStamp: null};

    try {
      stdioRecord = {stdio: testInfo.testRecord.attachments[0], idStamp: testInfo.testRecord.stdioRef};
    } catch(err) {
      Log.error('TestController:: Unable to create stdioRecord ERROR ' + err);
    }

    if (testInfo.containerExitCode === 124) {
      stdioRepo.insertStdioRecord(stdioRecord);
      Log.info('TestController::exec() INFO Test ' + testInfo.testRecord.commit +
       ' exit code 124 TIMEOUT; ResultRecord saved by AutoTest.');
       testRecordRepo.insertTestRecord(testInfo.testRecord);
    } else if (testInfo.containerExitCode === 125) {
      stdioRepo.insertStdioRecord(stdioRecord);
      Log.error('TestController::exec() ERROR Test ' + testInfo.testRecord.commit +
       ' exit code 125 RUN COMMAND FAILED; ResultRecord saved by AutoTest');
       testRecordRepo.insertTestRecord(testInfo.testRecord);
    } else {
      stdioRepo.insertStdioRecord(stdioRecord);
      Log.info('TestController::exec() INFO Test exit code:' + testInfo.containerExitCode +  ' commit: ' +
       testInfo.testRecord.commit + ' '  + '; Expecting ResultRecord saved by API.');
    }
  }

}

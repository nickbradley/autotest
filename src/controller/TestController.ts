import cp = require('child_process');
import tmp = require('tmp');
import fs = require('fs');
import {IConfig, AppConfig} from '../Config';
import {Database} from '../model/Database';
import TestRecord from '../model/results/TestRecord';
import * as test from '../model/results/TestRecord';
import {TestJob} from './TestJobController';



export default class TestController {
  private config: IConfig;
  private resultsDB: Database;

  private testJob: TestJob
  private result: TestRecord;

  constructor(testJob: TestJob) {
    this.config = new AppConfig();
    this.resultsDB = new Database(this.config.getDBConnection(), 'results');
    this.result = new TestRecord(this.config.getGithubToken(), testJob);
    this.testJob = testJob;
  }


  public async exec() {
    return this.result.generate();
  }
  public async store() {
    return this.resultsDB.createRecord(this.result);
  }

}

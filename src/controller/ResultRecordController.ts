import cp = require('child_process');
import tmp = require('tmp');
import fs = require('fs');
import {IConfig, AppConfig} from '../Config';
import {Database} from '../model/Database';
import TestRecord from '../model/results/TestRecord';
import {TestJob} from './TestJobController';
import TestRecordRepo from '../repos/TestRecordRepo';

export default class ResultRecordController {
  private config: IConfig;
  private resultsDB: Database;
  private courseNum: number;

  constructor(courseNum: number) { // resultRecord: ResultRecord
    this.config = new AppConfig();
    this.courseNum = courseNum;
  }

  public async exec() {
    //
  }

  public async store() {
    let testRecordRepo: TestRecordRepo = new TestRecordRepo();
    let angeboot = null;
    // let result = await this.result.getTestRecord();
    return testRecordRepo.insertTestRecord(angeboot);
  }

}

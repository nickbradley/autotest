import cp = require('child_process');
import tmp = require('tmp');
import fs = require('fs');
import {IConfig, AppConfig} from '../Config';
import {Database} from '../model/Database';
import TestRecord from '../model/TestRecord';





export default class TestController {
  private resultsDB: Database;

  private team: string;
  private commit: string;
  private testName: string;

  constructor(team: string, commit: string, testName: string) {
    let config: IConfig = new AppConfig();
    this.resultsDB = new Database(config.getDBConnection(), 'results');

    this.team = team;
    this.commit = commit;
    this.testName = testName;
  }


  public async exec(): Promise<boolean> {
    let record: TestRecord = new TestRecord();
    await record.generate();
  }
  public async store() {
    this.resultsDB.insertRecord()
  }

}

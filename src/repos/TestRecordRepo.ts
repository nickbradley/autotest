/**
 * Created by steca
 */

import Log from '../Util';
import { IConfig, AppConfig } from '../Config';
import mongodb = require('mongodb');
import db, {Database, InsertOneResponse} from '../db/MongoDB';
import { Deliverable } from '../model/settings/DeliverableRecord'
import { Course } from '../model/settings/CourseRecord';
import TestRecord from '../model/results/TestRecord';
import {TestJobDeliverable} from '../controller/TestJobController';

const RESULTS_COLLECTION = 'results';
const OBJECT_ID_PROPERTY = '_id';

export default class TestRecordRepo {

  private db: Database;

  constructor() {
    this.db = db;
  }



  public async insertTestRecord(testRecord: Object): Promise<InsertOneResponse> {
    return new Promise<InsertOneResponse>((fulfill, reject) => {
      db.insertRecord(RESULTS_COLLECTION, testRecord).then( (insertedResponse: InsertOneResponse) => {
        if(insertedResponse.insertedCount < 1) {
          throw `TestRecordRepo::insertTestRecord() Could not insert ${testRecord}: ${insertedResponse}`;
        }
        fulfill(insertedResponse);
      });
    });
  }

  public async getLatestTestRecord(_team: string, _commit: string, _deliverable: string): Promise<TestRecord> {
    return new Promise<TestRecord>((fulfill, reject) => {
      let query: any = { commit: _commit, deliverable: _deliverable , team: _team};

      db.getLatestRecord(RESULTS_COLLECTION, query).then((testRecord: TestRecord) => {
        try {
          if (!testRecord) {
            throw `Could not find ${_team}, ${_commit}, and ${_deliverable}`;
          }
          fulfill(testRecord);
        }
        catch (err) {
          Log.error(`TestRecordRepo::getLatestTestRecord() ${err}`);
          reject(err);
        }
      })
    });
  }

}
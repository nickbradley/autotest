/**
 * Created by steca
 * 
 * ******
 * ATTENTION: 
 * As STDIO is a large file, it must be indexed on a small string and the reference to the string should
 * be left in the ResultRecord that it matches.
 * ******
 */

import Log from '../Util';
import { IConfig, AppConfig } from '../Config';
import mongodb = require('mongodb');
import db, {Database, InsertOneResponse} from '../db/MongoDB';
import {Attachment} from '../model/results/TestRecord';

const STDIO_COLLECTION = 'stdios';
const MONGO_ID_PROPERTY = '_id';

export interface StdioRecord {
  stdio: Attachment;
  idStamp: string;
}

export default class StdioRecordRepo {

  private db: Database;

  constructor() {
    this.db = db;
  }

  public async insertStdioRecord(stdioRecord: StdioRecord): Promise<InsertOneResponse> {
    return new Promise<InsertOneResponse>((fulfill, reject) => {
      db.insertRecord(STDIO_COLLECTION, stdioRecord).then( (insertedResponse: InsertOneResponse) => {
        if(insertedResponse.insertedCount < 1) {
          throw `TestRecordRepo::insertTestRecord() Could not insert Stdio Record for ${stdioRecord.idStamp}: ${insertedResponse}`;
        }
        fulfill(insertedResponse);
      })
      .catch(err => {
        Log.error('StdioRepo::insertStdioRecord() ERROR ' + err);
      });
    });
  }

  public getStdioRecord(idStamp: StdioRecord): Promise<object> {
    return new Promise<StdioRecord>((fulfill, resolve) => {
      db.getRecord(STDIO_COLLECTION, {'idStamp': idStamp})
      .then((stdioRecord: StdioRecord )=> {
        if (stdioRecord) {
          fulfill(stdioRecord);          
        } else {
          throw 'Could not find Stdio Record under ' + idStamp;
        }
      })
      .catch(err => {
        Log.error('StdioRepo::getStdioRecord() ERROR ' + err);
      });
    });
  }

}

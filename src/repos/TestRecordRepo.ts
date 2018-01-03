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



}
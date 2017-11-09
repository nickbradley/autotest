/**
 * Created by steca
 */

import Log from '../Util';
import { IConfig, AppConfig } from '../Config';
import mongodb = require('mongodb');
import db, {MongoDB} from '../db/MongoDB';
import { DeliverableRecord } from '../model/settings/DeliverableRecord'
import { Course } from '../model/settings/CourseRecord';

const COURSE_COLLECTION = 'courses';
const DELIVERABLES_COLLECTION = 'deliverables';
const OBJECT_ID_PROPERTY = '_id';

export default class DeliverableRepo {

  private db: MongoDB;

  constructor() {
    this.db = db.getInstance();
  }

  public getDeliverables(key: string, courseNum: number): Promise<DeliverableRecord> {
    let courseQuery = { courseId: courseNum.toString() };
    let deliverableQuery = {};
    deliverableQuery[key] = key;

    return new Promise<DeliverableRecord>((fulfill, reject) => {
      db.getRecord(COURSE_COLLECTION, courseQuery).then((course: Course) => {
        if (!course) {
          throw `DeliverableRepo::getDeliverables() Could not find ${courseNum}`;
        }
        fulfill(new DeliverableRecord(course.settings.deliverables))
      });
    });
  }

  public getDeliverableSettings(courseNum: number): Promise<DeliverableRecord> {
    let courseQuery = { courseId: courseNum.toString() };

    return new Promise<DeliverableRecord>((fulfill, reject) => {
      db.getRecord(COURSE_COLLECTION, courseQuery)
        .then((course: Course) => {
          if (!course) {
            throw `DeliverableRepo::getDeliverables() Could not find ${courseNum}`;
          }
        fulfill(new DeliverableRecord(course.settings.deliverables))
        });
    });
  }
}

/**
 * Created by steca
 */

import Log from '../Util';
import { IConfig, AppConfig } from '../Config';
import mongodb = require('mongodb');
import db, {MongoDB} from '../db/MongoDB';
import { DeliverableRecord } from '../model/settings/DeliverableRecord'
import { Course } from '../model/settings/CourseRecord';
import { Deliverable } from '../model/settings/DeliverableRecord';

const COURSE_COLLECTION = 'courses';
const DELIVERABLES_COLLECTION = 'deliverables';
const OBJECT_ID_PROPERTY = '_id';

export default class DeliverableRepo {

  private db: MongoDB;

  constructor() {
    this.db = new MongoDB();
  }

  public getDeliverable(delivName: string, courseNum: number) {
    let courseQuery = { courseId: courseNum.toString() }
    db.getRecord(COURSE_COLLECTION, courseQuery)
      .then((course: Course) => {
        if (!course) {
          throw `DeliverableRepo::getDeliverable() Could not find ${courseNum}`;
        }
        return course;
      })
      .then((course: Course) => {
        return db.getRecord(DELIVERABLES_COLLECTION, {courseId: course.courseId, delivName})
          .then((deliv: Deliverable) => {
            if (!deliv) {
              throw `DeliverableRepo::getDeliverable() Could not find Deliverable for ${delivName} and ${courseNum}`;
            }
            return deliv;
          });
      })
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

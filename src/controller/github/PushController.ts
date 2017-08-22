import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import PushRecord, {Push} from '../../model/requests/PushRecord';
import TestJobController from '../TestJobController';
import {Job} from '../../model/JobQueue';
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import {CourseRecord} from '../../model/settings/CourseRecord';
import {Course, CourseSettings} from '../../model/business/CourseModel';
import {Deliverable} from '../../model/business/DeliverableModel';
import {TestJob} from '../TestJobController';
import PushRepo from '../../repos/PushRepo';
import CourseRepo from '../../repos/CourseRepo';

export default class PushController {
  private config: IConfig;
  private runningPort: number;
  private courseNum: number;
  private courseRecord: CourseRecord;
  private courseSettings: CourseSettings;
  private record: PushRecord;
  
  constructor(courseNum: number) {
    this.config = new AppConfig();
    this.courseNum = courseNum;
  }

  async process(data: JSON) {

    this.record = new PushRecord(data);
    await this.store(this.record);

    let courseSettings: CourseSettings;
    courseSettings = await this.getCourseLogic();

    if (courseSettings.markDelivsByBatch == true) {
      return Promise.all(this.markDeliverablesByBatch());
    } 
    else {
      return Promise.all(this.markDeliverableByRepo())
    }
  }

  async getCourseLogic() {
    try {
      let deliverables: Deliverable[] = new Array<Deliverable>();
      let promises = [];
      let courseRepo: CourseRepo = new CourseRepo();

      let courseQuery = courseRepo.getCourseSettings(this.courseNum)
        .then((courseSettings: CourseSettings) => {
          this.courseSettings = courseSettings;
        });

      promises.push(courseQuery);

      return await Promise.all(promises)
        .then(() => {
          if (this.courseSettings) {
            return this.courseSettings;
          }
          else {
            throw `Could not find deliverables for ${this.courseNum} course logic.`;
          }
        });
    }
    catch (err) {
      Log.error(`PushController::getCourseLogic() Failed to retrieve business logic for Course ${this.courseNum}: ${err}`);
    }
  }

  private markDeliverablesByBatch(): Promise<Job>[] {
    let promises: Promise<Job>[] = [];
    let currentDate: Date = new Date();
    let deliverablesRecord = this.courseSettings.deliverables;

    for (const key of Object.keys(deliverablesRecord)) {
      if (key.match(/d\d+/)) {
        let deliverable = deliverablesRecord[key];
        let rDate: Date = new Date(deliverable.releaseDate);
        if (rDate <= currentDate) {
          for (let repo of deliverable.repos) {
            let testJob: TestJob = {
              orgName: this.record.orgName,
              courseNum: this.courseNum,
              user: this.record.user,
              team: this.record.team,
              commit: this.record.commit.short,
              hook: this.record.commentHook,
              ref: this.record.ref,
              markDelivsByBatch: this.courseSettings.markDelivsByBatch,
              test: {
                name: repo.name,
                image: 'autotest/' + key + '-' + this.courseSettings.bootstrapImage + ':' + (repo.commit ? repo.commit : 'latest'),
                visibility: repo.visibility,
                deliverable: key
              }
            }
            // Log.info('PushController::process() - ' + record.team +'#'+ record.commit.short + ' enqueued to run against ' + repo.name + '.');
            promises.push(this.enqueue(testJob));
          }
        }
      }
    }
    return promises;
  }

  private markDeliverableByRepo(): Promise<Job>[] {
    let promises: Promise<Job>[] = [];
    let currentDate: Date = new Date();
    let record: PushRecord = this.record;
    let deliverablesRecord = this.courseSettings.deliverables;

        let deliverable = deliverablesRecord[record.deliverable];
        let rDate: Date = new Date(deliverable.releaseDate);
        if (rDate <= currentDate) {
          for (let repo of deliverable.repos) {
            let testJob: TestJob = {
              orgName: record.orgName,
              courseNum: this.courseNum,
              user: record.user,
              team: record.team,
              commit: record.commit.short,
              hook: record.commentHook,
              markDelivsByBatch: this.courseSettings.markDelivsByBatch,
              ref: record.ref,
              test: {
                name: repo.name,
                image: 'autotest/' + this.courseSettings.bootstrapImage + ':' + (repo.commit ? repo.commit : 'latest'),
                visibility: repo.visibility,
                deliverable: record.deliverable
              }
            }
            // Log.info('PushController::process() - ' + record.team +'#'+ record.commit.short + ' enqueued to run against ' + repo.name + '.');
            promises.push(this.enqueue(testJob));
          }
        }
    return promises;
  }

  private async store(record: PushRecord): Promise<any> {
    let pushRepo: PushRepo = new PushRepo();
    return pushRepo.insertPushRecord(this.record.convertToJSON());
  }

  private async enqueue(job: TestJob): Promise<Job> {
    let controller: TestJobController = TestJobController.getInstance();
    return controller.addJob(job);
  }
}

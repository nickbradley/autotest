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

const BOT_USERNAME = 'autobot';

export default class PushController {
  private config: IConfig;
  private runningPort: number;
  private course: Course;
  private courseNum: number;
  private courseRecord: CourseRecord;
  private courseSettings: CourseSettings;
  private record: PushRecord;
  private overrideBatchMarking: boolean;
  
  constructor(courseNum: number) {
    this.config = new AppConfig();
    this.courseNum = courseNum;
  }

  async process(data: JSON) {

    this.record = new PushRecord(data);
    await this.store(this.record);

    let courseSettings: CourseSettings;
    let course: Course;
    let deliverableKeys: any;

    course = await this.getCourseLogic();
    courseSettings = course.settings;
    this.overrideBatchMarking = this.checkOverrideBatchMarking(this.record.deliverable);

    if (this.record.user.toString().indexOf(BOT_USERNAME) > -1) {
      try {
        throw `PushController::process() Recieved ${BOT_USERNAME} push from batch cloning repo. Ignoring`;
      }
      catch (err) {
        Log.info(err);
      }
    }
    else if (courseSettings.markDelivsByBatch == true && !this.overrideBatchMarking) {
      return Promise.all(this.markDeliverablesByBatch());
    } 
    else {
      return Promise.all(this.markDeliverableByRepo());
    }
  }

  async getCourseLogic() {
    try {
      let deliverables: Deliverable[] = new Array<Deliverable>();
      let promises = [];
      let courseRepo: CourseRepo = new CourseRepo();

      let courseSettingsQuery = courseRepo.getCourseSettings(this.courseNum)
        .then((courseSettings: CourseSettings) => {
          this.courseSettings = courseSettings;
          return courseSettings;
        });
      let courseQuery = courseRepo.getCourse(this.courseNum)
        .then((course: Course) => {
          this.course = course;
          return course;
        });
      
      promises.push(courseSettingsQuery);
      promises.push(courseQuery);

      return await Promise.all(promises)
        .then(() => {
          if (this.course) {
            return this.course;
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
    // conditions for markByBatch is flag true on Course object, 
    // and flag true in CourseSettings.deliverables[key].markInBatch 
    for (const key of Object.keys(deliverablesRecord)) {
      if (key.match(/d\d+/)) {
        let deliverable = deliverablesRecord[key];
        let rDate: Date = new Date(deliverable.releaseDate);
        if (rDate <= currentDate && deliverable.markInBatch) {
          for (let repo of deliverable.repos) {
            let testJob: TestJob = {
              githubOrg: this.record.githubOrg,
              courseNum: this.courseNum,
              username: this.record.user,
              team: this.record.team,
              commit: this.record.commit.short,
              hook: this.record.commentHook,
              ref: this.record.ref,
              overrideBatchMarking: this.overrideBatchMarking,
              test: {
                name: repo.name,
                image: 'autotest/' + this.courseSettings.bootstrapImage + ':' + (repo.commit ? repo.commit : 'latest'),
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
              githubOrg: record.githubOrg,
              courseNum: this.courseNum,
              username: record.user,
              team: record.team,
              commit: record.commit.short,
              hook: record.commentHook,
              overrideBatchMarking: this.overrideBatchMarking,
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

  private checkOverrideBatchMarking(deliverable: string): boolean {
    if (typeof deliverable === 'undefined') {
      return false;
    }
    return true;
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

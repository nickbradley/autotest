import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import PushRecord, {Push} from '../../model/requests/PushRecord';
import TestJobController from '../TestJobController';
import {Job} from '../../model/JobQueue';
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import {Course} from '../../model/business/CourseModel';
import {Deliverable} from '../../model/settings/DeliverableRecord';
import {TestJob} from '../TestJobController';
import PushRepo from '../../repos/PushRepo';
import CourseRepo from '../../repos/CourseRepo';
import DeliverableRepo from '../../repos/DeliverableRepo';
import DockerHelper, {DockerInputJSON} from '../../model/docker/DockerInput';

const BOT_USERNAME = 'autobot';

export default class PushController {
  private config: IConfig;
  private runningPort: number;
  private deliverable: Deliverable;
  private courseNum: number;
  private record: PushRecord;
  private dockerHelper: DockerHelper;
  private dockerInput: DockerInputJSON;
  
  constructor(courseNum: number) {
    this.config = new AppConfig();
    this.courseNum = courseNum;
  }

  async process(data: JSON) {

    this.record = new PushRecord(data);
    await this.store(this.record);

    this.deliverable = await this.getDeliverableLogic();
    this.dockerHelper = await new DockerHelper(this.deliverable, this.record, this.courseNum);
    this.dockerInput = await this.dockerHelper.createDockerInputJSON();

    if (this.record.user.toString().indexOf(BOT_USERNAME) > -1) {
      try {
        throw `PushController::process() Recieved ${BOT_USERNAME} push from batch cloning repo. Ignoring.`;
      }
      catch (err) {
        Log.info(err);
      }
    }
    else {
      return Promise.all(this.markDeliverable());
    }
  }

  async getDeliverableLogic() {
    try {
      let deliverables: Deliverable[] = new Array<Deliverable>();
      let promises = [];
      let delivRepo: DeliverableRepo = new DeliverableRepo();

      let deliverableQuery = delivRepo.getDeliverable(this.record.deliverable, this.courseNum)
        .then((deliverable: Deliverable) => {
          this.deliverable = deliverable;
          return deliverable;
        });
      
      promises.push(deliverableQuery);

      return await Promise.all(promises)
        .then(() => {
          if (this.deliverable) {
            return this.deliverable;
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

  private markDeliverable(): Promise<Job>[] {
    let promises: Promise<Job>[] = [];
    let currentDate: Date = new Date();
    let record: PushRecord = this.record;

        let deliverable = this.deliverable;
        let open: Date = new Date(deliverable.open);
        let close: Date = new Date(deliverable.close);
        let dockerImage = deliverable.dockerImage;
        let dockerBuild = deliverable.dockerBuild;
        let testJob: TestJob;
        if (open <= currentDate && close >= currentDate) {
            testJob = {
              githubOrg: record.githubOrg,
              repo: record.repo,
              projectUrl: record.projectUrl,
              commitUrl: record.commitUrl,
              closeDate: deliverable.close,
              openDate: deliverable.open,
              courseNum: this.courseNum,
              username: record.user,
              timestamp: record.timestamp,
              team: record.team,
              commit: record.commit.short,
              hook: record.commentHook,
              ref: record.ref,
              test: {
                dockerInput: this.dockerInput,
                dockerImage: dockerImage,
                dockerBuild: dockerBuild,
                stamp: 'autotest/' + this.deliverable.dockerImage + ':' + dockerBuild,
                deliverable: record.deliverable
              }
            // Log.info('PushController::process() - ' + record.team +'#'+ record.commit.short + ' enqueued to run against ' + repo.name + '.');
          }
        }
    promises.push(this.enqueue(testJob));          
    return promises;
  }

  private checkOverrideBatchMarking(deliverable: string): boolean {
    // aka. if does not exist because not in REGEX of repo name
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
    let controller: TestJobController = TestJobController.getInstance(this.courseNum);
    return controller.addJob(job);
  }
}

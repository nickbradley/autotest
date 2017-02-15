import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database} from '../../model/Database';
import PushRecord from '../../model/requests/PushRecord';
import TestJobController from '../TestJobController';
import {Job} from '../../model/JobQueue';
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import {TestJob} from '../TestJobController';

export default class PushController {
  private config: IConfig;

  constructor() {
    this.config = new AppConfig();
  }

  async process(data: JSON) {
    // Log.trace('PushController::process()');
    try {
      let record = new PushRecord(data);

      await this.store(record);

      let resultsDB = new Database(this.config.getDBConnection(), 'settings');
      let deliverablesDoc = await resultsDB.readRecord('deliverables');
      let deliverableRecord: DeliverableRecord = new DeliverableRecord(deliverablesDoc);

      let currentDate: Date = new Date();

      let promises: Promise<Job>[] = [];
      for (const key of Object.keys(deliverableRecord.deliverables)) {
        if (key.match(/d\d+/)) {
          let deliverable = deliverableRecord.deliverables[key];
          let rDate: Date = new Date(deliverable.releaseDate);
          if (rDate <= currentDate) {
            for (let repo of deliverable.repos) {
              let testJob: TestJob = {
                user: record.user,
                team: record.team,
                commit: record.commit.short,
                hook: record.commentHook,
                test: {
                  name: repo.name,
                  image: 'autotest/' + key + '-' + repo.name + ':' + (repo.commit ? repo.commit : 'latest'),
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

      return Promise.all(promises);
    } catch(err) {
      throw 'Failed to process push request. ' + err;
    }
  }

  private async store(record: PushRecord) {
    let db: Database = new Database(this.config.getDBConnection(), 'requests');
    return db.createRecord(record);
  }

  private async enqueue(job: TestJob): Promise<Job> {
    let controller: TestJobController = TestJobController.getInstance();
    return controller.addJob(job);
  }
}

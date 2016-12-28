import {IConfig, AppConfig} from '../../Config';
import {Database} from '../../model/Database';
import PushRecord from '../../model/requests/PushRecord';
import TestJobController from '../TestJobController';
import {JobData, Job} from '../../model/JobQueue';
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';


export default class PushController {
  private config: IConfig;

  constructor() {
    this.config = new AppConfig();
  }

  async process(data: JSON) {
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
          let jobData: JobData = {
            dName: deliverable.repos[0].name,
            team: record.team,
            commit: record.commit
          }
          let rDate: Date = new Date(deliverable.releaseDate);
          if (rDate <= currentDate) {
            promises.push(this.enqueue(jobData));
          }
        }
      }

      return Promise.all(promises);
    } catch(err) {
      throw 'Failed to process Push request. ' + err;
    }
  }

  private async store(record: PushRecord) {
    let db: Database = new Database(this.config.getDBConnection(), 'requests');
    return db.createRecord(record);
  }

  private async enqueue(job: JobData): Promise<Job> {
    let controller: TestJobController = TestJobController.getInstance();
    return controller.addJob(job);
  }
}

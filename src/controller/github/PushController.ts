import {IConfig, AppConfig} from '../../Config';
import {Database} from '../../model/Database';
import PushRecord from '../../model/github/PushRecord';

export default class PushController {
  private config: IConfig;

  constructor() {
    this.config = new AppConfig();

  }

  async process(data: JSON) {
    try {
      let record = new PushRecord(data);
      await this.store(record);
      await this.queue();
    } catch(err) {
      throw 'Failed to process Push request. ' + err;
    }
  }

  private async store(record: PushRecord) {
    let db: Database = new Database(this.config.getDBConnection(), 'requests');
    return db.insertRecord(record);
  }

  private async queue() {

  }
}

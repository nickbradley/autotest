import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database} from '../../model/Database';
import CommitCommentRecord from '../../model/github/CommitComment';

export default class CommitCommentContoller {
  private config: IConfig;

  constructor() {
    this.config = new AppConfig();
  }

  async process(data: JSON) {
    try {
      Log.trace('CommitCommentContoller::process()');

      let currentDeliverable: string = await this.currentDeliverable();
      let record: CommitCommentRecord = new CommitCommentRecord(data, this.config.getMentionTag(),  currentDeliverable);

      // Log the message in the database
      await this.store(record);



    } catch(err) {
      throw 'Failed to process commit comment. ' + err;
    }
  }

  private async store(record: CommitCommentRecord) {
    let db = new Database(this.config.getDBConnection(), 'github');
    return db.insertRecord(record);
  }

  private async currentDeliverable() {
    let currentDeliverable: string;
    try {
      let db = new Database(this.config.getDBConnection(), 'settings');
      let deliverables = await db.view('current', 'deliverable', null);
      currentDeliverable = deliverables.rows.reduce((p, v) => {
        return (p.value.dueDate > v.value.dueDate ? p : v);
      }).key;
    } catch(err) {
      throw 'Failed to retrieve current deliverable. ' + err;
    }
    if (!currentDeliverable) {
      throw 'Failed to retrieve current deliverable. No result.';
    }

    return currentDeliverable;
  }

  private async getResult(team: string, commit: string) {
    try {
      let db = new Database(this.config.getDBConnection(), 'results');
      //let result = await db.view('default', 'result', {});
      return '10%';
    } catch(err) {
      throw 'Unable to get test result for ' + team + ' commit ' + commit + '. ' + err;
    }
  }
}

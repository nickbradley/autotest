import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database} from '../../model/Database';
import CommitComment from '../../model/github/CommitCommentRecord';

export default class CommitCommentContoller {
  private config: IConfig;
  constructor() {
    this.config = new AppConfig();
  }

  async process(data: JSON) {

    let record: CommitComment = new CommitComment(data);

    return await this.store(record);
  }

  private async store(record: CommitComment) {
    let db = new Database(this.config.getDBConnection(), 'github');
    return await db.insertRecord(record);
  }
}

import {CouchDocument, Record, InsertResponse} from '../Database';

interface IPushRecord {}

export default class PushRecord implements Record {
  data: IPushRecord

  constructor(data: IPushRecord) {
    this.data = data;
  }

  async insert(db: CouchDocument): Promise<InsertResponse> {
    let that = this;
    return new Promise<InsertResponse>((fulfill, reject) => {
      db.insert(that.data, "", (err, result) => {
        if (err) {
          reject(err);
        }

        fulfill(result);
      });
    });
  }
}

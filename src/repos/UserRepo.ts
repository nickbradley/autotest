/**
 * Created by steca
 * 
 */

import Log from '../Util';
import { IConfig, AppConfig } from '../Config';
import mongodb = require('mongodb');
import db, {Database} from '../db/MongoDB';
import {Deliverable} from '../model/settings/DeliverableRecord'
import {User} from '../model/business/UserModel';

const USERS_COLLECTION = 'users';

export default class UserRepo {

  private db: Database;

  constructor() {
    this.db = db;
  }

  public getUser(username: string): Promise<User> {
    return new Promise<User>((fulfill, resolve) => {
      let userQuery = db.getRecord(USERS_COLLECTION, {username})
      .then((user: User )=> {
        fulfill(user);
      });
    });
  }

}

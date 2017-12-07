import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import {Course} from '../../model/business/CourseModel';
import {Deliverable} from '../../model/settings/DeliverableRecord';
import PushRepo from '../../repos/PushRepo';
import CourseRepo from '../../repos/CourseRepo';
import UserRepo from '../../repos/UserRepo';
import {User} from '../../model/business/UserModel';
import PushRecord, {Push} from '../../model/requests/PushRecord';
import DeliverableRepo from '../../repos/DeliverableRepo';

const BOT_USERNAME = 'autobot';

export interface DockerInputJSON {
  userInfo: DockerUserInfo;  
  pushInfo: DockerPushInfo;
  deliverableToMark: string;
  githubOrg: string;
  custom: object;
}

export interface DockerUserInfo {
  username: string;
  fname: string;
  lname: string;
  csid: string;
  snum: string;
  profileUrl: string;
}

export interface DockerPushInfo {
  commit: string;
  branch: string;
  commitUrl: string;
}

export interface DockerDeliverableInfo {
  deliverableUrl: string; // Repo import to mark assignment (important if Github key not on image)
  deliverableCommit: string;
  deliverableToMark: string;
}

export default class DockerInput {

  private deliverable: Deliverable;
  private pushRecord: PushRecord;
  private _DockerInputJSON: DockerInputJSON = null;
  
  constructor(deliverable: Deliverable, pushRecord: PushRecord) {
    this.deliverable = deliverable;
    this.pushRecord = pushRecord;
  }

  private parseDockerInput() {

  }

  private getUserInfo(): Promise<User> {
    let userRepo = new UserRepo();
    return userRepo.getUser(this.pushRecord.user)
      .then((user: User) => {
        if (user) {
          return user;
        }
        Log.warn(`DockerInput::getUserInfo() The user ${this.pushRecord.user} cannot be found in the DB. ` + 
          'DockerInput will have null user entries.')
      });
  }

  public async createDockerInputJSON() {
    let that = this;
    try {

      let userInfo: DockerUserInfo = {username: null, csid: null, snum: null, profileUrl: null, fname: null, lname: null};
      let pushInfo: DockerPushInfo = {branch: null, commit: null, commitUrl: null};
      let dockerInput: DockerInputJSON = {userInfo, pushInfo, githubOrg: null, deliverableToMark: null, custom: null};

      return this.getUserInfo()
        .then((user: User) => {
          if (user) {
            dockerInput.userInfo.csid = user.csid;
            dockerInput.userInfo.snum = user.snum;
            dockerInput.userInfo.fname = user.fname;
            dockerInput.userInfo.lname = user.lname;
            dockerInput.userInfo.username = user.username;
            dockerInput.userInfo.profileUrl = user.profileUrl;
          }
        })
        .then(() => {
          dockerInput.pushInfo.branch = this.pushRecord.ref;
          dockerInput.pushInfo.commit = this.pushRecord.commit.toString();
          dockerInput.pushInfo.commitUrl = this.pushRecord.commitUrl;
          dockerInput.custom = this.deliverable.custom;
          dockerInput.deliverableToMark = this.pushRecord.deliverable;
          dockerInput.githubOrg = this.pushRecord.githubOrg;

          that._DockerInputJSON = dockerInput;
          return this._DockerInputJSON;          
        });
    } catch (err) {
      Log.error(`DockerInput::DockerInputJSON() ERROR ${err}`);
    }
  }
}

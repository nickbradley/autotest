import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
import TestRecord from '../../model/results/TestRecord'
import TestRecordRepo from '../../repos/TestRecordRepo';

export interface ResultRecordContainer {
  response: ResultRecordPayload;
}

export interface ResultRecordPayload {
  team: string;
  repo: string;
  projectUrl: string;
  commitUrl: string;
  orgName: string;
  deliverable: string;
  openDate: number;
  closeDate: number;
  user: string;
  committer: string;
  timestamp: number;
  ref: string;
  report: object;  // CommitReport; Need proper JSON schema for this.
  container: ContainerInfo;
  attachments: object[];
  gradeComment: string;
  idStamp: string;
}

export interface ContainerInfo {
  scriptVersion: string;
  suiteVersion: string;
  image: string;
  exitCode: number;
}

export interface ReportJSON {
  
}

export default class ResultRecord {
  // Should match MongoDb result record because ResultRecord gradeRequested flags need to be updated 
  // in Repository using this schema.
  _id: string;
  team: string;
  repo: string;
  projectUrl: string;
  commitUrl: string;
  orgName: string;
  deliverable: string;
  openDate: number;
  closeDate: number;
  user: string;
  committer: string;
  timestamp: number;
  ref: string;
  report: object;  // CommitReport; Need proper JSON schema for this.
  container: ContainerInfo;
  attachments: object[];
  gradeComment: string;
  idStamp: string;

  constructor() {
    // 
  }

  get id() {
    return this._id;
  }

  public async getResultRecord(orgName: string, repoName: string, commit: string) { // should return Promsie<ResultREcord>
    // return ResultRecord with text output that is sent to the Github Comment area.
  }

  public validateResultRecord(resultContainer: ResultRecordContainer) {
    let resultRecord: ResultRecord = new ResultRecord();
  }

}

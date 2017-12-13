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
  private textOutput: string;
  private resultRecord: ResultRecord;
  private testRecord: TestRecord;
  private deliverableName: string;
  private _id: string;

  constructor(testRecord: any, deliverableName: string) {
    this.testRecord = testRecord;
    this.deliverableName = deliverableName;
  }

  public async getResultRecord(orgName: string, repoName: string, commit: string) { // should return Promsie<ResultREcord>
    // return ResultRecord with text output that is sent to the Github Comment area.
  }

}

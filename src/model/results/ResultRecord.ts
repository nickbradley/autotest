import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
import TestRecord, {Attachment} from '../../model/results/TestRecord'
import TestRecordRepo from '../../repos/TestRecordRepo';

export interface ResultPayload {
  response: Result;
}

export interface Result {
  team: string;
  repo: string;
  githubOutput: string;
  projectUrl: string;
  commitUrl: string;
  courseNum: number;
  orgName: string;
  deliverable: string;
  openDate: number;
  commit: string;
  closeDate: number;
  gradeRequested: boolean;
  gradeRequestedTimestamp: number;
  user: string;
  committer: string;
  timestamp: number;
  ref: string;
  report: ReportJSON;  // CommitReport; Need proper JSON schema for this.
  container: ContainerInfo;
  attachments: Attachment[];
  stdioRef: string;
}

export interface ContainerInfo {
  scriptVersion: string;
  suiteVersion: string;
  image: string;
  exitCode: number;
}

export interface ReportJSON {
  studentInfo: object;
  deliverableInfo: object;
  coverage: object;
  tests: TestsObject;
  item: string;
  other: string;

}

export interface TestsObject {
  testRunTitle: string;
  testingSoftware: string;
  testingSoftwareVersion: string;
  overviewResults: string;
  detailedResults: object[];
}

export default class ResultRecord {
  // Should match MongoDb result record because ResultRecord gradeRequested flags need to be updated 
  // in Repository using this schema.
  private team: string;
  private repo: string;
  private projectUrl: string;
  private commitUrl: string;
  private githubOutput: string;
  private courseNum: number;
  private commit: string;
  private gradeRequested: boolean;
  private gradeRequestedTimestamp: number;
  private orgName: string;
  private deliverable: string;
  private openDate: number;
  private closeDate: number;
  private user: string;
  private committer: string;
  private timestamp: number;
  private ref: string;
  private report: ReportJSON;  // CommitReport; Need proper JSON schema for this.
  private container: ContainerInfo;
  private attachments: Attachment[];
  private stdioRef: string;

  constructor(result: Result) {
    this.team = result.team;
    this.repo = result.repo;
    this.githubOutput = result.githubOutput;
    this.projectUrl = result.projectUrl;
    this.commitUrl = result.commitUrl;
    this.courseNum = result.courseNum;
    this.gradeRequested = result.gradeRequested,
    this.gradeRequestedTimestamp = result.gradeRequestedTimestamp,
    this.orgName = result.orgName;
    this.commit = result.commit;
    this.deliverable = result.deliverable;
    this.openDate = result.openDate;
    this.closeDate = result.closeDate;
    this.user = result.user;
    this.committer = result.committer;
    this.timestamp = result.timestamp;
    this.ref = result.ref;
    this.report = result.report;
    this.container = result.container;
    this.attachments = result.attachments;
    this.stdioRef = result.stdioRef;
  }

  public convertToJSON(): Result {
    let doc: Result = {
      team: this.team,
      repo: this.repo,
      githubOutput: this.githubOutput,
      projectUrl: this.projectUrl,
      commitUrl: this.commitUrl,
      orgName: this.orgName,
      deliverable: this.deliverable,
      openDate: this.openDate,
      commit: this.commit,
      gradeRequested: this.gradeRequested,
      gradeRequestedTimestamp: this.gradeRequestedTimestamp,
      closeDate: this.closeDate,
      user: this.user,
      committer: this.committer,
      courseNum: this.courseNum,
      ref: this.ref, 
      report: this.report,
      container: this.container,
      attachments: this.attachments,
      timestamp: this.timestamp,      
      stdioRef: this.stdioRef
    }

    return doc;
  }

  public async getResultRecord(orgName: string, repoName: string, commit: string) { // should return Promsie<ResultREcord>
    // return ResultRecord with text output that is sent to the Github Comment area.
  }

  public validateResultRecord(resultContainer: ResultPayload) {
  }

}

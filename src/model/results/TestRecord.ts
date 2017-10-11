import cp = require('child_process');
import tmp = require('tmp-promise');
import fs = require('fs');
import {IConfig, AppConfig} from '../../Config';
import {Commit} from '../GithubUtil';
import {CouchDatabase,Database, DatabaseRecord, InsertResponse} from '../Database';
import {TestJob, TestJobDeliverable} from '../../controller/TestJobController';
import {Report} from '../../model/results/ReportRecord';
import Log from '../../Util';

interface TestOutput {
  testStats: TestStats;
}

interface CoverageOutput {
  coverageStats: CoverageStats;
}

interface TestStats {
  passPercent: number;
  passCount: number;
  failCount: number;
  skipCount: number;
  passNames: string[];
  failNames: string[];
  skipNames: string[];
}

export interface CoverageStat {
  percentage: number;
  total: number;
  covered: number;
  skipped: number;
}
export interface CoverageStats {
  lines: CoverageStat;
  statements: CoverageStat;
  branches: CoverageStat;
  functions: CoverageStat;
}

export interface ProcessedTag {
  content: any;
  exitcode: number;
}

export interface TestStatus {
  studentBuildFailed: boolean,
  studentBuildMsg: string,
  deliverableBuildFailed: boolean,
  deliverableBuildMsg: string,
  deliverableRuntimeError: boolean,
  deliverableRuntimeMsg: string,
  containerExitCode: number,
  processErrors: string[]
}

export default class TestRecord{
  // private config: IConfig;
  private maxStdioSize: number = 5 * 1000000;  // 5 MB
  private maxReportSize: number = 1/2 * 1000000; // 500 KB
  private stdio: string;
  private report: string;
  private reportSize: number;
  private stdioSize: number;
  private coverageZip: Buffer;
  private githubToken: string;
  private _id: string;
  private _rev: string;
  private team: string;
  private deliverable: TestJobDeliverable;
  private courseNum: number;
  private testStats: TestStats;
  private coverageReport: any;
  private coverageStats: CoverageStats;
  private studentBuildFailed: boolean;
  private studentBuildMsg: string;
  private deliverableBuildFailed: boolean;
  private deliverableBuildMsg: string;
  private deliverableRuntimeError: boolean;
  private deliverableRuntimeMsg: string;
  private testReport: any;
  private commit: string;
  private committer: string;
  private containerExitCode: number = 0;
  private timestamp: number;
  private scriptVersion: string;
  private suiteVersion: string;
  private failedCoverage: string;
  private overrideBatchMarking: boolean;
  private ref: string;
  private githubOrg: string;
  private username: string;

  constructor(githubToken: string, testJob: TestJob) {
    this.courseNum = testJob.courseNum;
    this.githubToken = githubToken;
    this.team = testJob.team;
    this.deliverable = testJob.test;
    this.commit = testJob.commit;
    this.committer = testJob.username;
    this.ref = testJob.ref;
    this.overrideBatchMarking = testJob.overrideBatchMarking;
    this.timestamp = +new Date();
    this._id = this.timestamp + '_' + this.team + ':' + this.deliverable.deliverable + '-';
    this.githubOrg = testJob.githubOrg;
    this.username = testJob.username;
  }

  public getTeam(): string {
    return this.team;
  }

  public getCommit(): string {
    return this.commit;
  }

  public getExitCode(): number {
    return this.containerExitCode;
  }

  public getStudentBuildFailed(): boolean {
    return this.studentBuildFailed;
  }

  public getStudentBuildMsg(): string {
    return this.studentBuildMsg;
  }

  public getDeliverableBuildFailed(): boolean {
    return this.deliverableBuildFailed;
  }

  public getDeliverableBuildMsg(): string {
    return this.deliverableBuildMsg;
  }

  public getDeliverableRuntimeMsg(): string {
    return this.deliverableRuntimeMsg;
  }

  public getDeliverableRuntimeError(): boolean {
    return this.deliverableRuntimeError;
  }

  public getScriptVersion(): string {
    return this.scriptVersion;
  }

  public getSuiteVersion(): string {
    return this.suiteVersion;
  }

  public getDeliverable(): TestJobDeliverable {
    return this.deliverable;
  }

  public getTestStats(): TestStats {
    return this.testStats;
  }

  public getCoverageStats(): CoverageStats {
    return this.coverageStats;
  }

  public getTestReport(): any {
    return this.testReport;
  }

  public async generate(): Promise<TestStatus> {
    let tempDir = await tmp.dir({ dir: '/tmp', unsafeCleanup: true });
    let file: string = './docker/tester/run-test-container-' + this.courseNum + '.sh';
    let args: string[] = [
      this.githubToken,
      this.team,
      this.commit,
      this.ref,
      this.deliverable.deliverable,
      this.deliverable.image,
      this.overrideBatchMarking,
      tempDir.path
    ];
    let options = {
      encoding: 'utf8'
    }

    return new Promise<TestStatus>((fulfill, reject) => {
      cp.execFile(file, args, options, (error: any, stdout, stderr) => {
        if (error) {
          console.log('Error', error);
          this.containerExitCode = error.code;
        }

        let promises: Promise<string>[] = [];
        let getTranscriptSize: Promise<string> = new Promise((fulfill, reject) => {
          fs.stat(tempDir.path + '/stdio.txt', (err, stats) => {
            if (err) {
              Log.error('TestRecord::generate() - ERROR reading stdio.txt. ' + err);
              console.log('ERROR getTranscriptSize' + this.maxStdioSize);
              if (this.containerExitCode == 0) this.containerExitCode = 30;
              return fulfill(err);
            }

            this.stdioSize = stats.size;
            if (stats.size > this.maxStdioSize)
              if (this.containerExitCode == 0) this.containerExitCode = 29;
            fulfill();
          });
        });
        promises.push(getTranscriptSize);

        let readReport: Promise<JSON> = new Promise((fulfill, reject) => {
          fs.readFile(tempDir.path + '/report.json', 'utf8', (err, data) => {
            if (err) {
              Log.error('TestRecord::generate() - ERROR reading report.json. ' + err);
            }
          });
        });

        let readTranscript: Promise<string> = new Promise((fulfill, reject) => {
          fs.readFile(tempDir.path + '/stdio.txt', 'utf8', (err, data) => {
            if (err) {
              Log.error('TestRecord::generate() - ERROR reading stdio.txt. ' + err);
              if (this.containerExitCode == 0) this.containerExitCode = 31;
              console.log('ERROR read transcript')
              return fulfill(err);
            }
            else {
              Log.info('TestRecord::generate() - SUCCESS reading stdio.txt. ' + tempDir.path + '/stdio.txt');
            }
            try {
              this.stdio = data;

              // Process the info tag
              let infoTag: any = this.processInfoTag(data);
              this.scriptVersion = infoTag.scriptVersion;
              this.suiteVersion = infoTag.suiteVersion;

              // Process the project build tags for Student and Deliverable repos, respectively
              let studentBuildTag: ProcessedTag = this.processStudentProjectBuildTag(data);
              this.studentBuildFailed = (studentBuildTag.exitcode > 0 ? true : false);
              this.studentBuildMsg = String(studentBuildTag.content).substring(0, 1000000);

              let deliverableBuildTag: ProcessedTag = this.processDeliverableProjectBuildTag(data);
              this.deliverableBuildFailed = (deliverableBuildTag.exitcode > 0 ? true: false);
              this.deliverableBuildMsg = String(deliverableBuildTag.content).substring(0, 1000000);

              let deliverableRuntimeTag: ProcessedTag = this.processDeliverableRuntimeTestTag(data);
              this.deliverableRuntimeError = (deliverableRuntimeTag.exitcode > 0 ? true: false);
              this.deliverableRuntimeMsg = String(deliverableRuntimeTag.content).substring(0, 1000000);

              // Process the coverage tag
              // let coverageTag: ProcessedTag = this.processCoverageTag(data);
              // this.failedCoverage = coverageTag.content;

              fulfill();
            } catch(err) {
              fulfill(err);
            }
          });
        });
        promises.push(readTranscript);

        let getReportSize: Promise<string> = new Promise((fulfill, reject) => {
          fs.stat(tempDir.path + '/report.json', (err, stats) => {
            if (err) {
              Log.error('TestRecord::generate() - ERROR reading report.json ' + err);
              if (this.containerExitCode == 0) this.containerExitCode = 31;
              return fulfill(err);
            }

            this.reportSize = stats.size;
            fulfill();
          });
        });
        promises.push(getReportSize);

        let readReports: Promise<string> = new Promise((fulfill, reject) => {
          fs.readFile(tempDir.path + '/report.json', 'utf8', (err, data) => {
            if (err) {
              Log.error('TestRecord::generate() - ERROR reading report.json. ' + err);
              if (this.containerExitCode == 0) this.containerExitCode = 32;
              fulfill(err);
            }
            else {
              Log.info('TestRecord::generate() - SUCCESS reading report.json. ' + tempDir.path + '/report.json');
            }
            try {
              
              this.report = data; // : ReportSchema
              fulfill();
            } catch(err) {
              fulfill(err);
            }
          });
        });
        promises.push(readReports);

        Promise.all(promises).then((err) => {
          let testStatus: TestStatus = {
            studentBuildFailed: this.studentBuildFailed,
            studentBuildMsg: this.studentBuildMsg,
            deliverableBuildFailed: this.deliverableBuildFailed,
            deliverableBuildMsg: this.deliverableBuildMsg,
            deliverableRuntimeError: this.deliverableRuntimeError,
            deliverableRuntimeMsg: this.deliverableRuntimeMsg,
            containerExitCode: this.containerExitCode,
            processErrors: err
          }
          tempDir.cleanup();
          fulfill(testStatus);
        }).catch(err => {
          Log.error('TestRecord::generate() - ERROR processing container output. ' + err);
          if (this.containerExitCode == 0) this.containerExitCode = 39;
          reject(err);
        });
      });
    });
  }

  public processInfoTag(stdout: string): any {
    try {
      let infoTagRegex: RegExp = /^<INFO>\nproject url: (.+)\nbranch: (.+)\ncommit: (.+)\nscript version: (.+)\ntest suite version: (.+)\n<\/INFO exitcode=(\d+), completed=(.+), duration=(\d+)s>$/gm
      //let infoMsgRegex: RegExp = /^(npm.*)$/gm;
      let matches: string[] = infoTagRegex.exec(stdout);
      let processed: any = {
        scriptVersion: matches[4].trim(),
        suiteVersion: matches[5].trim()
      };
      return processed;
    } catch (err) {
      throw 'Failed to process <INFO> tag. ' + err;
    }
  }

  public processStudentProjectBuildTag(stdout: string): ProcessedTag {
    try {
      let buildTagRegex: RegExp = /^<BUILD_STUDENT_TESTS>\n([\s\S]*)<\/BUILD_STUDENT_TESTS exitcode=(\d+), completed=(.+), duration=(\d+)s>$/gm
      let buildMsgRegex: RegExp = /^(npm.*)$/gm;
      let matches: string[] = buildTagRegex.exec(stdout);
      let processed: ProcessedTag = {
        content: matches[1].replace(buildMsgRegex, '').trim(),
        exitcode: +matches[2]
      };
      return processed;
    } catch (err) {
      throw 'Failed to process <BUILD_STUDENT_TESTS> tag. ' + err;
    }
  }

  public processDeliverableRuntimeTestTag(stdout: string): ProcessedTag {
    try {
      let delivRuntimeTagRegex: RegExp = /^<RUN_DELIVERABLE_AGAINST_STUDENT_WORK>\n([\s\S]*)<\/RUN_DELIVERABLE_AGAINST_STUDENT_WORK exitcode=(\d+), completed=(.+), duration=(\d+)s>$/gm
      let delivRuntimeMsgRegex: RegExp = /^(npm.*)$/gm;
      let matches: string[] = delivRuntimeTagRegex.exec(stdout);
      let processed: ProcessedTag = {
        content: matches[1].replace(delivRuntimeMsgRegex, '').trim(),
        exitcode: +matches[2]
      };
      return processed;
    } catch (err) {
      throw 'Failed to process <RUN_DELIVERABLE_AGAINST_STUDENT_WORK> tag. ' + err;
    }
  }


  public processDeliverableProjectBuildTag(stdout: string): ProcessedTag {
    try {
      let buildTagRegex: RegExp = /^<BUILD_DELIVERABLE_TESTS>\n([\s\S]*)<\/BUILD_DELIVERABLE_TESTS exitcode=(\d+), completed=(.+), duration=(\d+)s>$/gm
      let buildMsgRegex: RegExp = /^(npm.*)$/gm;
      let matches: string[] = buildTagRegex.exec(stdout);
      let processed: ProcessedTag = {
        content: matches[1].replace(buildMsgRegex, '').trim(),
        exitcode: +matches[2]
      };
      return processed;
    } catch (err) {
      throw 'Failed to process <BUILD_DELIVERABLE_TESTS> tag. ' + err;
    }
  }


  public processCoverageTag(stdout: string): ProcessedTag {
    try {
      let coverageTagRegex: RegExp = /^<PROJECT_COVERAGE>([\s\S]*)<\/PROJECT_COVERAGE exitcode=(\d+), completed=(.+), duration=(\d+)s>$/gm;
      let matches: string[] = coverageTagRegex.exec(stdout);
      let exitcode: number = +matches[2];
      if (exitcode == 0)
        return {content:'', exitcode:0};


      let content: string = matches[1];
      let failedTestsRegex: RegExp = /^  (\d+\)|  throw) [\s\S]*$/gm;
      let failedTests: string[] = failedTestsRegex.exec(content);

      return {content: failedTests[0], exitcode: exitcode};
    } catch(err) {
      throw 'Failed to process <PROJECT_COVERAGE> tag. ' + err;
    }
  }

public getTestRecord(): object {
  let that = this;
    this._id += this.suiteVersion;
    let container = {
      scriptVersion: this.scriptVersion,
      suiteVersion: this.suiteVersion,
      image: this.deliverable.image,
      exitcode: this.containerExitCode
    }

    function getStdio() {
      
      if (that.stdio && that.stdio.length > 3000000) {
        let trimmedStdio = String(that.stdio).substring(0, 3000000);
        trimmedStdio += "\n\n\n STDIO FILE TRUNCATED AS OVER SIZE LIMIT";
        let attachment = {name: 'stdio.txt', data: trimmedStdio, content_type: 'application/plain'};
        return attachment;
      } else {
        let attachment = {name: 'stdio.txt', data: that.stdio, content_type: 'application/plain'};
        return attachment;
      }
    }

    function getReport() {
      let attachments = [];
      if (that.report && that.reportSize <= that.maxReportSize) {
        let attachment = {name: 'report.json', data: that.report, content_type: 'application/json'};
        return attachment;
      }
    }
    function parseReport() {
        if(typeof that.report !== 'undefined') {
          return JSON.parse(that.report);
        }
        return 'REPORT_FAILED';
    }
    try {
       let doc = {
        'team': this.team,
        'courseNum': this.courseNum,
        'orgName': this.githubOrg,
        'deliverable': this.deliverable.deliverable,
        'user': this.username,
        'report': parseReport(),
        'testStats': this.testStats,
        'coverStats': this.coverageStats,
        'coverReport': this.coverageReport,
        'coverStderr': this.failedCoverage,
        'studentBuildFailed': this.studentBuildFailed,
        'studentBuildMsg': this.studentBuildMsg,
        'deliverableBuildFailed': this.deliverableBuildFailed,
        'deliverableBuildMsg': this.deliverableBuildMsg,
        'deliverableRuntimeMsg': this.deliverableRuntimeMsg,
        'deliverableRuntimeError': this.deliverableRuntimeError,
        'testReport': this.testReport,
        'commit': this.commit,
        'committer': this.committer,
        'timestamp': this.timestamp,
        'container': container,
        'ref': this.ref,
        'attachments': [getStdio(), getReport()],
        'idStamp': this._id + this.suiteVersion
      }
      return doc;
    }
    catch(err) {
      Log.error(`TestRecord::getTestRecord() - ERROR ${err}`)
    }
  }
}
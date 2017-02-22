import cp = require('child_process');
import tmp = require('tmp-promise');
import fs = require('fs');
import {IConfig, AppConfig} from '../../Config';

import {Commit} from '../GithubUtil';
import {CouchDatabase,Database, DatabaseRecord, InsertResponse} from '../Database';
import {TestJob, TestJobDeliverable} from '../../controller/TestJobController';
import Log from '../../Util';



interface TestOutput {
  mocha: JSON;
  testStats: TestStats;
}

interface CoverageOutput {
  report: JSON;
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
  buildFailed: boolean,
  buildMsg: string,
  containerExitCode: number,
  processErrors: string[]
}

export default class TestRecord implements DatabaseRecord {
  // private config: IConfig;
  private maxStdioSize: number = 5 * 1000000;  // 5 MB


  private stdio: string;
  private coverageZip: Buffer;

  private githubToken: string;
  private _id: string;
  private _rev: string;
  private team: string;
  private deliverable: TestJobDeliverable;
  private testStats: TestStats;
  private coverageReport: any;
  private coverageStats: CoverageStats;
  private buildFailed: boolean;
  private buildMsg: string;
  private testReport: any;
  private commit: string;
  private committer: string;
  private containerExitCode: number = 0;
  private timestamp: number;
  private scriptVersion: string;
  private suiteVersion: string;
  private failedCoverage: string;
  private stdioSize: number;
  private ref: string;

  constructor(githubToken: string, testJob: TestJob) {
    this.githubToken = githubToken;
    this.team = testJob.team;
    this.deliverable = testJob.test;
    this.commit = testJob.commit;
    this.committer = testJob.user;
    this.ref = testJob.ref;
    this.timestamp = +new Date();
    this._id = this.timestamp + '_' + this.team + ':' + this.deliverable.deliverable + '-';
  }

  public async generate(): Promise<TestStatus> {
    let tempDir = await tmp.dir({ dir: '/tmp', unsafeCleanup: true });
    let file: string = './docker/tester/run-test-container.sh';
    let args: string[] = [
      this.githubToken,
      this.team,
      this.commit,
      this.deliverable.image,
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


        let readTranscript: Promise<string> = new Promise((fulfill, reject) => {
          fs.readFile(tempDir.path + '/stdio.txt', 'utf8', (err, data) => {
            if (err) {
              Log.error('TestRecord::generate() - ERROR reading stdio.txt. ' + err);
              if (this.containerExitCode == 0) this.containerExitCode = 30;
              return fulfill(err);
            }
            try {
              this.stdio = data;

              // Process the info tag
              let infoTag: any = this.processInfoTag(data);
              this.scriptVersion = infoTag.scriptVersion;
              this.suiteVersion = infoTag.suiteVersion;

              // Process the project build tag
              let buildTag: ProcessedTag = this.processProjectBuildTag(data);
              this.buildFailed = (buildTag.exitcode > 0 ? true : false);
              this.buildMsg = buildTag.content;

              // Process the coverage tag
              let coverageTag: ProcessedTag = this.processCoverageTag(data);
              this.failedCoverage = coverageTag.content;

              fulfill();
            } catch(err) {
              fulfill(err);
            }
          });
        });
        promises.push(readTranscript);


        let readCoverage: Promise<string> = new Promise((fulfill, reject) => {
          fs.readFile(tempDir.path + '/coverage.json', 'utf8', (err, data) => {
            if (err) {
              Log.error('TestRecord::generate() - ERROR reading coverage.json. ' + err);
              if (this.containerExitCode == 0) this.containerExitCode = 31;
              fulfill(err);
            }
            try {
              let coverage: CoverageOutput = this.processCoverageJson(data);
              this.coverageStats = coverage.coverageStats;
              this.coverageReport = coverage.report;
              fulfill();
            } catch(err) {
              fulfill(err);
            }
          });
        });
        promises.push(readCoverage);

        let readTests: Promise<string> = new Promise((fulfill, reject) => {
          fs.readFile(tempDir.path + '/mocha.json', 'utf8', (err, data) => {
            if (err) {
              Log.error('TestRecord::generate() - ERROR reading mocha.json. ' + err);
              if (this.containerExitCode == 0) this.containerExitCode = 32;
              fulfill(err);
            }
            try {
              let tests: TestOutput = this.processMochaJson(data);
              this.testStats = tests.testStats;
              this.testReport = tests.mocha;
              fulfill();
            } catch(err) {
              fulfill(err);
            }
          });
        });
        promises.push(readTests);


        // let readCoverage: Promise<string> = new Promise((fulfill, reject) => {
        //   fs.readFile(tempDir.name + '/coverage.zip', (err, data) => {
        //     if (err) {
        //       Log.error('TestRecord::generate() - ERROR reading coverage.zip. ' + err);
        //       if (this.containerExitCode == 0) this.containerExitCode = 32;
        //       fulfill(err);
        //     }
        //     this.coverageZip = data;
        //     fulfill();
        //   });
        // });
        // promises.push(readCoverage);

        Promise.all(promises).then((err) => {
          let testStatus: TestStatus = {
            buildFailed: this.buildFailed,
            buildMsg: this.buildMsg,
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
      let infoTagRegex: RegExp = /^<INFO>\nscript version: (.+)\ntest suite version: (.+)\n<\/INFO exitcode=(\d+), completed=(.+), duration=(\d+)s>$/gm
      //let infoMsgRegex: RegExp = /^(npm.*)$/gm;
      let matches: string[] = infoTagRegex.exec(stdout);
      let processed: any = {
        scriptVersion: matches[1].trim(),
        suiteVersion: matches[2].trim()
      };
      return processed;
    } catch (err) {
      throw 'Failed to process <INFO> tag. ' + err;
    }
  }

  public processProjectBuildTag(stdout: string): ProcessedTag {
    try {
      let buildTagRegex: RegExp = /^<PROJECT_BUILD>\n([\s\S]*)<\/PROJECT_BUILD exitcode=(\d+), completed=(.+), duration=(\d+)s>$/gm
      let buildMsgRegex: RegExp = /^(npm.*)$/gm;
      let matches: string[] = buildTagRegex.exec(stdout);
      let processed: ProcessedTag = {
        content: matches[1].replace(buildMsgRegex, '').trim(),
        exitcode: +matches[2]
      };
      return processed;
    } catch (err) {
      throw 'Failed to process <PROJECT_BUILD> tag. ' + err;
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


  public processCoverageJson(text: string): CoverageOutput {
    try {
      let report: any = JSON.parse(text);
      let statements = report.total.statements;
      let branches = report.total.branches;
      let functions = report.total.functions;
      let lines = report.total.lines;

      let processed: CoverageOutput = {
        report: report,
        coverageStats: {
          lines: {percentage: lines.pct, total: lines.total, covered: lines.covered, skipped: lines.skipped},
          statements: {percentage: statements.pct, total: statements.total, covered: lines.covered, skipped: lines.skipped},
          branches: {percentage: branches.pct, total: branches.total, covered: branches.covered, skipped: branches.skipped},
          functions: {percentage: functions.pct, total: functions.total, covered: functions.covered, skipped: functions.skipped}
        }
      }

      return processed;
    } catch(err) {
      throw 'Failed to process coverage report (JSON). ' + err;
    }
  }


  public processMochaJson(text: string): TestOutput {
    try {
      let report: any = JSON.parse(text);
      let passPercent: number = report.stats.passPercent;
      let passCount: number = report.stats.passes;
      let failCount: number = report.stats.failures;
      let skipCount: number = report.stats.skipped;

      let passNames: string[] = report.allTests.filter(test => {
        return test.pass;
      }).map(name => {
        let fullName: string = name.fullTitle;
        return fullName.substring(fullName.indexOf('~')+1, fullName.lastIndexOf('~'));
      });
      let failNames: string[] = report.allTests.filter(test => {
        return test.fail;
      }).map(name => {
        let fullName: string = name.fullTitle;
        return fullName.substring(fullName.indexOf('~')+1, fullName.lastIndexOf('~'));
      });
      let skipNames: string[] = [].concat.apply([], report.suites.suites.filter(suite => {
        return suite.hasSkipped;
      }).map(suite => {
        return suite.skipped.map(skippedTest => {
          let fullName: string = skippedTest.fullTitle;
          return fullName.substring(fullName.indexOf('~')+1, fullName.lastIndexOf('~'));
        });
      }));

      let processed: TestOutput = {
        mocha: report,
        testStats: {
          passPercent: passPercent,
          passCount: passCount,
          failCount: failCount,
          skipCount: skipCount,
          passNames: passNames,
          failNames: failNames,
          skipNames: skipNames
        }
      }

      return processed;
    } catch(err) {
      throw 'Failed to process mocha test report (JSON). ' + err;
    }
  }


  public async create(db: CouchDatabase): Promise<InsertResponse> {
    return this.insert(db);
  }

  public async update(db: CouchDatabase): Promise<InsertResponse> {
    return new Promise<InsertResponse>((fulfill, reject) => {
      reject('Not allowed.');
    })
  }

  private async insert(db: CouchDatabase): Promise<InsertResponse> {
    this._id += this.suiteVersion;
    let container = {
      scriptVersion: this.scriptVersion,
      suiteVersion: this.suiteVersion,
      image: this.deliverable.image,
      exitcode: this.containerExitCode
    }

    let doc = {
      'team': this.team,
      'deliverable': this.deliverable.deliverable,
      'testStats': this.testStats,
      'coverStats': this.coverageStats,
      'coverReport': this.coverageReport,
      'coverStderr': this.failedCoverage,
      'buildFailed': this.buildFailed,
      'buildMsg': this.buildMsg,
      'testReport': this.testReport,
      'commit': this.commit,
      'committer': this.committer,
      'timestamp': this.timestamp,
      'container': container,
      'ref': this.ref

    }

    let attachments = [];
    if (this.stdio && this.stdioSize <= this.maxStdioSize) {
      attachments.push({name: 'stdio.txt', data: this.stdio, content_type: 'application/plain'});
    }
    // if (this.coverageZip) {
    //   attachments.push({name: 'coverage.zip', data: this.coverageZip, content_type: 'application/zip'});
    // }


    let that = this;
    return new Promise<InsertResponse>((fulfill, reject) => {
      db.multipart.insert(doc, attachments, this._id, (err, body) => {
        if (err) {
          console.log('Failed to insert record!.', err)
          reject(err);
        }
        fulfill(body);
      });
    });
  }
}

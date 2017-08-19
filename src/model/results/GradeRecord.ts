import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
import TestRecord from '../../model/results/TestRecord'
import TestRecordRepo from '../../repos/TestRecordRepo';

export interface GradeSummary {
  deliverable: string;
  exitCode: number;
  studentBuildFailed: boolean;
  studentBuildMsg: string;
  deliverableBuildFailed: boolean;
  deliverableBuildMsg: string;
  grade: number;
  testGrade: number;
  testSummary: string;
  coverageSummary: string;
  coverageFailed: string;
  scriptVersion: string;
  suiteVersion: string;
  failedTests: string[];
}

export default class GradeRecord {
  private deliverable: string;
  private originalTestRecord: any;
  private gradeView: any;

  constructor(testRecord: any, deliverable: string) {
    this.originalTestRecord = testRecord;
    this.deliverable = deliverable;
  }

  public getGradeSummary(): any {
    try {
      this.gradeView = this.convertToGradeViewFormat();
    }
    catch (err) {
      Log.error(`GradeRecord::getGradeSummary Error Converting TestRecord to GradeView format: ${err}`)
    }

    try {
      return this.convertGradeViewToGradeSummary(this.gradeView)
    }
    catch (err) {
      Log.error(`GradeRecord::getGradeSummary Error Converting GradeView to GradeSummary format: ${err}.`)
    }
  }

  public convertToGradeViewFormat(): any {
    let doc = this.originalTestRecord;
    let gradeSummary;

    if (doc.team && doc.deliverable && doc.commit && doc.deliverable.deliverable !== 'd0') {
      if (doc.studentBuildFailed || doc.deliverableBuildFailed || doc.containerExitCode > 0) {
        gradeSummary = { 
          deliverable: doc.deliverable,
          exitCode: doc.container.exitcode, 
          studentBuildFailed: doc.studentBuildFailed,
          studentBuildMsg: doc.studentBuildMsg,
          deliverableBuildFailed: doc.deliverableBuildFailed,
          deliverableBuildMsg: doc.deliverableBuildMsg,
          grade: 0,
          testGrade: -1,
          testSummary: 'Tests did not run.',
          coverageGrade: -1,
          coverStderr: '',
          scriptVersion: doc.container.scriptVersion,
          suiteVersion: doc.container.suiteVersion,
          failedTests: []
          }
      }
      else {
      let report: any = doc.report;
      let deliverableInfo: any = report.deliverableInfo;
      let newCoverage: any = report.coverage;
      let tests: any = report.tests;
      let failedTests = new Array();

      let tStats = doc.testStats;
      let coverage = newCoverage.lines.percentage === "unknown" ? 0 : newCoverage.lines.percentage
      gradeSummary = {
        'deliverable': doc.deliverable,
        'exitCode': doc.container.exitcode,
        'studentBuildFailed': doc.studentBuildFailed,
        'studentBuildMsg': doc.studentBuildMsg,
        'deliverableBuildFailed': doc.deliverableBuildFailed,
        'deliverableBuildMsg': doc.deliverableBuildMsg,
        'grade': tests.grade.finalGrade, //+(0.8*tStats.passPercent + 0.2*Math.min(coverage+5, 100)).toFixed(2),
        'testGrade': tests.overviewResults.passPercent,
        'testSummary': tests.overviewResults.passes + ' passing, ' + tests.overviewResults.failures + ' failing, ' + tests.overviewResults.skipped + ' skipped',
        'coverageGrade': tests.grade.finalGrade,
        'coverStderr': doc.coverStderr,
        'scriptVersion': doc.container.scriptVersion,
        'suiteVersion': doc.container.suiteVersion,
        'failedTests': tests.detailedResults.reduce(function(failedTests, test) {
          let testName: string;
          if (test.state === "failure") {
            let testName = "Remember to enable substring for 310... " + test.testName;
            failedTests.push(testName);
            // let code = name.substring(name.indexOf('~')+1, name.lastIndexOf('~')); // legacy substring for 310
          }
          return failedTests;
            //return code + ': ' + name.substring(name.lastIndexOf('~')+1, name.indexOf('.')+1);\n              })\n            })\n          }\n        }\n      }"
        }, [])
      }
    }
    
  }
  return gradeSummary;
  }

  public convertGradeViewToGradeSummary(gradeView) {
    try {
      let result = gradeView;
      let gradeSummary: GradeSummary = {
        deliverable: this.deliverable,
        exitCode: result.exitCode,
        studentBuildFailed: result.studentBuildFailed,
        studentBuildMsg: result.studentBuildMsg,
        deliverableBuildFailed: result.deliverableBuildFailed,
        deliverableBuildMsg: result.deliverableBuildMsg,
        grade: result.grade,
        testGrade: result.testGrade,
        testSummary: result.testSummary,
        coverageSummary: result.coverageGrade,
        coverageFailed: result.coverStderr || [],
        scriptVersion: result.scriptVersion,
        suiteVersion: result.suiteVersion,
        failedTests: result.failedTests
      }
      return gradeSummary;
    }
    catch (err) {
      Log.error(`GradeRecord::convertGradeViewToGradeSummary ERROR Could not convert to GradeView: ${err}`);
    }
  }
}

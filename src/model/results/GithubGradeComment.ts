import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
import TestRecord from '../../model/results/TestRecord'
import TestRecordRepo from '../../repos/TestRecordRepo';
import ResultRecord from './ResultRecord';


export default class GithubGradeComment {
  private config: IConfig;
  private team: string;
  private commit: string;
  private deliverable: string;
  private note: string;
  private orgName: string;
  private resultRecord: ResultRecord;

  constructor(team: string, shortCommit: string, deliverable: string, orgName: string, note: string) {
    this.config = new AppConfig();
    this.team = team;
    this.commit = shortCommit;
    this.orgName = orgName;
    this.deliverable = deliverable;
    this.note = note;
  }

  public async fetch() {
    this.resultRecord = await this.getResult();
  }

  /**
   * Pulls the test/coverage results from the database.
   *
   * @param team - Team identifier.
   * @param commit - The GitHub commit SHA that the tests were run against.
   * @param deliverable - Deliverable identifier (i.e. d1, d2, etc.).
   */
  private async getResult(): Promise<ResultRecord> {
    let testRecordRepo = new TestRecordRepo();

    let that = this;
    return new Promise<ResultRecord>(async (fulfill, reject) => {
      try {
        // important: this query has to be done in descending order to get the latest result.
        let testRecord = await testRecordRepo.getLatestTestRecord(this.team, this.commit, this.deliverable, this.orgName);
        let resultRecord: any // ResultRecord = new ResultRecord();

        fulfill(resultRecord)
      } catch(err) {
        reject('Unable to get test result for ' + this.team + ' commit ' + this.commit + '. ' + err);
      }
    });
  }


  /**
   * Formats the resultRecord as a Markdown string suitable for display on GitHub.
   *
   * @param resultRecord
   */
  public formatResult(): string {
    try {
      let resultRecord: any = this.resultRecord;
      let preamble: string = this.note ? '_' + this.note + '_\n\n' : '';
      let output: string = preamble + 'For deliverable **' + resultRecord.deliverable + '**, this commit received a grade of **<GRADE>%**.\n';


      if (resultRecord.studentBuildFailed) {
        output += '\nBuild failed:\n\n```<BUILD_MSG>\n```';
        output = output.replace(
          '<GRADE>', '0'
        ).replace(
          '<BUILD_MSG>', resultRecord.studentBuildMsg
        );
      } else if (resultRecord.exitCode == 124) {
        output += ' - Timeout exceeded while executing tests.';
        output = output.replace('<GRADE>', '0');
      } else if (resultRecord.exitCode == 29) {
        output += ' - You must reduce your console output and make another commit before you can receive a grade.';
        output = output.replace(
          '<GRADE>', '0'
        ).replace(
          '<EXIT_CODE>', resultRecord.exitCode.toString()
        );
      } else if (resultRecord.exitCode != 0) {
        output += ' - AutoTest was unable to grade your assignment. (Exit <EXIT_CODE>).';
        output = output.replace(
          '<GRADE>', '0'
        ).replace(
          '<EXIT_CODE>', resultRecord.exitCode.toString()
        );
      } 
      else if ('310'.indexOf(resultRecord.courseNum.toString()) > -1) {
        // if 310 class, then run 310 logic
        Log.info('GithubGradeComment:: 310 hit');
        output += '- Test summary: <TEST_GRADE>% (<TEST_SUMMARY>)\n- Line coverage: <COVERAGE_SUMMARY>%';
        let deliv = resultRecord.deliverable;
        
        output = output.replace(
          '<GRADE>', String(resultRecord.grade)
        ).replace(
          '<TEST_GRADE>', String(+resultRecord.coverageSummary)
        ).replace(
          '<TEST_SUMMARY>', String(resultRecord.testSummary)
        ).replace(
          '<COVERAGE_SUMMARY>', String(resultRecord.coverageGrade)
        );

        if (resultRecord.coverageFailed.length > 0) {
          output += '\n\nSome of your tests failed when run on AutoTest:\n ```\n';
          if (resultRecord.coverageFailed.length > 1024)
            output += resultRecord.coverageFailed.substring(0, 1024)+'\n...';
          else
            output += resultRecord.coverageFailed
          output += '\n```\n';
        }

        if (resultRecord.failedTests.length > 0) {
          output += '\n\nYour code failed the tests:\n - ';
          output += resultRecord.failedTests.join('\n - ');
        }
      }
      else {
        // if 210 class, then run 210 logic
        Log.info('GithubGradeComment:: 210 hit');
        output += `- Test summary: <TEST_GRADE>% (<TEST_SUMMARY>)
          \n- Code coverage: <CODE_COVERAGE>%`;

        output = output.replace(
          '<GRADE>', resultRecord.grade.toString()
        ).replace(
          '<TEST_GRADE>', resultRecord.testingGrade.toString()
        ).replace(
          '<TEST_SUMMARY>', resultRecord.testSummary 
        ).replace(
          '<CODE_COVERAGE>', resultRecord.coverageGrade
        );

        if (resultRecord.coverageFailed.length > 0) {
          output += '\n\nSome of your tests failed when run on AutoTest:\n ```\n';
          if (resultRecord.coverageFailed.length > 1024)
            output += resultRecord.coverageFailed.substring(0, 1024)+'\n...';
          else
            output += resultRecord.coverageFailed
          output += '\n```\n';
        }

        if (resultRecord.failedTests.length > 0) {
          output += '\n\nYour code failed the tests:\n - ';
          output += resultRecord.failedTests.join('\n - ');
        }
      }
      output += '\n\n<sub>suite: ' + resultRecord.suiteVersion + '  |  script: ' + resultRecord.scriptVersion + '.</sub>';

      return output;
    }
    catch(err) {
      Log.error(`GithubGradeComment::formatResult() ERROR creating result ${err}`);
    }
  }
}

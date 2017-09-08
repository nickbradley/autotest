import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
import TestRecord from '../../model/results/TestRecord'
import TestRecordRepo from '../../repos/TestRecordRepo';
import GradeRecord, {GradeSummary} from './GradeRecord';

export default class ResultRecord {
  private config: IConfig;
  private team: string;
  private commit: string;
  private deliverable: string;
  private note: string;
  private orgName: string;
  private gradeSummary: GradeSummary;

  constructor(team: string, shortCommit: string, deliverable: string, orgName: string, note: string) {
    this.config = new AppConfig();
    this.team = team;
    this.commit = shortCommit;
    this.orgName = orgName;
    this.deliverable = deliverable;
    this.note = note;
  }

  public async fetch() {
    this.gradeSummary = await this.getResult();
  }

  // TODO @nickbradley Create view and design document
  /**
   * Pulls the test/coverage results from the database.
   *
   * @param team - Team identifier.
   * @param commit - The GitHub commit SHA that the tests were run against.
   * @param deliverable - Deliverable identifier (i.e. d1, d2, etc.).
   */
  private async getResult(): Promise<GradeSummary> {
    let designName: string = 'grades';
    let viewName: string = 'byTeamDeliverableCommit';
    let testRecordRepo = new TestRecordRepo();
    let params: QueryParameters = {
      key: [this.team, this.deliverable, this.commit],
      descending: true
    };

    let that = this;
    return new Promise<GradeSummary>(async (fulfill, reject) => {
      try {
        let testRecord = await testRecordRepo.getLatestTestRecord(this.team, this.commit, this.deliverable, this.orgName);
        let gradeSummary: GradeSummary = new GradeRecord(testRecord, this.deliverable).getGradeSummary();

        fulfill(gradeSummary)
      } catch(err) {
        reject('Unable to get test result for ' + this.team + ' commit ' + this.commit + '. ' + err);
      }
    });
  }


  /**
   * Formats the GradeSummary as a Markdown string suitable for display on GitHub.
   *
   * @param gradeSummary
   */
  public formatResult(): string {
    try {
      let gradeSummary: GradeSummary = this.gradeSummary;
      let preamble: string = this.note ? '_' + this.note + '_\n\n' : '';
      let output: string = preamble + 'For deliverable **' + gradeSummary.deliverable + '**, this commit received a grade of **<GRADE>%**.\n';


      if (gradeSummary.studentBuildFailed) {
        output += '\nBuild failed:\n\n```<BUILD_MSG>\n```';
        output = output.replace(
          '<GRADE>', '0'
        ).replace(
          '<BUILD_MSG>', gradeSummary.studentBuildMsg
        );
      } else if (gradeSummary.exitCode == 124) {
        output += ' - Timeout exceeded while executing tests.';
        output = output.replace('<GRADE>', '0');
      } else if (gradeSummary.exitCode == 29) {
        output += ' - You must reduce your console output and make another commit before you can receive a grade.';
        output = output.replace(
          '<GRADE>', '0'
        ).replace(
          '<EXIT_CODE>', gradeSummary.exitCode.toString()
        );
      } else if (gradeSummary.exitCode != 0) {
        output += ' - Autotest encountered an error during testing (Exit <EXIT_CODE>).';
        output = output.replace(
          '<GRADE>', '0'
        ).replace(
          '<EXIT_CODE>', gradeSummary.exitCode.toString()
        );
      } 
      else if ('310'.indexOf(gradeSummary.courseNum.toString()) > -1) {
        // if 310 class, then run 310 logic
        console.log('310 hit');
        output += '- Test summary: <TEST_GRADE>% (<TEST_SUMMARY>)\n- Line coverage: <COVERAGE_SUMMARY>%';

        output = output.replace(
          '<GRADE>', gradeSummary.grade.toString()
        ).replace(
          '<TEST_GRADE>', (+gradeSummary.coverageSummary).toString()
        ).replace(
          '<TEST_SUMMARY>', gradeSummary.testSummary 
        ).replace(
          '<COVERAGE_SUMMARY>', gradeSummary.lineCoverage.toString()
        );

        if (gradeSummary.coverageFailed.length > 0) {
          output += '\n\nSome of your tests failed when run on AutoTest:\n ```\n';
          if (gradeSummary.coverageFailed.length > 1024)
            output += gradeSummary.coverageFailed.substring(0, 1024)+'\n...';
          else
            output += gradeSummary.coverageFailed
          output += '\n```\n';
        }

        if (gradeSummary.failedTests.length > 0) {
          output += '\n\nYour code failed the tests:\n - ';
          output += gradeSummary.failedTests.join('\n - ');
        }
      }
      else {
        // if 210 class, then run 210 logic
        console.log('210 hit');
        output += `- Test summary: <TEST_GRADE>% (<TEST_SUMMARY>)
          \n- Code coverage: <CODE_COVERAGE>%`;

        output = output.replace(
          '<GRADE>', gradeSummary.grade.toString()
        ).replace(
          '<TEST_GRADE>', gradeSummary.testingGrade.toString()
        ).replace(
          '<TEST_SUMMARY>', gradeSummary.testSummary 
        ).replace(
          '<CODE_COVERAGE>', gradeSummary.coverageGrade
        );

        if (gradeSummary.coverageFailed.length > 0) {
          output += '\n\nSome of your tests failed when run on AutoTest:\n ```\n';
          if (gradeSummary.coverageFailed.length > 1024)
            output += gradeSummary.coverageFailed.substring(0, 1024)+'\n...';
          else
            output += gradeSummary.coverageFailed
          output += '\n```\n';
        }

        if (gradeSummary.failedTests.length > 0) {
          output += '\n\nYour code failed the tests:\n - ';
          output += gradeSummary.failedTests.join('\n - ');
        }
      }
      output += '\n\n<sub>suite: ' + gradeSummary.suiteVersion + '  |  script: ' + gradeSummary.scriptVersion + '.</sub>';

      return output;
    }
    catch(err) {
      Log.error(`ResultRecord::formatResult() ERROR creating result ${err}`);
    }
  }
}

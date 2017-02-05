import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';


interface GradeSummary {
  deliverable: string;
  exitCode: number;
  buildFailed: boolean;
  buildMsg: string;
  grade: number;
  testGrade: number;
  testSummary: string;
  coverageSummary: string;
  coverageFailed: string;
  scriptVersion: string;
  suiteVersion: string;
  failedTests: string[];
}


export default class ResultRecord {
  private config: IConfig;
  private team: string;
  private commit: string;
  private deliverable: string;
  private note: string;
  private gradeSummary: GradeSummary;

  constructor(team: string, shortCommit: string, deliverable: string, note: string) {
    this.config = new AppConfig();
    this.team = team;
    this.commit = shortCommit;
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
    let db = new Database(this.config.getDBConnection(), 'results');
    let designName: string = 'grades';
    let viewName: string = 'byTeamDeliverableCommit';
    let params: QueryParameters = {
      key: [this.team, this.deliverable, this.commit],
      descending: true
    };

    let that = this;
    return new Promise<GradeSummary>(async (fulfill, reject) => {
      try {
        let view: ViewResponse = await db.view(designName, viewName, params);
        // console.log('view is ', view);
        // let publicTests = view.rows.filter(obj => {
        //   return obj.value.visibility == 0
        // }).map(obj => {
        //   return obj.value;
        // })[0];
        // let privateTests = view.rows.filter(obj => {
        //   return obj.value.visibility == 0
        // }).map(obj => {
        //   return obj.value;
        // })[0];

        let publicTests = view.rows[0].value;
        let privateTests = view.rows[0].value;

        let gradeSummary: GradeSummary = {
          deliverable: this.deliverable,
          exitCode: privateTests.exitCode,
          buildFailed: privateTests.buildFailed,
          buildMsg: privateTests.buildMsg,
          grade: privateTests.grade,
          testGrade: privateTests.testGrade,
          testSummary: privateTests.testSummary,
          coverageSummary: privateTests.coverageGrade,
          coverageFailed: privateTests.coverStderr,
          scriptVersion: privateTests.scriptVersion,
          suiteVersion: privateTests.suiteVersion,
          failedTests: publicTests.failedTests
        }


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
    let gradeSummary: GradeSummary = this.gradeSummary;
    let preamble: string = this.note ? '_' + this.note + '_\n\n' : '';
    let output: string = preamble + 'For deliverable **' + gradeSummary.deliverable + '**, this commit received a grade of **<GRADE>%**.\n';


    if (gradeSummary.buildFailed) {
      output += '\nBuild failed:\n\n```<BUILD_MSG>\n```';
      output = output.replace(
        '<GRADE>', '0'
      ).replace(
        '<BUILD_MSG>', gradeSummary.buildMsg
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
    } else {
      output += '- Test summary: <TEST_GRADE>% (<TEST_SUMMARY>)\n- Line coverage: <COVERAGE_SUMMARY>%';

      output = output.replace(
        '<GRADE>', gradeSummary.grade.toFixed()
      ).replace(
        '<TEST_GRADE>', gradeSummary.testGrade.toFixed()
      ).replace(
        '<TEST_SUMMARY>', gradeSummary.testSummary
      ).replace(
        '<COVERAGE_SUMMARY>', (+gradeSummary.coverageSummary).toFixed()
      );

      if (gradeSummary.coverageFailed) {
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
}

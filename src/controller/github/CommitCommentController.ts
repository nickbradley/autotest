import * as Moment from 'moment';
import * as Url from 'url'

import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
import CommitCommentRecord from '../../model/requests/CommitComment';
import {GithubResponse, Commit} from '../../model/GithubUtil';
import PostbackController from './PostbackController'
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';

interface GradeSummary {
  deliverable: string;
  timeoutExceeded: boolean;
  buildFailed: boolean;
  buildMsg: string;
  grade: number;
  testSummary: string;
  coverageSummary: string;
  failedTests: string[];
}

export default class CommitCommentContoller {
  private config: IConfig;


  constructor() {
    this.config = new AppConfig();
  }


  async process(data: JSON): Promise<GithubResponse> {
    Log.trace('CommitCommentContoller::process()');
    let that = this;
    return new Promise<GithubResponse>(async (fulfill, reject) => {
      try {
        let record: CommitCommentRecord = new CommitCommentRecord();
        let response: GithubResponse;

        await record.process(data);
        await that.store(record);

        let isAdmin: boolean = await that.isAdmin(record.user);
        if (record.isRequest) {
          let lastRequest: Date = await that.latestRequest(record.user, record.deliverable);
          let diff: number = +new Date() - +lastRequest;
          if (diff > record.deliverableRate || isAdmin) {
            let resultRaw: GradeSummary = await that.getResult(record.team, record.commit, record.deliverable);
            let body: string = that.formatResult(resultRaw);
            response = {
              statusCode: 200,
              body: body
            }
          } else {
            response = {
              statusCode: 429,
              body: 'Sorry, you must wait ' + Moment.duration(diff).humanize() + ' before you make another request'
            }
          }
          await this.postComment(record.hook, response.body);
        } else {
          response = {
            statusCode: 204,
            body: ''
          }
        }

        fulfill(response);

      } catch(err) {
        throw 'Failed to process commit comment. ' + err;
      }
    });
  }


  // TODO @nickbradley Check the output of db.readRecord
  /**
   * Checks to see if the user is in the admin list in the database.
   *
   *  @param user
   */
  private async isAdmin(user: string): Promise<boolean> {
    let db = new Database(this.config.getDBConnection(), 'settings');
    let that = this;
    return new Promise<boolean>(async (fulfill, reject) => {
      try {
        let adminRecord: any = await db.readRecord('admins');
        let admins: string[] = adminRecord.body;
        fulfill(admins.includes(user));
      } catch(err) {
        reject('Failed to retrieve admin list. ' + err);
      }
    });
  }

  private async postComment(hook: Url.Url, msg: string) {
    let controller: PostbackController = new PostbackController(hook);
    return controller.submit(msg);
  }


  // TODO @nickbradley create view (and design document)
  /**
   * Query the database to determine the date of the most recent request for the
   * deliverable made by the user.
   *
   * @param user - GitHub username.
   * @param deliverable - Deliverable identifier (i.e. d1, d2, etc.).
   */
  private async latestRequest(user: string, deliverable: string): Promise<Date> {
    let db: Database = new Database(this.config.getDBConnection(), 'requests');
    let designName: string = 'latest';
    let viewName: string = 'byUserDeliverable';
    let params: QueryParameters = {
      key: {user: user, deliverable: deliverable}
    };
    let that = this;
    return new Promise<Date>(async (fulfill, reject) => {
      try {
        let view: ViewResponse = await db.view(designName, viewName, params);
        let latestDate: number = +view.rows[0].value || 0;
        fulfill(new Date(latestDate));
      } catch(err) {
        reject('Failed to get latest request of user ' + user + ' for deliverable ' + deliverable);
      }
    });
  }


  // TODO @nickbradley Create view and design document
  /**
   * Pulls the test/coverage results from the database.
   *
   * @param team - Team identifier.
   * @param commit - The GitHub commit SHA that the tests were run against.
   * @param deliverable - Deliverable identifier (i.e. d1, d2, etc.).
   */
  private async getResult(team: string, commit: Commit, deliverable: string): Promise<GradeSummary> {
    let db = new Database(this.config.getDBConnection(), 'results');
    let designName: string = 'default';
    let viewName: string = 'byTeamCommitDeliverable';
    let params: QueryParameters = {
      key: {
        team: team,
        commit: commit.toString(),
        deliverable: deliverable
      }
    };
    let that = this;
    return new Promise<GradeSummary>(async (fulfill, reject) => {
      try {
        let view: ViewResponse = await db.view(designName, viewName, params);
        let publicTests = view.rows.filter(obj => {
          return obj.value.visibility == 0
        });
        let privateTests = view.rows.filter(obj => {
          return obj.value.visibility == 1
        });
        let tStats = privateTests.testStats;
        let cStats = privateTests.coverageStats;
        let gradeSummary: GradeSummary = {
          deliverable: deliverable,
          timeoutExceeded: privateTests.timeoutExceeded,
          buildFailed: privateTests.buildFailed,
          buildMsg: privateTests.buildMsg,
          grade: await that.grade(deliverable, privateTests),
          testSummary: tStats.passCount + ' passing, ' + tStats.failCount + ' failing, ' + tStats.skipCount + ' skipped',
          coverageSummary: cStats.statements.percentage + ' statements, ' + cStats.branches.percentage + ' branches, ' + cStats.functions.percentage + ' functions, ' + cStats.lines.percentage + ' lines',
          failedTests: publicTests.testReport.allFailures.map(test => {
            let name: string = test.fullTitle;
            let code: string = test.substring(name.indexOf('~'), name.lastIndexOf('~'));
            return code + ': ' + name.substring(name.lastIndexOf('~')+1, name.indexOf('.')+1);
          })
        }
        fulfill(gradeSummary)
      } catch(err) {
        reject('Unable to get test result for ' + team + ' commit ' + commit.short + '. ' + err);
      }
    });
  }

  private async grade(deliverable: string, privateTests) {
    let db: Database = new Database(this.config.getDBConnection(), 'settings');
    let record: DeliverableRecord = <DeliverableRecord>(await db.readRecord('deliverables')).body;
    let gradeFormula: string = record[deliverable];

    let gradeExp: string = gradeFormula.replace(
      '<TEST_PERCENTAGE>', privateTests.testStats.passPercent
    ).replace(
      '<COVERAGE_PERCENTAGE>', privateTests.coverageStats.statements.percent
    );
    return Promise.resolve(eval(gradeExp))
  }



  /**
   * Formats the GradeSummary as a Markdown string suitable for display on GitHub.
   *
   * @param gradeSummary
   */
  private formatResult(gradeSummary: GradeSummary): string {
    let output: string = 'For deliverable **' + gradeSummary.deliverable + '**, this commit received a grade of **<GRADE>%**.\n';


    if (gradeSummary.buildFailed) {
      output += `
       - Build failed
      \`\`\`
       <BUILD_MSG>
      \`\`\`
      `;
      output.replace(
        '<GRADE>', '0'
      ).replace(
        '<BUILD_MSG>', gradeSummary.buildMsg
      );
    } else if (gradeSummary.timeoutExceeded) {
      output += `
        - Timeout exceeded while executing tests.
      `;
      output.replace('<GRADE>', '0');
     } else {
      output += `
       - Test summary: <TEST_SUMMARY>
       - Coverage summary: <COVERAGE_SUMMARY>
      `;
      output.replace(
        '<GRADE>', gradeSummary.grade.toFixed()
      ).replace(
        '<TEST_SUMMARY>', gradeSummary.testSummary
      ).replace(
        '<COVERAGE_SUMMARY>', gradeSummary.coverageSummary
      );

      if (gradeSummary.grade < 100) {
        output += '\nIt failed the proxy tests:';
        output += gradeSummary.failedTests.join('\n - ');
      }
    }

    return output;
  }


  private async store(record: CommitCommentRecord) {
    let db: Database = new Database(this.config.getDBConnection(), 'requests');
    return db.createRecord(record);
  }
}

import * as Moment from 'moment';
import * as Url from 'url'

import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
import CommitCommentRecord from '../../model/requests/CommitComment';
import {GithubResponse, Commit} from '../../model/GithubUtil';
import PostbackController from './PostbackController'
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import TestJobController from '../TestJobController';


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

export default class CommitCommentContoller {
  private config: IConfig;
  private record: CommitCommentRecord;


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
        this.record = record;

        let isAdmin: boolean = await that.isAdmin(record.user);

        if (record.isRequest) {
          let lastRequest: Date = await that.latestRequest(record.user, record.deliverable);
          let diff: number = +new Date() - +lastRequest;
          if (diff > record.deliverableRate || isAdmin) {
            try {
              let result: GradeSummary = await that.getResult(record.team, record.commit, record.deliverable);
              let body: string = that.formatResult(result);
              response = {
                statusCode: 200,
                body: body
              }
            } catch(err) {
              Log.info('CommitCommentContoller::process() - No results for request.');
              record.isProcessed = false;
              try {
                Log.info('CommitCommentController::process() - Checking if commit is queued.')
                let maxPos: number = await that.isQueued(record.deliverable, record.team, record.commit);
                let body: string = 'Your commit is still queued for processing. Please try again in a few minutes.';// There are ' + maxPos + (maxPos > 1 ? ' jobs' : ' job') + ' queued.';
                response = {
                  statusCode: 200,
                  body: body
                }
              } catch(err) {
                Log.error('CommitCommentContoller::process() - ERROR Unable to locate test results.')
                response = {
                  statusCode: 404,
                  body: 'We can\'t seem to find any results for this commit. Please make a new commit and try again.'
                }
              }
            }
          } else {
            Log.info('CommitCommentContoller::process() - Request rate exceeded.');
            let waitTime: number = record.deliverableRate - diff;
            record.isProcessed = false;
            response = {
              statusCode: 429,
              body: 'Sorry, you must wait ' + Moment.duration(waitTime).humanize() + ' before you make another request.'
            }
          }

          try {
            let status: number = await that.postComment(record.hook, response.body);
          } catch(err) {
            Log.error('CommitCommentContoller::process() - ERROR. Failed to post result. ' + err);
          }
        } else {
          Log.info('CommitCommentContoller::process() - Not request.');
          response = {
            statusCode: 204,
            body: ''
          }
        }

        try {
          await that.store(record);
        } catch(err) {
          Log.error('CommitCommentContoller::process() - ERROR. Failed to store result. ' + err);
        }

        Log.info('CommitCommentContoller::process() - Request completed with status ' + response.statusCode + '.');

        fulfill(response);

      } catch(err) {
        throw 'Failed to process commit comment. ' + err;
      }
    });
  }

  /**
   * Extract the mention options which can be 'force' or the deliverable name.
   *
   * @param requestMsg: string
   */
  //  private async extractMentionOptions(requestMsg: string): string {
  //
  //  }


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
        let admins: string[] = Object.keys(adminRecord).filter(key => {
          return !key.startsWith('_');
        }).map(name => {
          return name.toLowerCase()
        });
        fulfill(admins.indexOf(user.toLowerCase()) !== -1);
      } catch(err) {
        reject('Failed to retrieve admin list. ' + err);
      }
    });
  }

  private async postComment(hook: Url.Url, msg: string): Promise<number> {
    let controller: PostbackController = new PostbackController(hook);
    return controller.submit(msg);
  }

  /**
   * Checks if the request is in the job queue.
   *
   */
   private async isQueued(deliverable: string, team: string, commit: Commit): Promise<number> {
     //  jobId: job.test.image + '|'  + job.team + '#' + job.commit,
     return new Promise<number>((fulfill, reject) => {
       let jobId: string = 'autotest/' + deliverable + '-testsuite:latest|' + team + '#' + commit.short;
       let queue: TestJobController = TestJobController.getInstance();

       queue.get(jobId).then(job => {
         console.log("job is ");
         console.log(job);
         if (job) {
           queue.count().then(count => {
             fulfill(count);
           }).catch(err => {
             reject(err);
           })
         } else {
           reject('Job has completed.');
         }
       }).catch(err => {
         reject(err);
       });
     });
   }


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
      key: [user, deliverable]
    };
    let that = this;
    return new Promise<Date>(async (fulfill, reject) => {
      try {
        let view: ViewResponse = await db.view(designName, viewName, params);
        let latestDate: Date = new Date(0);
        if (view.rows.length > 0) {
          latestDate = new Date(+view.rows[0].value)
        }
        fulfill(latestDate);
      } catch(err) {
        reject('Failed to get latest request of user ' + user + ' for deliverable ' + deliverable + '. ' + err);
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
    let designName: string = 'grades';
    let viewName: string = 'byTeamDeliverableCommit';
    let params: QueryParameters = {
      key: [team, deliverable, commit.short],
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
          deliverable: deliverable,
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
        reject('Unable to get test result for ' + team + ' commit ' + commit.short + '. ' + err);
      }
    });
  }

  // private async grade(deliverable: string, privateTests) {
  //   let resultsDB = new Database(this.config.getDBConnection(), 'settings');
  //   let deliverablesDoc = await resultsDB.readRecord('deliverables');
  //   let deliverableRecord: DeliverableRecord = new DeliverableRecord(deliverablesDoc);
  //   let gradeFormula: string = deliverableRecord.item(deliverable).gradeFormula;
  //
  //   let gradeExp: string = gradeFormula.replace(
  //     '<TEST_PERCENTAGE>', privateTests.testStats.passPercent
  //   ).replace(
  //     '<COVERAGE_PERCENTAGE>', privateTests.coverageStats.lines.percentage
  //   );
  //   console.log('gradeExp', gradeExp);
  //   return Promise.resolve(eval(gradeExp))
  // }



  /**
   * Formats the GradeSummary as a Markdown string suitable for display on GitHub.
   *
   * @param gradeSummary
   */
  private formatResult(gradeSummary: GradeSummary): string {
    let preamble: string = this.record.note ? '_' + this.record.note + '_\n\n' : '';
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


  private async store(record: CommitCommentRecord) {
    let db: Database = new Database(this.config.getDBConnection(), 'requests');
    return db.createRecord(record);
  }
}

import restify = require("restify");

import PushController from '../controller/github/PushController';
import {TestJob} from '../controller/TestJobController';
import CommitCommentController from '../controller/github/CommitCommentController';
import ResultRecordController from '../controller/ResultRecordController';
import StaticHtmlController from '../controller/StaticHtmlController';
import ResultRecord, {ResultPayload} from '../model/results/ResultRecord';


// import ResultController from '../controller/ResultController';
import Log from "../Util";
import Server from "./Server";
import TestJobController from '../controller/TestJobController';
import RequestHelper from '../../src/rest/helpers/RequestHelper'

export default class RouteHandler {

  /**
   *  Get the number of jobs currently waiting or paused in the queue.
   */
  public static queueStats(req: restify.Request, res: restify.Response, next: restify.Next) {
    Log.info('RouteHandler::queueStats() - <RCV> Queue stats.');
    try {
      let serverPort: number = RequestHelper.parseServerPort(req);
      let currentCourseNum = RequestHelper.parseCourseNum(serverPort);
      let controller: TestJobController = TestJobController.getInstance(currentCourseNum);
      controller.getStats().then(stats => {
        let lenExpQueue: number = stats[1].waiting + stats[1].paused;
        Log.info('RouteHandler::queueStats() - <200> Number of waiting or paused express jobs: ' + lenExpQueue + '.');
        res.json(200, {body: stats});
      }).catch(err => {
        Log.error('RouteHandler::queueStats() - <400> ERROR getting stats: ' + err);
        res.json(400, {error: err});
      });
    } catch(err) {
      Log.error('RouteHandler::queueStats() - <400> ERROR getting stats: ' + err);
      res.json(400, {error: err});
    }
    return next();
  }


  /**
   * Handles GitHub POSTs, currently:
   *  - commit_comment
   *  - push
   */
  public static postGithubHook(req: restify.Request, res: restify.Response, next: restify.Next) {
    let githubEvent: string = req.header('X-GitHub-Event');
    let body = req.body;
    let team: string = '';
    let serverPort = RequestHelper.parseServerPort(req);
    let currentCourseNum = RequestHelper.parseCourseNum(serverPort);


    try {
      let name: string = body.repository.name;
      team = name.substring(name.indexOf('_')+1);
    } catch(err) {}
    Log.info('RouteHandler::postGithubHook() - <RVD> ['+ team +'] X-GitHub-Event ' + githubEvent + '.');

    // enumerate GitHub event
    switch (githubEvent) {
      case 'ping':req
        Log.info('RouteHandler::postGithubHook() - <200> ['+ team +'] pong.');
        res.json(200, 'pong');
      break;

      case 'commit_comment':
        try {
          let controller: CommitCommentController = new CommitCommentController(currentCourseNum);
          controller.process(body).then(result => {
            Log.info('RouteHandler::commitComment() - <' + result.statusCode + '> ['+ team +'] ' + (result.body || 'NO_BODY'));
            res.json(result.statusCode, result.body);
          }).catch(err => {
            Log.error('RouteHandler::commitComment() - <404> ['+ team +'] ERROR processing commit comment. ' + err);
            res.json(404, 'Failed to process commit comment.');
          });
        } catch(err) {
          Log.error('RouteHandler::commitCOmment() - <404> ['+ team +'] ERROR processing commit comment. ' + err);
          res.json(404, 'Failed to process commit comment');
        }
        break;

      case 'push':
        try {
          let controller: PushController = new PushController(currentCourseNum);
          controller.process(body).then(result => {
            let tests: string[] = result.map(job => {
              let testJob: TestJob = job.data as TestJob;
              return testJob.test.deliverable;
            });
            Log.info('RouteHandler::push() - <202> ['+ team +'] Queued for ' + tests.join(', '));
            res.json(202, {body: 'Commit has been queued for testing against: ' + tests.join(', ')});
          }).catch(err => {
            Log.error('RouteHandler::postGithubHook() - <500> ['+ team +'] ERROR enqueuing commit for testing. ' + err);
            res.json(500, 'Failed to enqueue commit for testing.');
          });
        } catch(err) {
          Log.error('RouteHandler::postGithubHook() - <500> ['+ team +'] ERROR enqueuing commit for testing. ' + err);
          res.json(500, 'Failed to enqueue commit for testing.');
        }
        break;

      default:
        Log.warn('RouteHandler::postGithubHook() - ['+ team +'] Unhandled GitHub event: ' + githubEvent);
    }
    return next();
  }

    /**
   * Handles ResultRecord objects sent from container
   *  - req should container ResultRecord container with payload
   */
  public static resultSubmission(req: restify.Request, res: restify.Response, next: restify.Next) {
    let body = req.body;
    let serverPort = RequestHelper.parseServerPort(req);
    let currentCourseNum = RequestHelper.parseCourseNum(serverPort);
    let controller: ResultRecordController = new ResultRecordController(currentCourseNum, req.body)
    let resultPayload: ResultPayload = req.body as ResultPayload;
    controller.store()
      .then((result) => {
        Log.info('RouteHandler::resultSubmission() SUCCESS Saved result ' + resultPayload.response.commit + ' for ' +
          resultPayload.response.committer);
        res.json(202, { response: result });  
        //      
        return next();        
      })
      .catch((err) => {
        Log.error('RouteHandler::resultSubmission() ERROR saving ResultRecord' + resultPayload.response.commit + ' for ' + 
          resultPayload.response.commitUrl);
        res.json(500, { response: err });
        return next();
      });
  }

      /**
   * Handles StaticHtml Zip files that are sent and included
   * @return object response with success status and HTML static link or error message
   */
  public static staticHtml(req: restify.Request, res: restify.Response, next: restify.Next) {
    let body = req.body;
    let serverPort = RequestHelper.parseServerPort(req);
    let currentCourseNum = RequestHelper.parseCourseNum(serverPort);
    let controller: StaticHtmlController = new StaticHtmlController(req.body);
    controller.extractZipToDir()
      .then((confirmation) => {
        res.json(202, { response: { htmlStaticPath: confirmation } });  
        //      
        return next();        
      })
      .catch((err) => {
        res.json(500, { response: { error: err } });       
        return next();
      });
  }
}

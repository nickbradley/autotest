import restify = require("restify");

import PushController from '../controller/github/PushController';
import {TestJob} from '../Controller/TestJobController';
import CommitCommentController from '../controller/github/CommitCommentController';
import Log from "../Util";
import Server from "./Server";


export default class RouteHandler {

  /**
   * Handles GitHub POSTs, currently:
   *  - commit_comment
   *  - push
   */
  public static postGithubHook(req: restify.Request, res: restify.Response, next: restify.Next) {
    let body = req.body;
    let githubEvent: string = req.header('X-GitHub-Event');
    // enumerate GitHub event
    switch (githubEvent) {
      case 'ping':req
        Log.trace('RouteHandler::postGithubHook() - received ping.');
        res.json(200, 'pong');
      break;

      case 'commit_comment':
        Log.trace('RouteHandler::postGithubHook() - received commit comment.');

        try {
          let controller: CommitCommentController = new CommitCommentController();
          controller.process(body).then(result => {
            res.json(result.statusCode, result.body);
          }).catch(err => {
            Log.error('RouteHandler::postGithubHook() - ERROR processing commit comment. ' + err);
            res.json(404, 'Failed to process commit comment.');
          });
        } catch(err) {
          Log.error('RouteHandler::postGithubHook() - ERROR processing commit comment. ' + err);
          res.json(404, 'Failed to process commit comment');
        }
        break;

      case 'push':
        Log.trace('RouteHandler::postGithubHook() - received push event.');

        try {
          let controller: PushController = new PushController();
          controller.process(body).then(result => {
            let tests: string[] = result.map(job => {
              let testJob: TestJob = job.data as TestJob;
              return testJob.test.name;
            });
            res.json(202, {body: 'Commit has been queued for testing against: ' + tests.join(', ')});
          }).catch(err => {
            Log.error('RouteHandler::postGithubHook() - ERROR enqueuing commit for testing. ' + err);
            res.json(500, 'Failed to enqueue commit for testing.');
          });
        } catch(err) {
          Log.error('RouteHandler::postGithubHook() - ERROR enqueuing commit for testing. ' + err);
          res.json(500, 'Failed to enqueue commit for testing.');
        }
        break;

      default:
        Log.warn('RouteHandler::postGithubHook() - Unhandled GitHub event: ' + githubEvent);
    }
    return next();
  }








  // Notify endpoints

  // // Return list of registered notification addresses
  // public static getHook(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // // Maybe this should be a POST - client won't know what to name (Would they ever want to madify an existing hook?)
  // public static putHook(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   // id must not be null
  //   try {
  //     let id: string = req.params.id;
  //
  //     if (id) {
  //
  //     } else {
  //
  //     }
  //   } catch (err) {
  //     res.json(404, {error: err.message});
  //   }
  //   return next();
  // }
  // public static deleteHook(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  //
  //
  //
  // // Management endpoints
  // public static getDeliverable(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // public static putDeliverable(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // public static deleteDeliverable(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // // public static postDeliverable(req: restify.Request, res: restify.Response, next: restify.Next) {
  // // }
  //
  // public static getTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // public static putTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // public static deleteTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // // public static postTeam(req: restify.Request, res: restify.Response, next: restify.Next) {
  // // }
  //
  // public static getStaff(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // public static putStaff(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // public static deleteStaff(req: restify.Request, res: restify.Response, next: restify.Next) {
  //   return next();
  // }
  // // public static postStaff(req: restify.Request, res: restify.Response, next: restify.Next) {
  // // }






  //  public static postSubmit(req: restify.Request, res: restify.Response, next: restify.Next) {
  //    Log.trace('RouteHandler::postSubmit(..) - params: ' + JSON.stringify(req.params));
  //    try {
   //
  //      if (req.params.zen) {
  //        Log.info("RouteHandler::postSubmit(..) - AutoTest webhook was created on " + req.params.repository.html_url);
  //        res.send(204);
  //      }
  //      else {
  //        let githubUsername: string = settings.githubUser.username;
  //        let githubToken: string = settings.githubUser.token;
  //        let commitComment: GithubCommitComment = TypedJSON.parse(JSON.stringify(req.params), GithubCommitComment);;
  //        let commentURL: string = commitComment.repository.commits_url.replace("{/sha}", "/" + commitComment.comment.commit_id) + "/comments";
  //        console.log(commitComment);
  //        if (SubmissionController.hasMention(commitComment.comment.body)) {
  //          if ("user is registered") {
  //            if ("rate not exceeded") {
  //              let controller: SubmissionController = new SubmissionController({
  //                username: commitComment.comment.user.login,
  //                reponame: commitComment.repository.name,
  //                repoURL: commitComment.repository.html_url.replace("//", "//"+githubUsername+":"+githubToken+"@"),
  //                commentURL: commentURL,
  //                commitSHA: commitComment.comment.commit_id,
  //                body: commitComment.comment.body
  //              });
   //
  //              submissionQueue.add(controller).then((queueLength: number) => {
  //                res.send(202, {body: "Request accepted."});
  //              }).catch((err: Error) => {
  //                // already queued
  //                res.send(429, {err: err.message});
  //              });
  //            } //rate not exceeded
  //            else {
  //              //please wait " + moment.duration(-1*runDiff).humanize() + " before trying again.
  //              SubmissionController.comment("Request cannot be processed: rate limit exceeded.", commentURL)
  //              res.send(429, {err: "Rate limit exceeded."})
  //            }
  //          }  // team registered
  //          else {
  //            SubmissionController.comment("Request cannot be processed: not registered.", commentURL);
  //            res.send(401, {err: "Not registered."});
  //          }
  //        }  // bot mention
  //        else {
  //          res.send(200, {body: "No bot mention. Nothing to do."});
  //        }
  //      }
  //    } catch (err) {
  //      Log.error('RouteHandler::postSubmit(..) - ERROR: ' + err.message);
  //      res.send(400, {err: err.message});
  //    }
  //    return next();
  //  }
}

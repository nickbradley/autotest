let fs = require('fs');

import PostbackController from '../src/controller/github/postbackController';
import TestController from '../src/controller/TestController';
import TestRecord from '../src/model/TestResult';

import {Commit} from '../src/model/github/GithubUtil';
// describe('GitHub Postback Controller', function() {
//   it('should respond with true.', function(done) {
//     this.timeout(5000);
//     try {
//       let hook = 'https://api.github.com/repos/nickbradley/CPSC310submit/commits/a9337108a9590e27b874d5ae29b6c98470ecd485/comments'
//       let msg = 'test message';
//       let controller = new PostbackController(hook);
//       controller.submit(msg).then(done()).catch(err => done(err));
//     } catch(err) {
//       done(err);
//     }
//   });
// });
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


describe('Whatever', function() {
  it('should do stuff correctly', function(done) {
    let content: string = fs.readFileSync('./test/sample/out').toString();

    let buildTagRegex: RegExp = /^<PROJECT_BUILD exitcode=(\d+)>((?!npm)[\s\S]*)<\/PROJECT_BUILD>$/gm
    let buildMsgRegex: RegExp = /^(npm.*)$/gm;
    let matches: string[] = buildTagRegex.exec(content);

    this.buildFailed = (+matches[1] > 0 ? true : false);
    this.buildMsg = matches[2].replace(buildMsgRegex, '').trim();


    console.log("buildFailed=", this.buildFailed, "buildMsg=\n", this.buildMsg);







    // let tagRegExp: RegExp = /^<PROJECT_BUILD exitcode=(\d+)>([\s\S]*)<\/PROJECT_BUILD>$/gm;
    //
    // let matches: string[] = tagRegExp.exec(content);
    // console.log(matches);
    // let buildRegExp: RegExp = /^(?!$)(?!npm)(.*)$/gm;

    //
    // let buildMatches: string[] = buildRegExp.exec(matches[2]);
    // console.log(buildMatches);
    // buildMatches.unshift();
    // let buildMsg = buildMatches.join('\n');
    done();
  });
});


describe('TestController', function() {
  it('should run.', async function() {
    this.timeout(5*60*1000);
    let file: string = fs.readFileSync('./test/sample/mocha.json').toString();

    try {
      //let mocha: any = JSON.parse(file);
      let commit: Commit = new Commit('e7284608f71c79be0f1f02e5019e958f2fb1e147');
      //let controller = new TestController('team86', 'e728460', 'autotest/cpsc310d3-priv');
      //let output = await controller.run()
      //let output = controller.parseStdout(stdout);
      //console.log(output.coverageJson);
      //controller.runNew();
      let model = new TestRecord('team86', 'nbcc', commit);
      await model.generate();
      //model.processMochaJson(file);
      //model.processCoverageTag(content);
      //console.log(model);
      //await model.generate();
      //return Promise.resolve();
      console.log('Check database!');
      await timeout(2*60*1000);
    } catch(err) {
      return Promise.reject(err);
    }
  });

});

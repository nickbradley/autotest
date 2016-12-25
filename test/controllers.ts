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
    let tagRegExp: RegExp = /^<PROJECT_BUILD exitcode=(\d+)>([\s\S]*)<\/PROJECT_BUILD>$/gm;

    let matches: string[] = tagRegExp.exec(content);
    console.log(matches);
    let buildRegExp: RegExp = /^(?!$)(?!npm)(.*)$/gm;


    let buildMatches: string[] = buildRegExp.exec(matches[2]);
    console.log(buildMatches);
    buildMatches.unshift();
    let buildMsg = buildMatches.join('\n');
    done();
  });
});

/*
describe('TestController', function() {
  it('should run.', async function() {
    this.timeout(5*60*1000);
    let file: string = fs.readFileSync('./test/sample/mocha.json').toString();

    let content: string = `

      14) QueryController Should be able to query ROOM EXAMPLE 3:

          AssertionError: expected { render: 'TABLE', result: [ {} ] } to deeply equal { Object (render, result) }
          + expected - actual

           {
             "render": "TABLE"
             "result": [
          -    {}
          +    {
          +      "rooms_fullname": "Chemical and Biological Engineering Building"
          +      "rooms_number": "103"
          +      "rooms_seats": 60
          +    }
          +    {
          +      "rooms_fullname": "Civil and Mechanical Engineering"
          +      "rooms_number": "1206"
          +      "rooms_seats": 26
          +    }
          +    {
          +      "rooms_fullname": "Civil and Mechanical Engineering"
          +      "rooms_number": "1210"
          +      "rooms_seats": 22
          +    }
          +    {
          +      "rooms_fullname": "MacLeod"
          +      "rooms_number": "214"
          +      "rooms_seats": 60
          +    }
          +    {
          +      "rooms_fullname": "MacLeod"
          +      "rooms_number": "220"
          +      "rooms_seats": 40
          +    }
          +    {
          +      "rooms_fullname": "MacLeod"
          +      "rooms_number": "242"
          +      "rooms_seats": 60
          +    }
          +    {
          +      "rooms_fullname": "MacLeod"
          +      "rooms_number": "254"
          +      "rooms_seats": 84
          +    }
             ]
           }

          at Assertion.assertEqual (/deliverable/node_modules/chai/lib/chai/core/assertions.js:485:19)
          at Assertion.ctx.(anonymous function) [as equal] (/deliverable/node_modules/chai/lib/chai/utils/addMethod.js:41:25)
          at Context.<anonymous> (test/QueryControllerSpec.js:1102:36)



    =============================================================================
    Writing coverage object [/cpsc310project/coverage/coverage.json]
    Writing coverage reports at [/cpsc310project/coverage]
    =============================================================================

    =============================== Coverage summary ===============================
    Statements   : 42.95% ( 381/887 )
    Branches     : 33.42% ( 134/401 )
    Functions    : 41.56% ( 32/77 )
    Lines        : 42.95% ( 381/887 )
    ================================================================================

    npm info lifecycle cpsc310project@0.0.1~cover: Failed to exec cover script
    npm ERR! Linux 4.8.13-300.fc25.x86_64
    npm ERR! argv "/usr/local/bin/node" "/usr/local/bin/npm" "run" "cover"`
    // npm ERR! node v6.3.0
    // npm ERR! npm  v3.10.3
    // npm ERR! code ELIFECYCLE
    // npm ERR! cpsc310project@0.0.1 cover: \`istanbul cover _mocha\`
    // npm ERR! Exit status 14
    // npm ERR!
    // npm ERR! Failed at the cpsc310project@0.0.1 cover script 'istanbul cover _mocha'.
    // npm ERR! Make sure you have the latest version of node.js and npm installed.
    // npm ERR! If you do, this is most likely a problem with the cpsc310project package,
    // npm ERR! not with npm itself.
    // npm ERR! Tell the author that this fails on your system:
    // npm ERR!     istanbul cover _mocha
    // npm ERR! You can get information on how to open an issue for this project with:
    // npm ERR!     npm bugs cpsc310project
    // npm ERR! Or if that isn't available, you can get their info via:
    // npm ERR!     npm owner ls cpsc310project
    // npm ERR! There is likely additional logging output above.
    //
    // npm ERR! Please include the following file with any support request:
    // npm ERR!     /cpsc310project/npm-debug.log


    // let stdout = `HEAD is now at e728460... course explorer for d4 with js files?
    // Finished updating repo.
    //
    // <CLIENT_BUILD>
    // npm info it worked if it ends with ok
    // npm info using npm@3.10.3
    // npm info using node@v6.3.0
    // npm info lifecycle cpsc310project@0.0.1~prebuild: cpsc310project@0.0.1
    // npm info lifecycle cpsc310project@0.0.1~build: cpsc310project@0.0.1
    //
    // > cpsc310project@0.0.1 build /cpsc310project
    // > tsc
    //
    // npm info lifecycle cpsc310project@0.0.1~postbuild: cpsc310project@0.0.1
    // npm info ok
    // </CLIENT_BUILD>
    //
    // <TEST_BUILD>
    // npm info it worked if it ends with ok`


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
*/

import Server from '../src/rest/Server';
import Log from "../src/Util";

let frisby = require('icedfrisby');
let fs = require('fs');

let path = "./test/github/";
let file = fs.readFileSync(path + "commit_comment.json");
let commit_comment = JSON.parse(file);

file = fs.readFileSync(path + "header.json");
let headers = JSON.parse(file);

file = fs.readFileSync(path + 'push.json');
let push = JSON.parse(file);

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


describe("REST Interface", function () {

    const URL = 'http://localhost:8080/';
    var server: Server;

this.timeout(25000);
    before(function (done) {
        Log.test("RESTSpec::beforeEach() - start");
        server = new Server();
        server.start().then(function (val: boolean) {
            Log.test("RESTSpec::beforeEach() - started: " + val);
            done();
        }).catch(function (err) {
            Log.error("RESTSpec::beforeEach() - ERROR: " + err);
            done();
        });
    });
    afterEach(async function() {
      await timeout(20000);
    });
    after(async function () {
      // this.timeout(2*60*1000+2000);
      // console.log(' + You have 2 minutes to check the database.');
      // await timeout(2*60*1000);
        server.stop().then(function (val: boolean) {
            Log.test("RESTSpec::afterEach() - closed: " + val);
            return
        }).catch(function (err) {
            Log.error("RESTSpec::afterEach() - ERROR: " + err);
            return
        });
    });


    // //let commitComment =
    // frisby.create("GitHub Commit Comment.")
    //     //.addHeaders(headers)
    //     .addHeader('X-GitHub-Delivery', 'f2d71580-942d-11e6-9949-c1bcfb2d567e')
    //     .addHeader('X-GitHub-Event', 'commit_comment')
    //     .post(URL + "/github", commit_comment, {json: true})
    //     //.inspectRequest('Request: ')
    //     //.inspectStatus('Response status: ')
    //     //.inspectBody('Response body: ')
    //     .expectStatus(200)
    //     .toss();




      frisby.create('GitHub Commit Comment.')
        .addHeader('X-GitHub-Delivery', 'f2d71580-942d-11e6-9949-c1bcfb2d567e')
        .addHeader('X-GitHub-Event', 'commit_comment')
        .post(URL + "/submit", commit_comment, {json: true})
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(404)
        .toss();

      frisby.create('GitHub Push Event.')
        .addHeader('X-GitHub-Delivery', 'f2d71580-942d-11e6-9949-c1bcfb2d567e')
        .addHeader('X-GitHub-Event', 'push')
        .post(URL + "/submit", push, {json: true})
        //.inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(202)
        .toss();

      frisby.create('GitHub Commit Comment.')
        .addHeader('X-GitHub-Delivery', 'f2d71580-942d-11e6-9949-c1bcfb2d567e')
        .addHeader('X-GitHub-Event', 'commit_comment')
        .post(URL + "/submit", commit_comment, {json: true})
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(200)
        .toss();

      frisby.create('GitHub Commit Comment.')
        .addHeader('X-GitHub-Delivery', 'f2d71580-942d-11e6-9949-c1bcfb2d567e')
        .addHeader('X-GitHub-Event', 'commit_comment')
        .post(URL + "/submit", commit_comment, {json: true})
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(429)
        .toss();
});

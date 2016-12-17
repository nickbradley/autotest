import Server from '../src/rest/Server';
import Log from "../src/Util";

let frisby = require('icedfrisby');
let fs = require('fs');

let path = "./test/github/";
let file = fs.readFileSync(path + "commit_comment.json");
let test = JSON.parse(file);

file = fs.readFileSync(path + "header.json");
let headers = JSON.parse(file);

describe("REST Interface", function () {

    const URL = 'http://localhost:4321/';
    var server: Server;


    beforeEach(function (done) {
        Log.test("RESTSpec::beforeEach() - start");
        server = new Server('4321');
        server.start().then(function (val: boolean) {
            Log.test("RESTSpec::beforeEach() - started: " + val);
            done();
        }).catch(function (err) {
            Log.error("RESTSpec::beforeEach() - ERROR: " + err);
            done();
        });
    });

    afterEach(function (done) {
        server.stop().then(function (val: boolean) {
            Log.test("RESTSpec::afterEach() - closed: " + val);
            done();
        }).catch(function (err) {
            Log.error("RESTSpec::afterEach() - ERROR: " + err);
            done();
        });
    });


    //let commitComment =
    frisby.create("GitHub Commit Comment.")
        //.addHeaders(headers)
        .addHeader('X-GitHub-Delivery', 'f2d71580-942d-11e6-9949-c1bcfb2d567e')
        .addHeader('X-GitHub-Event', 'commit_comment')
        .post(URL + "/github", test, {json: true})
        .inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(200)
        .toss();
});

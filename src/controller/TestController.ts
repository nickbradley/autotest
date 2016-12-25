import cp = require('child_process');
import tmp = require('tmp');
import fs = require('fs');
import {IConfig, AppConfig} from '../Config';



export interface ParsedTestOutput {
  clientBuild: string;
  testBuild: string;
  testOutput: string;
  coverageOutput: string;
  testJson: JSON;
  coverageJson: any;
  raw: string;
}


export default class TestController {
  private config: IConfig;
  private team: string;
  private commit: string;
  private testName: string;

  constructor(team: string, commit: string, testName: string) {
    this.config = new AppConfig();
    this.team = team;
    this.commit = commit;
    this.testName = testName;
  }

  public async runNew() {
    let db = require('nano')("http://localhost:5984/results");
    let dir = tmp.dirSync();
    let file: string = './docker/tester/run-test-container.sh';
    let args: string[] = [
      this.config.getGithubToken(),
      this.team,
      this.commit,
      this.testName,
      dir.name
    ];
    let options = {
      encoding: 'utf8'
    }

    await new Promise((fulfill, reject) => {
      cp.execFile(file, args, options, (error, stdout, stderr) => {
        if (error) reject(error);
        // process stdout
        fulfill();
      });
    });

    let zipStream = fs.createReadStream(dir.name + '/coverage.zip');
    zipStream.on('open', () => {
      zipStream.pipe(db.attachment.insert('test', 'coverage.zip', null, 'application/zip'));
    });
    zipStream.on('error', (err) => {
      // handle error
    });
  }



  public async run(): Promise<ParsedTestOutput> {
    let db = require('nano')("http://localhost:5984/results");
    let docName = "test"
    let attachmentName = "stdio.txt"



    let cmd: string = './docker/tester/run-test-container.sh';
    let args: string[] = [
      this.config.getGithubToken(),
      this.team,
      this.commit,
      this.testName
    ];
    let options = {
      stdio: ['ignore', 'pipe', 'pipe', 'pipe']
    }
    console.log("***********");
    return new Promise<ParsedTestOutput>((fulfill, reject) => {
      const test = cp.spawn(cmd, args, options)

      let attStream = db.attachment.insert(docName, attachmentName, null, "application/plain");
      test.stdio[1].pipe(attStream);
      test.stdio[2].pipe(attStream);

      //let zipStream = db.attachment.insert('test', 'coverage.zip', null, "application/zip");
      let zipStream = test.stdio[3];
      zipStream.pipe(process.stdout);
      //test.stdio[3].pipe(zipStream);

      test.stdout.on('data', data => {
        console.log(data.toString());

        //db.attachment.insert(docName, attachmentName, null, "application/plain")
      });
      test.stderr.on('data', data => {
        console.log(data.toString());
      });
      test.on('close', code => {
        console.log(code);
        fulfill();
      });


    //   let options = {
    //     maxBuffer: 5*1024*1024  // 5 MB
    //   }
    //   cp.execFile(cmd, args, options, (err: Error, stdout: string, stderr: string) => {
    //     if (err) {
    //       console.log(stdout);
    //       console.log(stderr);
    //         reject(err);
    //     }
    //
    //     try {
    //       let output: ParsedTestOutput = this.parseStdout(stdout);
    //       fulfill(output);
    //     } catch(err) {
    //       reject(err);
    //     }
    //   });
    });
  }

  public parseStdout(stdout: string): ParsedTestOutput {
    try {
        let clientBuild: string = this.extractFirstTagText('CLIENT_BUILD', stdout);
        let testBuild: string = this.extractFirstTagText('TEST_BUILD', stdout);
        let testOutput: string = this.extractFirstTagText('TEST_OUTPUT', stdout);
        let coverageOutput: string = this.extractFirstTagText('COVERAGE_OUTPUT', stdout);
        //let testJson: JSON = JSON.parse(this.extractFirstTagText('TEST_JSON', stdout));
        let coverageJson: JSON = JSON.parse(this.extractFirstTagText('COVERAGE_JSON', stdout));
        let testJson: JSON;
        //let coverageJson: JSON;
        //let coverageJson = this.extractFirstTagText('COVERAGE_JSON', stdout);
        return {
          clientBuild: clientBuild,
          testBuild: testBuild,
          testOutput: testOutput,
          coverageOutput: coverageOutput,
          testJson: testJson,
          coverageJson: coverageJson,
          raw: stdout
        }
    } catch(err) {
      throw 'Failed to parse stdout text. ' + err;
    }
  }

  public extractFirstTagText(tagName: string, text: string): string {
    let pattern: string = '<'+tagName+'>([\\s\\S]*?)<\\/'+tagName+'>';
    //let pattern: string = '<CLIENT_BUILD>([\s\S]*)<\/CLIENT_BUILD>';
    let regex: RegExp = new RegExp(pattern);
    let matches: string[] = regex.exec(text);

    //console.log('Checking text for tag ' +tagName+'. Using pattern ' + pattern+'.');
    //console.log('Got matches ', matches);
    if (matches) {
      return matches[1];
    }

    throw 'Tag not found.';
    //return '';
  }
}

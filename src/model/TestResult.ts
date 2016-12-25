import cp = require('child_process');
import tmp = require('tmp');
import fs = require('fs');
import {IConfig, AppConfig} from '../Config';

import {Commit} from './github/GithubUtil';
import {CouchDatabase,Database, Record, InsertResponse} from './Database';

interface TestStats {
  passPercent: number;
  passCount: number;
  failCount: number;
  skipCount: number;
  passNames: string[];
  failNames: string[];
  skipNames: string[];
}

interface CoverageStat {
  percentage: number;
  touched: number;
  total: number;
}
interface CoverageStats {
  statements: CoverageStat;
  branches: CoverageStat;
  functions: CoverageStat;
  lines: CoverageStat;
}




interface Deliverable {
  name: string;  // short name: d1-priv
  repo: string;  // full name: cpsc310d1-priv
  visibility: number;
  image: string;
}


// interface ResultRecord {
//   _id: string;
//   _rev: string;
//   team: string;
//   deliverable: Deliverable;
//   stats: ResultStats;
//   buildFailed: boolean;
//   buildMsg: string;
//   testReport: any;
//   coverageReport: any;
//   commit: string;
//   committer: string;
//   timestamp: number;
// }


export default class TestRecord {
  private config: IConfig;

  private stdout: string;
  private coverageZip: Buffer;

  private _id: string;
  private _rev: string;
  private team: string;
  private deliverable: Deliverable;
  private testStats: TestStats;
  private coverageStats: CoverageStats;
  private buildFailed: boolean;
  private buildMsg: string;
  private testReport: any;
  //private coverageReport: any;
  private commit: string;
  private committer: string;
  private timestamp: number;

  constructor(team: string, user: string, commit: Commit) {
    this.config = new AppConfig();

    this.team = team;
    this.deliverable = {
      name: 'cpsc310d3-priv',
      repo: '',
      visibility: 1,
      image: 'autotest/cpsc310d3-priv:latest'
    }
    this.commit = commit.short;
    this.committer = user;
    this.timestamp = +new Date();
    this._id = this.timestamp + '_' + this.team + ':' + this.deliverable.name;
  }

  public async generate() {
    let db = require('nano')("http://localhost:5984/results");
    let tempDir = tmp.dirSync();
    let file: string = './docker/tester/run-test-container.sh';
    let args: string[] = [
      this.config.getGithubToken(),
      this.team,
      this.commit,
      this.deliverable.image,
      tempDir.name
    ];
    let options = {
      encoding: 'utf8',
      maxBuffer: 100*1024*1024
    }

    await new Promise((fulfill, reject) => {
      cp.execFile(file, args, options, (error, stdout, stderr) => {
        if (error) reject(error);
        // fs.writeFile('out', stdout, ()=>{
        //   console.log('output wrtten to file');
        // })
        this.stdout = stdout.toString();
        // console.log(this.stdout);
        // console.log("====================")
        try {
          let tagRegExp: RegExp = /^<PROJECT_BUILD exitcode=(\d+)>([\s\S]*)<\/PROJECT_BUILD>$/gm;
          let matches: string[] = tagRegExp.exec(this.stdout);
          let buildRegExp: RegExp = /^(?!$)(?!npm)(.*)$/gm;

          this.buildFailed = (+matches[1] > 0 ? true : false);
          let buildMatches: string[] = buildRegExp.exec(matches[2]);
          buildMatches.unshift();
          this.buildMsg = buildMatches.join('\n');
          //this.buildMsg = buildRegExp.exec(matches[2])[1];

          console.log("buildFailed=", this.buildFailed, "buildMsg=", this.buildMsg);

          tagRegExp = /^<PROJECT_COVERAGE exitcode=(\d+)>([\s\S]*)<\/PROJECT_COVERAGE>$/gm;
          matches = tagRegExp.exec(this.stdout);
          // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
          // console.log(matches[2])
          this.processCoverageTag(matches[2]);
          fulfill();
        } catch(err) {
          reject(err);
        }
      });
    });
    await new Promise((fulfill, reject) => {
      fs.readFile(tempDir.name + '/mocha.json', 'utf8', (err, data) => {
        if (err) reject(err);
        try {
          this.processMochaJson(data);
          fulfill();
        } catch(err) {
          reject(err);
        }
      });
    });
    await new Promise((fulfill, reject) => {
      fs.readFile(tempDir.name + '/coverage.zip', (err, data) => {
        if (err) reject(err);
        this.coverageZip = data;
        fulfill();
      });
      // let zipStream = fs.createReadStream(tempDir.name + '/coverage.zip');
      // zipStream.on('open', () => {
      //   zipStream.pipe(db.attachment.insert(this._id, 'coverage.zip', null, 'application/zip'));
      //   fulfill();
      // });
      // zipStream.on('error', err => {
      //   reject(err);
      // });
    });

    //let db: Database = new Database(this.config.getDBConnection(), 'requests');
    //return db.insertRecord(record);
    return this.insert(db)
  }







  // public process(chunk: string) {
  //   if (this.final) {
  //     throw 'Stream has been closed.'
  //   }
  //
  //   let tagRegExp: RegExp = /^<(\w+) exitcode=(\d+)>$/gm;
  //   let matches: string[] = tagRegExp.exec(chunk);
  //   let tagName: string = matches[1];
  //   let exitcode: number = +matches[2];
  //   let content: string = chunk.replace('<'+tagName+' exitcode='+exitcode+'>','').replace('</'+tagName+'>', '');
  //
  //   switch (tagName) {
  //     case 'PROJECT_BUILD':
  //       this.projectBuild(content, exitcode);
  //       break;
  //     case 'COVERAGE_JSON':
  //       this.coverageJson(content);
  //       break;
  //     case 'DELIVERABLE_JSON':
  //       this.deliverableJson(content);
  //       break;
  //   }
  // }



  private processProjectBuild(text: string, exitcode: number) {
    let regex: RegExp = /^(?!$)(?!npm)(.*)$/gm;
    let matches: string[] = regex.exec(text);
    console.log(matches);
    this.buildMsg = matches[1];
    this.buildFailed = (exitcode > 0 ? true : false);
  }

  // private coverageJson(text: string) {
  //   let report: any = JSON.parse(text);
  //   this.coverageReport = report;
  // }
  public processMochaJson(text: string) {
    let report: any = JSON.parse(text);
    let passPercent: number = report.stats.passPercent;
    let passCount: number = report.stats.passes;
    let failCount: number = report.stats.failures;
    let skipCount: number = report.stats.skipped;

    let passNames: string[] = report.allTests.filter(test => {
      return test.pass;
    }).map(name => {
      let fullName: string = name.fullTitle;
      return fullName.substring(fullName.indexOf('~')+1, fullName.lastIndexOf('~'));
    });
    let failNames: string[] = report.allTests.filter(test => {
      return test.fail;
    }).map(name => {
      let fullName: string = name.fullTitle;
      return fullName.substring(fullName.indexOf('~')+1, fullName.lastIndexOf('~'));
    });
    let skipNames: string[] = [].concat.apply([], report.suites.suites.filter(suite => {
      return suite.hasSkipped;
    }).map(suite => {
      return suite.skipped.map(skippedTest => {
        let fullName: string = skippedTest.fullTitle;
        return fullName.substring(fullName.indexOf('~')+1, fullName.lastIndexOf('~'));
      });
    }));

    this.testStats = {
      passPercent: passPercent,
      passCount: passCount,
      failCount: failCount,
      skipCount: skipCount,
      passNames: passNames,
      failNames: failNames,
      skipNames: skipNames,
    }
    this.testReport = report;
  }

  public processCoverageTag(content: string) {
    // =============================== Coverage summary ===============================
    // Statements   : 42.95% ( 381/887 )
    // Branches     : 33.42% ( 134/401 )
    // Functions    : 41.56% ( 32/77 )
    // Lines        : 42.95% ( 381/887 )
    // ================================================================================
    let stats: CoverageStat[] = [];

    for (let stat of ['Statements', 'Branches', 'Functions', 'Lines']) {
      let regex: RegExp = new RegExp(stat+'\\s+: ([0-9\\.]+)% \\( (\\d+)\\/(\\d+) \\)','gm');
      let matches: string[] = regex.exec(content);

      let coverStat: CoverageStat = {
        percentage: +matches[1],
        touched: +matches[2],
        total: +matches[3]
      }
      stats.push(coverStat);
    }

    this.coverageStats = {
      statements: stats[0],
      branches: stats[1],
      functions: stats[2],
      lines: stats[3]
    }
  }


  private async insert(db: CouchDatabase): Promise<InsertResponse> {

    let doc = {
      'team': this.team,
      'deliverable': this.deliverable,
      'testStats': this.testStats,
      'coverStats': this.coverageStats,
      'buildFailed': this.buildFailed,
      'buildMsg': this.buildMsg,
      'testReport': this.testReport,
      'commit': this.commit,
      'committer': this.committer,
      'timestamp': this.timestamp
    }

    let attachments = [
      {name: 'stdout.txt', data: this.stdout, content_type: 'application/plain'},
      {name: 'coverage.zip', data: this.coverageZip, content_type: 'application/zip'}
    ]


    let that = this;
    return new Promise<InsertResponse>((fulfill, reject) => {
      db.multipart.insert(doc, attachments, this._id, (err, body) => {
        if (err) reject(err);
        fulfill(body);
      });
    });
  }

}

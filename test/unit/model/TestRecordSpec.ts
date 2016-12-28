import fs = require('fs');

import {Deliverable, ProcessedTag, CoverageStats} from '../../../src/model/results/TestRecord';
import TestRecord from '../../../src/model/results/TestRecord';
import {Commit} from '../../../src/model/GithubUtil';

let testRecord: TestRecord;
describe('TestRecord.ts Unit Tests', () => {
  let stdioPass: string;
  let stdioFail: string;

  before(() => {
    let team: string = 'team86';
    let user: string = 'user';
    let commit: Commit = new Commit('e7284608f71c79be0f1f02e5019e958f2fb1e147');
    let deliverable: Deliverable = {
      name: 'cpsc310d3-priv',
      repo: '',
      visibility: 1,
      image: 'autotest/cpsc310d3-priv:latest'
    }
    testRecord = new TestRecord(team, user, commit, deliverable)
    stdioPass = fs.readFileSync('./test/unit/sample/stdio1.txt').toString();
    stdioFail = fs.readFileSync('./test/unit/sample/stdio2.txt').toString();
  });

  describe('processProjectBuildTag', () => {
    let result: ProcessedTag;

    describe('Passing build tag', () => {
      before(() => {
        try {
          result = testRecord.processProjectBuildTag(stdioPass);
        } catch(err) {
          return err;
        }
      });

      it('should return exit code of 0 (build passed).', () => {
        return result.exitcode == 0;
      });
      it('should return an empty build message.', () => {
        let expectedBuildMsg: string = '> cpsc310project@0.0.1 build /cpsc310project\n> tsc';
        return result.content === expectedBuildMsg;
      });
    });

    describe('Failing build tag', () =>{
      before(() => {
        try {
          result = testRecord.processProjectBuildTag(stdioFail);
        } catch(err) {
          return err;
        }
      });

      it('should return exit code bigger than 0 (build failed).', () => {
        return result.exitcode != 0;
      });
      it('should return an non-empty build message.', () => {
        let expectedBuildMsg: string = `
        > cpsc310project@0.0.1 build /cpsc310project
        > tsc

        ../cpsc310project/src/controller/InsightFacade.ts(97,21): error TS7005: Variable 'x' implicitly has an 'any' type.
        ../cpsc310project/src/controller/ProcessHtml.ts(249,41): error TS7006: Parameter 'res' implicitly has an 'any' type.
        ../cpsc310project/src/controller/ProcessHtml.ts(250,42): error TS7006: Parameter 'chunk' implicitly has an 'any' type.
        `;

        return result.content === expectedBuildMsg;
      })
    });
  });


  describe('processCoverageTag', () => {
    let result: ProcessedTag;

    describe('Successfully run coverage report', () => {
      before(() => {
        try {
          result = testRecord.processCoverageTag(stdioPass);
        } catch (err) {
          return err;
        }
      });
      it('should have exit code 0 (successful).', () => {
        return result.exitcode == 0;
      });
      it('should have a valid coverage summary.', () => {
        let expectedCoverageSummary: CoverageStats = {
          statements: {
            percentage: 42.95,
            touched: 381,
            total: 887
          },
          branches: {
            percentage: 33.42,
            touched: 134,
            total: 401
          },
          functions: {
            percentage: 41.56,
            touched: 32,
            total: 77
          },
          lines: {
            percentage: 42.95,
            touched: 381,
            total: 887
          }
        }
        return result.content === expectedCoverageSummary;
      });
    });

  });
});

import {DatabaseConnector as DB, DBInsertStatus} from '../src/Util';
import {expect, assert} from 'chai';

let nano = require('nano')('http://admin:password@localhost:5984');

describe('DatabaseConnector', function() {
  before(function(done) {
    let promises: any = [];
    promises.push(new Promise((fulfill, reject) => {
      let testdb = nano.db.create('test', err => {
        if (err) {
          reject(err);
        }
        fulfill();
      });
    }));

    promises.push(new Promise((fulfill, reject) => {

      let users = nano.use('_users');
      let user = {id: 'org.couchdb.user:testuser', name: 'testuser', roles: [], type: 'user', password: 'test-password'};
      users.insert(user, 'org.couchdb.user:testuser', err => {
        if (err) {
          reject(err);
        }
        fulfill();
      });
    }));

    Promise.all(promises).then(function () {
      done();
    }).catch(function(err) {
      done();
    })
  });

  it('should list one database call test.', function(done) {
    DB.list().then(function(dblist) {
      expect(dblist.length).to.equal(1);
      expect(dblist[0]).to.equal('test');
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should insert a record into test.', function(done) {
    DB.insert('test', {record:'test content'}).then(function(status: DBInsertStatus) {
      let testdb = nano.use('test');
      testdb.head(status.id, function(err,_,headers) {
        if (err) {
          return done(err);
        }
        done();
      })
    }).catch(err => {
      done(err);
    })
  });
});

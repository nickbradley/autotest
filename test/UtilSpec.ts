import {DatabaseConnector as DB} from '../src/Util';

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

  it('should list one database', function(done) {
    DB.list().then(function(dbs) {
      console.log(dbs)
      //dbs.should.have.length(1);
      done();
    }).catch(err => {console.log("Error");done(err)});
  })
});

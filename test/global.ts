// Setup and teardown for all tests

import cp = require('child_process');
import fs = require('fs');
import glob = require('glob');

let couchdbHandle: string;



before(async function() {
  this.timeout(5000);

  console.log('Global setup');

  try {
    couchdbHandle = await setupCouchdb();
    await insertDocumentsFrom('./test/database');
  } catch(err) {
    throw 'Failed to run global setup. ' + err;
  }
});


after(async function() {
  console.log('Global teardown');

  // Remove CouchDB container if it was started.
  if (couchdbHandle)
    await teardownCouchdb(couchdbHandle);
});


async function setupCouchdb() {
  let cmd: string = 'CONTAINER=$(docker run  -p 5984:5984 -d couchdb) && echo ~${CONTAINER}~\
  && sleep 1 && env $(cat autotest.env | xargs) ./dbconfig.sh';

  return new Promise<string>((fulfill, reject) => {
    cp.exec(cmd, (err, stdout, stderr) => {
      let contId: string;
      let parsedStdout: string[] = stdout.split('~');
      if (parsedStdout.length >= 2) {
        contId = parsedStdout[1];
      }

      console.log(stdout);

      if (err || !contId) {
        reject(err || 'Failed to get container id.');
      }

      fulfill(contId);
    });



  });
}

async function teardownCouchdb(handle: string) {
  try {
    console.log('+ Tearing down CouchDB.');
    let cmd: string = "docker kill " + handle;

    await new Promise((fulfill, reject) => {
      cp.exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(err)
        }
        fulfill();
      });
    });
  } catch(err) {
    throw 'Failed to teardown CouchDB.' + err;
  }
}

async function insertDocumentsFrom(path: string) {
  let promises: Promise<any>[] = [];

  try {
    let files: string[] = await new Promise<string[]>((fulfill, reject) => {
       glob(path + '/**/*.json', (err, files) => {
         err ? reject(err) : fulfill(files);
       });
    });


    await new Promise((fulfill, reject) => {
        let promises: Promise<any>[] = [];
        let address: string = 'http://localhost:5984'
        files.forEach(file => {
          let parts: string[] = file.split('/');
          let dbName: string = parts[parts.length-2];
          let docName: string = parts[parts.length-1].replace('.json', '');
          let doc: JSON = JSON.parse(fs.readFileSync(file).toString());
            console.log('Inserting document ' + docName + ' into ' + dbName + '.');
            promises.push(insertDocument(address, dbName, docName, doc));
        });
        Promise.all(promises).then(val => fulfill()).catch(err => reject(err));
    });
  } catch(err) {
    throw 'Failed to insert documents from specified path. ' + err;
  }
}

async function insertDocument(address: string, dbName: string, docName: string, doc: JSON) {
  let nano = require('nano')(address);
  let db = nano.use(dbName);

  return new Promise((fulfill, reject) => {
    db.insert(doc, docName, (err, body) => {
      err ? reject(err) : fulfill(body);
    })
  });
}

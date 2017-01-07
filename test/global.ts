// Setup and teardown for all tests

import cp = require('child_process');
import fs = require('fs');
import glob = require('glob');

let couchdbHandle: string;
let redisHandle: string;

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


before(async function() {
  this.timeout(10000);

  console.log('Global setup');

  try {
    redisHandle = await setupRedis();
    couchdbHandle = await setupCouchdb();
    await insertDocumentsFrom('./test/database');
  } catch(err) {
    throw 'Failed to run global setup. ' + err;
  }
});


after(async function() {
  console.log('Global teardown');

  this.timeout(2*60*1000+2000);
  console.log(' + You have 2 minutes to check the database.');
  await timeout(2*60*1000);


  // Remove Redis container if it was started.
  if (redisHandle) {
    try {
      await teardownRedis(redisHandle);
    } catch(err) {
      console.log('<E> Problem stopping redis: ', err);
    }
  }
  // Remove CouchDB container if it was started.
  if (couchdbHandle) {
    try {
      await teardownCouchdb(couchdbHandle);
    } catch(err) {
      console.log('<E> Problem stopping couchDB: ', err);
    }
  }
});

async function setupRedis() {
  console.log("+ Setting up redis container.");
  let cmd: string = 'CONTAINER=$( docker run -p 6379:6379 -d redis) && echo ~${CONTAINER}~'
  return new Promise<string>((fulfill, reject) => {
    cp.exec(cmd, (err, stdout, stderr) => {
      let contId: string;
      let parsedStdout: string[] = stdout.split('~');
      if (parsedStdout.length >= 2) {
        contId = parsedStdout[1];
        console.log("  +  Container id: " + contId.substring(0, 6));
      }

      if (err || !contId) {
        reject(err || 'Failed to get container id.');
      }

      fulfill(contId);
    });
  });
}

async function teardownRedis(handle: string) {
  try {
    console.log('+ Tearing down Redis.');
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
    throw 'Failed to teardown Redis.' + err;
  }
}


async function setupCouchdb() {
  console.log("+ Setting up CouchDB container.");
  let cmd: string = 'CONTAINER=$(docker run  -p 11312:5984 -d couchdb) && echo ~${CONTAINER}~\
  && sleep 1 && env $(cat autotest.env | xargs) ./dbconfig.sh';

  return new Promise<string>((fulfill, reject) => {
    cp.exec(cmd, (err, stdout, stderr) => {
      // console.log(stdout);
      // console.log(stderr);

      let contId: string;
      let parsedStdout: string[] = stdout.split('~');
      if (parsedStdout.length >= 2) {
        contId = parsedStdout[1];
        console.log("  + Container id: " + contId.substring(0, 6));
      }

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
        let address: string = 'http://localhost:11312'
        files.forEach(file => {
          let parts: string[] = file.split('/');
          let dbName: string = parts[parts.length-2];
          let docName: string = parts[parts.length-1].replace('.json', '');
          let doc: JSON = JSON.parse(fs.readFileSync(file).toString());
            console.log('  + Inserting document ' + docName + ' into ' + dbName + '.');
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

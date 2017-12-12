/**
 * Created by steca
 */

import Log from '../Util';
import { IConfig, AppConfig } from '../Config';
import mongodb = require('mongodb');

let MongoClient = mongodb.MongoClient;

export class MongoDB {

  private config: IConfig = new AppConfig();
  private username: string;
  private password: string;
  public static conn: Promise<mongodb.Db>;

  // If already inited, returns prior instance
  constructor() {
    this.config = new AppConfig();
    if (!MongoDB.conn) {
      MongoDB.conn = this.initDB();    
    }
  }
  
  async getInstance(): Promise<mongodb.Db> {
    if (!MongoDB.conn) {
      MongoDB.conn = this.initDB();    
      return MongoDB.conn;  
    } else {
      return MongoDB.conn;
    }
  }

  /**
   * Gets MongoDB connection
   */
  async initDB() {
    
    const OPTIONS = { autoReconnect: true };
    const DEBUG_TOGGLE: string = 'debug';

    let that = this;

    return new Promise<mongodb.Db>(function (fulfill, reject) {
      try {
        MongoClient.connect(that.config.getMongoAddress(), OPTIONS, function(err, db) {
          if (err) {
            throw err;
          }
          Log.info(`MongoDB::getDB() Returning DB Connection: ${that.config.getMongoAddress()}`)
          fulfill(db);
        })
      }
      catch (err) {
        Log.error(`MongoDB::getDB() Problem returning DB Connection: ${err}`)
        reject(err);
      }
    });
  }

  /**
   * Queries a collection and returns a single matching result
   */
  async getRecord(collectionName: string, query: object): Promise<any> {
    try {
      return MongoDB.conn.then((db: mongodb.Db) => {
        return db.collection(collectionName)
          .findOne(query)
          .then((result: JSON) => {
            return result;
          });
      });
    }
    catch (err) {
      Log.error(`MongoDB::getRecord() Problem querying ${collectionName}: ${err}`);
    }
  }

    /**
   * Queries a collection and returns a single matching result
   */
  async getLatestRecord(collectionName: string, query: object): Promise<any> {
    return new Promise<any>((fulfill, reject) => {
      try {
        MongoDB.conn.then((db: mongodb.Db) => {
          db.collection(collectionName)
            .findOne(query, {sort: {"$natural": -1}})
            .then((result: JSON) => {
              fulfill(result);
            });
        });
      }
      catch (err) {
        Log.error(`MongoDB::getRecord() Problem querying ${collectionName}: ${err}`);
        reject(err);
      }
    })
  }


  /**
   * Gets all matches of ObjectIds from MongoDB
   * @param collectionName - name of the collection, ie. 'courses'
   * @param query - object of potential match, ie. { program: 'space-exploration' }
   * @param field - The property that is being queried (ie. '_id' field)
   */

    getObjectIds(collectionName: string, field: string, queries: any[]): Promise<any[]> {
      try {
        let query = {};
        query[field] = { "$in" : queries };

        return new Promise<object[]>((fulfill, reject) => {
          MongoDB.conn.then(db => {
            db.collection(collectionName)
              .find(query)
              .toArray((err: Error, results: any[]) => {
                if(err) {
                  throw `Could not find ${JSON.stringify(queries)} under ${collectionName}: ${err}.`
                }
                fulfill(results);
              });
          });
        })
      }
      catch (err) {
        Log.error(`MongoDB::getRecord() Problem querying ${collectionName}: ${err}`);
      }

    }

  /**
   * Queries a collection and returns an array of all subsequent query matches
   * @param collectionName - name of the collection, ie. 'courses'
   * @param query - object of potential match, ie. { program: 'space-exploration' }
   */
  async getRecords(collectionName: string, query: object): Promise<any[]> {
    try {
      return new Promise<any[]>((fulfill, reject) => {
        MongoDB.conn.then((db: mongodb.Db) => {
          db.collection(collectionName)
            .find(query)
            .sort({ _id: -1 })
            .toArray((err: Error, result: any) => {
              if (err) {
                throw err;
              }
              fulfill(result);
            })
        });
      })

    }
    catch (err) {
      Log.error(`MongoDB::getRecords() Problem querying ${collectionName}: ${err}`)
    }
  }

  /**
   * 
   * @param collectionName - name of the collection, ie. 'courses', 'users'
   * @param query - object of potential match, ie. { program: 'space-exploration' }
   *    
   * */
  async getCollection(collectionName: string): Promise<any[]> {
    try {
      return new Promise<JSON[]>((fulfill, reject) => {
        MongoDB.conn.then((db: mongodb.Db) => {
          db.collection(collectionName)
            .find().toArray((err: Error, result: JSON[]) => {
              if (err) {
                throw err;
              }
              fulfill(result);
            });
        });
      });
    }
    catch (err) {
      Log.error(`MongoDB::getCollection() Problem querying ${collectionName}: ${err}`);
    }
  }

  /**
   * 
   * @param collectionName - name of the collection, ie. 'courses', 'users'
   * @param document - object that is being inserted into the database
   *    
   */
  async insertRecord(collectionName: string, document: any): Promise<InsertOneResponse> {
    try {
      return new Promise<InsertOneResponse>((fulfill, reject) => {
        MongoDB.conn.then((db: mongodb.Db) => {
          db.collection(collectionName).insertOne(document, (err, result) => {
            if (err) { throw `InsertRecord() ERROR: ${err}`; };
            Log.info(`MongoDB::insertRecord() Successfully inserted document in ${collectionName}.`);
            fulfill(result);
          });
        });
      });
    }
    catch (err) {
      Log.error(`MongoDB::insertRecord() Problem inserting record: ${err}`);
    }
  }

  
}

export interface MongoServer {

}

// http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#~insertOneWriteOpResult
export interface InsertOneResponse extends mongodb.InsertOneWriteOpResult {

}

// extends MongoDB class instance
export class Database extends MongoDB {
  constructor(){
    super();
  }
}

export default new MongoDB();
/**
 * Collection of logging methods. Useful for making the output easier to read and understand.
 *
 * @param msg
 */
/* tslint:disable:no-console */
export default class Log {

    public static trace(msg: string) {
        console.log("<T> " + new Date().toLocaleString() + ": " + msg);
    }

    public static info(msg: string) {
        console.log("<I> " + new Date().toLocaleString() + ": " + msg);
    }

    public static warn(msg: string) {
        console.error("<W> " + new Date().toLocaleString() + ": " + msg);
    }

    public static error(msg: string) {
        console.error("<E> " + new Date().toLocaleString() + ": " + msg);
    }

    public static test(msg: string) {
        console.log("<X> " + new Date().toLocaleString() + ": " + msg);
    }
}

/**
 * Wraps calls to couchdb, automatically handling authentication. Operations are
 * limited to non-admin read/write of existing DBs.
 */
export class DatabaseConnector {
  private static nano = require('nano')('http://localhost:5984');
  private static username = process.env.DB_APP_USERNAME || 'testuser';
  private static password = 'test-password';


  /**
   * Returns a list of all non-system databases on the couchdb server. System
   * databases are prefixed with an "_".
   */
  public static async list(): Promise<string[]> {
    console.log("****" + process.env.DB_APP_USERNAME);
    await DatabaseConnector.auth();
    return await DatabaseConnector.listDb();
  }

  /**
   * Inserts a record into a database.
   *
   * @param dbname: the name of the database.
   * @param record: the JSON object to insert.
   */
  public static async insert(dbname: string, record: Object): Promise<boolean> {
    await DatabaseConnector.auth();
    return await DatabaseConnector.insertRecord(dbname, record);
  }

  /**
   * Runs a couchdb view and returns the results.
   *
   * @param view: name of view to execute.
   * @param params: view parameters.
   */
  public static async show(view: string, params: Object) {

  }



  private static auth(): Promise<any> {
    var cookies = {};
    let username = DatabaseConnector.username;
    let password = DatabaseConnector.password;
    return new Promise<any>((fulfill, reject) => {
      DatabaseConnector.nano.auth(username, password, (err, body, headers) => {
        if (err) {
          reject(err);
        }

        if (headers && headers['set-cookie']) {
          cookies[username] = headers['set-cookie'];
        }
        fulfill(body);
      });
    })
  }

  private static listDb(): Promise<string[]> {
    return new Promise<string[]>((fulfill, reject) => {
      DatabaseConnector.nano.db.list((err, body) => {
        if (err) {
          reject(err);
        }

        fulfill(body.filter(dbname => {
          return !dbname.startsWith("_");
        }));
      })
    });
  }

  // private static createDb(name: string): Promise<any> {
  //   return new Promise<any>((fulfill,reject) => {
  //     DatabaseConnector.nano.db.create(name, (err, body) => {
  //       if (err)
  //         reject(err);
  //
  //       fulfill(body);
  //     });
  //   });
  // }

  private static insertRecord(dbname: string, record: Object): Promise<any> {
    let db = DatabaseConnector.nano.use(dbname);
    return new Promise<any>((fulfill, reject) => {
      db.insert(record, (err, body) => {
        if (err)
          reject(err);

        fulfill(body);
      });
    });
  }

}

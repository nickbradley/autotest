
export interface DBInsertStatus {
  ok: boolean,
  id: string,
  rev: string
}

/**
 * Wraps calls to couchdb, automatically handling authentication. Operations are
 * limited to non-admin read/write of existing DBs.
 */
export class DatabaseConnector {
  private static nano = require('nano')('http://localhost:5984');
  private static username = process.env.DB_APP_USERNAME || 'testuser';
  private static password = process.env.DB_APP_PASSWORD || 'test-password';





  /**
   * Returns a list of all non-system databases on the couchdb server. System
   * databases are prefixed with an "_".
   */
  public static async list(): Promise<string[]> {
    await DatabaseConnector.auth();
    return await DatabaseConnector.listDb();
  }





  protected static auth(): Promise<any> {
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

  protected static insertRecord(dbname: string, record: Object): Promise<any> {
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




// docs.couchdb.org/en/2.0.0/api/document/common.html?highlight=put
export interface InsertResponse {
  ok: boolean;
  id: string;
  rev: string;
}

// docs.couchdb.org/en/2.0.0/api/server/authn.html?highlight=post
export interface AuthenticationResponse {
  ok: boolean;  // Operation status
  name: string;  // Username
  roles: string[];  // List of user roles
}

// docs.couchdb.org/en/2.0.0/api/ddoc/views.html?highlight=get
export interface QueryParamters {
  conflict?: boolean;  // Includes conflicts information in response. Ignored if "include_docs" isn't true. Default is false.
  descending?: boolean;
  endkey?: JSON;
  endkey_docid?: string;
  group?: boolean;
  group_level?: number;
  include_docs?: boolean;
  attachements?: boolean;
  att_encoding_info?: boolean;
  inclusive_end?: boolean;
  key?: JSON;
  keys?: JSON[];
  limit?: number;
  reduce?: boolean;
  skip?: number;
  sorted?: boolean;
  stale?: string;
  startkey?: JSON;
  startkey_docid?: string;
  start_key_doc_id: string;
  update_seq?: boolean;
}

// docs.couchdb.org/en/2.0.0/api/ddoc/views.html?highlight=get
export interface ViewResponse {
  offset: number;
  total_rows: number;
  update_seq?: number;
}

export default class DatabaseConnection {
  private conn: any;
  private username: string;
  private password: string;
  private auth: string;

  constructor(address: string, username: string, password: string) {
      this.conn = require('nano')(address);
      this.username = username;
      this.password = password;
  }

  public async list(): Promise<string[]> {
    let that = this;
    await this.authenticate();
    return new Promise<string[]>((fulfill, reject) => {
      that.conn.list((err, dblist) => {
        if (err) {
          reject(err);
        }
        fulfill(dblist);
      });
    });
  }

  protected async authenticate(): Promise<AuthenticationResponse> {
    let that = this;
    return new Promise<AuthenticationResponse>((fulfill, reject) => {
      that.conn.auth(that.username, that.password, (err, body, headers) => {
        if (err) {
          reject(err);
        }

        if (headers && headers['set-cookie']) {
          that.auth = headers['set-cookie'];
        }
        fulfill(body);
      });
    });
  }
}

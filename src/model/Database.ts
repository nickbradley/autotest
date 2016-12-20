import Log from '../Util';


export interface CouchServer {
  use(databaseName: string): CouchDatabase;
  list(callback: (error, result) => void): void;
  auth(username: string, password: string, callback: (error, result, headers) => void): void;
}
export interface CouchDatabase {
  insert(doc: Object, params: string | Object, callback: (error, result) => void): void;
  view(designDocumentId: string, viewName: string, params: Object, callback: (error, results) => void): void;
  view(designDocumentId: string, viewName: string, callback: (error, results) => void): void;
  multipart: NanoMultipart;
  attachment: NanoAttachment;
}
export interface NanoMultipart {
  insert(document: Object, attachments: Object[], params: Object, callback: (error, results) => void): void;
  get(documentId: string, params: Object, callback: (error, results) => void): void;
}
export interface NanoAttachment {
  insert(documentId: string, attachmentName: string, attachmentData: any, contentType: string, params: Object, callback: (error, results) => void): void;
  get(documentId: string, attachmentName: string, params: Object, callback: (error, results) => void): void;
}


// docs.couchdb.org/en/2.0.0/api/server/authn.html?highlight=post
export interface AuthenticationResponse {
  ok: boolean;  // Operation status
  name: string;  // Username
  roles: string[];  // List of user roles
}

// docs.couchdb.org/en/2.0.0/api/document/common.html?highlight=put
export interface InsertResponse {
  ok: boolean;
  id: string;
  rev: string;
}


// docs.couchdb.org/en/2.0.0/api/ddoc/views.html?highlight=get
export interface ViewResponse {
  offset: number;
  total_rows: number;
  update_seq?: number;
  rows: any;
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


/**
 * Manage connections to CouchDB server using nano.
 */
export class Connection {
  public dbServer: CouchServer;
  private auth: string;
  private username: string;
  private password: string;

  constructor(address: string, username: string, password: string) {
    this.dbServer = require('nano')(address);
    this.username = username;
    this.password = password;
  }

  /**
   * Return a list of databases excluding system databases (those prefixed with an underscore).
   */
  async list(): Promise<string[]> {
    let that = this;
    await this.authenticate();
    return new Promise<string[]>((fulfill, reject) => {
      that.dbServer.list((err, dblist) => {
        if (err) {
          reject(err);
        }

        fulfill(dblist);
      });
    });
  }

  /**
   * Reauthenticate connection to CouchDB. This should be called before attempting
   * to interact with any databases. By default, the connection uses cookies which
   * expire every 10 minutes, hence the need to call this method frequently.
   */
  async authenticate(): Promise<AuthenticationResponse> {
    let that = this;
    return new Promise<AuthenticationResponse>((fulfill, reject) => {
      that.dbServer.auth(that.username, that.password, (err, body, headers) => {
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

  /**
   * Attach to a specific database.
   *
   * @param dbname
   */
  use(dbname: string): CouchDatabase {
    return this.dbServer.use(dbname);
  }
}

/**
 * Interact with documents in a specific CouchDB database.
 */
export class Database {
  private db: CouchDatabase;
  private conn: Connection;

  constructor(conn: Connection, name: string) {
    try {
      this.db = conn.dbServer.use(name);
      this.conn = conn;
    } catch(err) {
      throw 'Unable to connect to database ' + name + '.\
       Make sure the database exists and is accessible using the credentials\
       provided in the server connection.';
    }

  }

  async insertRecord(r: Record): Promise<InsertResponse> {
    console.log('there');
    try {
    await this.conn.authenticate();
    console.log('here');
    return await r.insert(this.db); } catch (err) {
      console.log('Error', err);
    }
  }

  async view(design: string, name: string, params?: QueryParamters): Promise<ViewResponse> {
    let that = this;
    await this.conn.authenticate();
    return new Promise<ViewResponse>((fulfill, reject) => {
      if (params) {
      that.db.view(design, name, params, (err, result) => {
        err ? reject(err) : fulfill(result);
      });
    } else {
      that.db.view(design, name, (err, result) => {
        err ? reject(err) : fulfill(result);
      })
    }
    });
  }


}


export abstract class Record {
  abstract async insert(db: CouchDatabase): Promise<InsertResponse>;
}

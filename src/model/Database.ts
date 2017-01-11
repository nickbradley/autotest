import Log from '../Util';


export interface CouchServer {
  use(databaseName: string): CouchDatabase;
  auth(username: string, password: string, callback: (error, result, headers) => void): void;
  db: CouchDatabase
}
export interface CouchDatabase {
  get(documentId: string, callback: (error, result) => void): void
  list(callback: (error, result) => void): void;
  insert(doc: Object, params: string | Object, callback: (error, result) => void): void;
  view(designDocumentId: string, viewName: string, params: Object, callback: (error, results) => void): void;
  view(designDocumentId: string, viewName: string, callback: (error, results) => void): void;
  head(documentId: string, callback: (error, result, headers) => void): void;
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
export interface QueryParameters {
  conflict?: boolean;  // Includes conflicts information in response. Ignored if "include_docs" isn't true. Default is false.
  descending?: boolean;
  endkey?: {};
  endkey_docid?: string;
  group?: boolean;
  group_level?: number;
  include_docs?: boolean;
  attachements?: boolean;
  att_encoding_info?: boolean;
  inclusive_end?: boolean;
  key?: {} | string;
  keys?: {}[];
  limit?: number;
  reduce?: boolean;
  skip?: number;
  sorted?: boolean;
  stale?: string;
  startkey?: JSON;
  startkey_docid?: string;
  start_key_doc_id?: string;
  update_seq?: boolean;
}


/**
 * Manage connections to CouchDB server using nano.
 */
export class Connection {
  public dbServer: CouchServer;
  private auth: string;
  private address: string;
  private username: string;
  private password: string;

  constructor(address: string, username: string, password: string) {
    this.dbServer = require('nano')(address);
    this.address = address;
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
      that.dbServer.db.list((err, dblist) => {
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
          that.auth = headers['set-cookie'][0];
        }
        that.dbServer = require('nano')({url: that.address, cookie: that.auth});
        fulfill(body);
      });
    });
  }

  /**
   * Attach to a specific database.
   *
   * @param dbname
   */
  use(dbName: string): CouchDatabase {
    return this.dbServer.use(dbName);
  }
}

/**
 * Interact with documents in a specific CouchDB database.
 */
export class Database {
  private db: CouchDatabase;
  private conn: Connection;
  private name: string;

  constructor(conn: Connection, name: string) {
    try {
      this.db = conn.dbServer.use(name);
      this.conn = conn;
      this.name = name;
    } catch(err) {
      throw 'Unable to connect to database ' + name + '.\
       Make sure the database exists and is accessible using the credentials\
       provided in the server connection.';
    }

  }



  // public async insertRecord(r: Record): Promise<InsertResponse> {
  //   try {
  //     await this.conn.authenticate();
  //     return r.insert(this.db);
  //   } catch (err) {
  //     console.log('Error', err);
  //   }
  // }

  public async createRecord(record: DatabaseRecord): Promise<CreateResponse> {
    try {
      await this.exists();
      await this.conn.authenticate();
      return record.create(this.conn.dbServer.use(this.name));
    } catch(err) {
      throw 'Failed to create record in database. ' + err;
    }
  }
  public async updateRecord(id: string, record: DatabaseRecord): Promise<UpdateResponse> {
    try {
      await this.conn.authenticate();
      return record.update(this.conn.dbServer.use(this.name), id);
    } catch (err) {
      throw 'Failed to update database record "' + id + '". ' + err;
    }
  }

  public async readRecord(id: string): Promise<any> {
    try {
      let that = this;
      await this.conn.authenticate();
      return new Promise<any>((fulfill, reject) => {
        this.conn.dbServer.use(this.name).get(id, (err, body) => {
          if (err) reject(err);
          fulfill(body);
        });
      });
    } catch(err) {
      throw 'Failed to read document "' + id + '" from database "' + this.name + '". ' + err;
    }
  }
  public async deleteRecord(id: string): Promise<boolean> {
    let that = this;
    try {
      await this.conn.authenticate();
      return new Promise<boolean>((fulfill, reject) => {

      });
    } catch(err) {
      throw 'Failed to delete record "' + id + '" from database "' + this.name + '". ' + err;
    }
  }
  public async headRecord(id: string): Promise<HeadResponse> {
    let that = this;
    await this.conn.authenticate();
    try {
      return new Promise<HeadResponse>((fulfill, reject) => {
        this.conn.dbServer.use(this.name).head(id, (err, _, headers) => {
          if (err) reject(err);
          fulfill(headers);
        })
      });
    } catch(err) {
      throw 'Failed to get head of document "' + id + '". ' + err;
    }
  }

  async view(design: string, name: string, params?: QueryParameters): Promise<ViewResponse> {
    let that = this;
    await this.conn.authenticate();
    return new Promise<ViewResponse>((fulfill, reject) => {
      if (params) {
      this.conn.dbServer.use(this.name).view(design, name, params, (err, result) => {
        err ? reject(err) : fulfill(result);
      });
    } else {
      this.conn.dbServer.use(this.name).view(design, name, (err, result) => {
        err ? reject(err) : fulfill(result);
      })
    }
    });
  }

  private async exists(): Promise<boolean> {
    await this.conn.authenticate();
    let dbList: string[] = await this.conn.list();
    let that = this;
    return new Promise<boolean>((fulfill, reject) => {
      if (dbList.includes(that.name)) {
        fulfill(true);
      }
      reject('Unable to connect to database ' + that.name + '.\
       Make sure the database exists and is accessible using the credentials\
       provided in the server connection.');
    });
  }
}

export interface HeadResponse {
  'content-length': number;  // document size
  'rev': string;
}


export interface CreateResponse {
  ok: boolean;
  id: string;
  rev: string;
}
export interface UpdateResponse {

}

interface ReadResponse {

}
interface DeleteResponse {

}
export abstract class DatabaseRecord {
  abstract async create(db: CouchDatabase): Promise<InsertResponse>;
  abstract async update(db: CouchDatabase, rev: string): Promise<InsertResponse>;
  // abstract async read(db: CouchDatabase, id: string): Promise<any>;
  // abstract async delete(db: CouchDatabase, id: string): Promise<DeleteResponse>;

  // abstract async insert(db: CouchDatabase): Promise<InsertResponse>;
}

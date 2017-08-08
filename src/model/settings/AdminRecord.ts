import {DatabaseRecord, CouchDatabase, InsertResponse} from '../Database';
import {GithubUsername, GithubAccount} from '../GithubUtil';

export enum Role {
  Instructor,
  GTA,
  UTA,
  HARDWIRED_DEFAULT
}

export interface Admin {
  firstname: string; // deprecated. Should remove after MongoDB replaces couchdb.
  lastname: string; // deprecated. Should remove after MongoDB replaces couchdb.
  role: Role; // reprecated. Should remove, but add role value later if needed.
  fname: string;
  lname: string;
  username: string;
}

export class AdminRecord {
  private admin: Admin ;
  private firstname: string;
  private lastname: string; // deprecated. Should remove after MongoDB replaces couchdb.
  private role: Role; // reprecated. Should remove, but add role value later if needed.
  private fname: string;
  private lname: string;
  private username: string;

  constructor(admin: Admin) {
    this.firstname = admin.fname;
    this.lastname = admin.lname;
    this.role = Role.HARDWIRED_DEFAULT;
    this.fname = admin.fname;
    this.lname = admin.lname;
    this.username = admin.username;
  }

  public getUsername(): string {
    return this.username;
  }

  public getFirstName(): string {
    return this.fname;
  }

  public getLastName(): string {
    return this.lname;
  }

  public getRole(): Role {
    return this.role;
  }
}

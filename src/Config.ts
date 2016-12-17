import {Connection as DBConn, Database} from "./model/Database";

//http://stackoverflow.com/questions/2503489/design-pattern-for-one-time-loaded-configuration-properties

export interface IConfig {
  getDBConnection(): DBConn;
}

class Config {
  private static instance: Config;
  private DBConn: DBConn;

  private constructor() {
    this.DBConn = new DBConn("http://localhost:5984", "testuser", "test-password");
    console.log(this.DBConn);
  }

  static getInstance() {
    if (!Config.instance) {
      Config.instance = new Config();
    }

    return Config.instance;
  }

  public getDBConnection(): DBConn {
    return this.DBConn;
  }
}

export class AppConfig implements IConfig {
  public getDBConnection(): DBConn {
    return Config.getInstance().getDBConnection();
  }
}


// let dbconn = new Connection("http://localhost:5984", "testuser", "test-password");
// let githubdb = new Database(dbconn, 'github');
// githubdb.insertRecord(new PushRecord());

let env = require('node-env-file');

import {Connection as DBConn, Database} from './model/Database';
import * as Url from 'url';

//http://stackoverflow.com/questions/2503489/design-pattern-for-one-time-loaded-configuration-properties

export interface IConfig {
  getAppPort(): number;
  getDBConnection(): DBConn;
  getRedisAddress(): Url.Url;
  getMentionTag(): string;
  getGithubToken(): string;
  getNodeEnv(): string;
  getSSLKeyPath(): string;
  getSSLCertPath(): string;
  getSSLIntCertPath(): string;
  getMongoAddress(): string;
  getCourseNums(): [number];
  getDebugMode(): boolean;
}

/**
 * Singleton class to store configuration settings.
 */
class Config {
  private static instance: Config;
  private appPort: number;
  private DBConn: DBConn;
  private redisAddress: Url.Url;
  private mentionTag: string;
  private githubToken: string;
  private courses: [number];
  private nodeEnv: string;
  private sslKeyPath: string;
  private sslCertPath: string;
  private sslIntCertPath: string;
  private mongoDB: string;
  private debugMode: boolean;

  private constructor() {
    env('./autotest.env');

    let nodeEnv = process.env.NODE_ENV || 'development';
    let courses = process.env.COURSES.split(" ");
    let appPort = process.env.APP_PORT || 11311;
    let dbInstance = process.env.DB_INSTANCE || 'http://localhost:5984';
    let dbAppUser = process.env.DB_APP_USERNAME;
    let dbAppPass = process.env.DB_APP_PASSWORD;
    let redisAddress = process.env.REDIS_ADDRESS || 'http://localhost:6379';
    let mentionTag = process.env.MENTION_TAG || '@autobot';
    let githubToken = process.env.GITHUB_API_KEY;
    let sslKeyPath = process.env.SSL_KEY_PATH;
    let sslCertPath = process.env.SSL_CERT_PATH;
    let sslIntCertPath = process.env.SSL_INT_CERT_PATH;

    this.courses = courses;
    this.DBConn = new DBConn(dbInstance, dbAppUser, dbAppPass);
    this.redisAddress = Url.parse(redisAddress);
    this.mentionTag = mentionTag;
    this.githubToken = githubToken;
    this.sslKeyPath = sslKeyPath;
    this.sslCertPath = sslCertPath;
    this.sslIntCertPath = sslIntCertPath;

    this.debugMode = true;
    this.mongoDB = process.env.DEV_MONGO_DB_INSTANCE;

    if (nodeEnv == "test") {
      this.mongoDB = process.env.TEST_MONGO_DB_INSTANCE;
    }
    if (nodeEnv == "production") {
      this.mongoDB = process.env.PROD_MONGO_DB_INSTANCE;
      this.debugMode = false;
    }

    // console.log('dbInstance: ', dbInstance);
    // console.log('dbAppUser: ', dbAppUser);
    // console.log('dbAppPass:', dbAppPass);
  }

  static getInstance() {
    if (!Config.instance) {
      Config.instance = new Config();
    }

    return Config.instance;
  }

  public getNodeEnv(): string {
    return this.nodeEnv;
  }

  public getCourseNums(): [number] {
    return this.courses;
  }

  public getSSLKeyPath(): string {
    return this.sslKeyPath;
  }

  public getSSLCertPath(): string {
    return this.sslCertPath;
  }

  public getSSLIntCertPath(): string {
    return this.sslIntCertPath;
  }

  public getAppPort(): number {
    return this.appPort
  }

  public setAppPort(): number {
    return this.appPort
  }

  public getDBConnection(): DBConn {
    return this.DBConn;
  }

  public getMongoAddress(): string {
    return this.mongoDB;
  }

  public getRedisAddress(): Url.Url {
    return this.redisAddress;
  }

  public getMentionTag(): string {
    return this.mentionTag;
  }

  public getGithubToken(): string {
    return this.githubToken;
  }

  public getDebugMode(): boolean {
    return this.debugMode;
  }
}

export class AppConfig implements IConfig {
  public getDebugMode(): boolean {
    return Config.getInstance().getDebugMode();
  }
  public getAppPort(): number {
    return Config.getInstance().getAppPort();
  }
  public getNodeEnv(): string {
    return Config.getInstance().getNodeEnv();
  }
  public getMongoAddress(): string {
    return Config.getInstance().getMongoAddress();
  }
  public getDBConnection(): DBConn {
    return Config.getInstance().getDBConnection();
  }
  public getRedisAddress(): Url.Url {
    return Config.getInstance().getRedisAddress();
  }
  public getMentionTag(): string {
    return Config.getInstance().getMentionTag();
  }
  public getGithubToken(): string {
    return Config.getInstance().getGithubToken();
  }
  public getCourseNums(): [number] {
    return Config.getInstance().getCourseNums();
  }
  public getSSLKeyPath(): string {
    return Config.getInstance().getSSLKeyPath();
  }
  public getSSLCertPath(): string {
    return Config.getInstance().getSSLCertPath();
  }
  public getSSLIntCertPath(): string {
    return Config.getInstance().getSSLIntCertPath();
  }  
}

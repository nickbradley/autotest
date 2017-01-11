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

  private constructor() {
    env('./autotest.env');

    let appPort = process.env.APP_PORT || 11311;
    let dbInstance = process.env.DB_INSTANCE || 'http://localhost:5984';
    let dbAppUser = process.env.DB_APP_USERNAME || 'testuser';
    let dbAppPass = process.env.DB_APP_PASSWORD || 'test-password';
    let redisAddress = process.env.REDIS_ADDRESS || 'http://localhost:6379';
    let mentionTag = process.env.MENTION_TAG || '@cpsc310bot';
    let githubToken = process.env.GITHUB_API_KEY;

    this.appPort = appPort;
    this.DBConn = new DBConn(dbInstance, dbAppUser, dbAppPass);
    this.redisAddress = Url.parse(redisAddress);
    this.mentionTag = mentionTag;
    this.githubToken = githubToken;

    console.log('dbInstance: ', dbInstance);
    console.log('dbAppUser: ', dbAppUser);
    console.log('dbAppPass:', dbAppPass);
  }

  static getInstance() {
    if (!Config.instance) {
      Config.instance = new Config();
    }

    return Config.instance;
  }

  public getAppPort(): number {
    return this.appPort
  }

  public getDBConnection(): DBConn {
    return this.DBConn;
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
}

export class AppConfig implements IConfig {
  public getAppPort(): number {
    return Config.getInstance().getAppPort();
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
}

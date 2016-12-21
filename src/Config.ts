let env = require('node-env-file');

import {Connection as DBConn, Database} from './model/Database';
import TestQueue from './model/TestQueue';

//http://stackoverflow.com/questions/2503489/design-pattern-for-one-time-loaded-configuration-properties

export interface IConfig {
  getDBConnection(): DBConn;
  getTestQueue(): TestQueue;
  getMentionTag(): string;
  getGithubToken(): string;
}

/**
 * Singleton class to store configuration settings.
 */
class Config {
  private static instance: Config;
  private DBConn: DBConn;
  private testQueue: TestQueue;
  private mentionTag: string;
  private githubToken: string;

  private constructor() {
    env('./autotest.env');

    let dbInstance = process.env.DB_INSTANCE || 'http://localhost:5984';
    let dbAppUser = process.env.DB_APP_USERNAME;
    let dbAppPass = process.env.DB_APP_PASSWORD;
    let redisAddress = process.env.REDIS_ADDRESS;
    let mentionTag = process.env.MENTION_TAG || '@cpsc310bot';
    let githubToken = process.env.GITHUB_API_KEY;


    this.DBConn = new DBConn(dbInstance, dbAppUser, dbAppPass);
    this.testQueue = new TestQueue(redisAddress, 'autotest-testQueue')
    this.mentionTag = mentionTag;
    this.githubToken = githubToken;
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

  public getTestQueue(): TestQueue {
    return this.testQueue;
  }

  public getMentionTag(): string {
    return this.mentionTag;
  }

  public getGithubToken(): string {
    return this.githubToken;
  }
}

export class AppConfig implements IConfig {
  public getDBConnection(): DBConn {
    return Config.getInstance().getDBConnection();
  }
  public getTestQueue(): TestQueue {
    return Config.getInstance().getTestQueue();
  }
  public getMentionTag(): string {
    return Config.getInstance().getMentionTag();
  }
  public getGithubToken(): string {
    return Config.getInstance().getGithubToken();
  }
}

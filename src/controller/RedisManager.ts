import RedisClient from "../model/RedisClient";
import {IConfig, AppConfig} from '../Config';

/**
 * Provides access to the redis client via the singleton.
 */
export default class RedisManager {

  private portNum: number;
  private _client: RedisClient;
  
  constructor(portNum: number) {
    let config: IConfig = new AppConfig();
    let redis = config.getRedisAddress();
    this._client = new RedisClient({port: portNum});
  }

  public get client(): RedisClient {
    return this._client;
  }
}

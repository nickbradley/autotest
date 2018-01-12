import * as redis from 'redis';
import Log from "../Util";


/**
 * Exposes part of the node-redis client api. Designed to store objects instead
 * of primitive types.
 *
 * You must call connect() before calling any other methods.  The client is connected
 * and ready to issue commands to Redis once isReady returns true.  Be sure to
 * close the connection by calling disconnect() when you no longer wish to issue
 * commands.
 */
export default class RedisClient {
  private client: redis.RedisClient;
  private options: redis.ClientOpts;
  private _isConnected: boolean = false;
  private _isReady: boolean = false;


  /**
   * Create a client that will connect to the Redis instance specified in the
   * options. You must call connect() before issuing commands.
   *
   * @constructor
   * @param {Redis.ClientOpts} options Options is passed directly to the createClient()
   * method of redis-node. See https://github.com/NodeRedis/node_redis#rediscreateclient.
   */
  constructor(options: redis.ClientOpts) {
    this.options = options;
  }


  /**
   * If true, then the client is ready to issue commands to Redis. If any methods
   * are called before this is true, they will either be queue or dropped if the
   * client hasn't finished connecting.
   */
  public get isReady(): boolean {
    return this._isReady;
  }


  /**
   * Establish a connection to the Redis service specified in options. The promise
   * is settled once the stream is connected to the server.
   *
   * Calling this method multiple times is OK, but it must be called once before
   * calling other methods.
   *
   * @returns {Promise<boolean>}
   */
  public async connect(): Promise<boolean> {
    if (this._isConnected)
      return Promise.resolve(true);

    return new Promise<boolean>((fulfill, reject) => {
      try {
        this.client = redis.createClient(this.options);
        this.client.on('error', (err: string) => {
          Log.error('RedisClient::connect() - ERROR ' + err);
          reject(err);
        });
        this.client.on('ready', () => {
          Log.info('RedisClient::connect() - ready on port ' + this.options.port);
          this._isReady = true;
        });
        this.client.on('connect', () => {
          Log.info('RedisClient::connect() - connected');
          this._isConnected = true;
          // just wait until we have connected: the client will be ready sometime after.
          fulfill(true);
        });
      } catch (err) {
        Log.info('RedisClient::connect() - ERROR ' + err);
        reject(err);
      }
    });
  }


  /**
   * Close the connection to the server. The promise settles when the established
   * Redis server connection has closed.
   *
   * @returns {Promise<boolean>}
   */
  public async disconnect(): Promise<boolean> {
    if (!this._isConnected)
      return Promise.resolve(true);

    return new Promise<boolean>((fulfill, reject) => {
      try {
        this.client.quit();
        this.client.on('end', () => {
          fulfill(true);
        });
      } catch (err) {
        Log.error('RedisClient::disconnect() - ERROR ' + err);
        reject(err);
      }
    });
  }

  /**
   * Assigns the value to the key. If the key exists, its value is overwritten.
   *
   * @param {string} key The new key of the STATE field. ie. INIT, REQUESTED, BUILD_FAILED
   * @param {Object} value The value to associate with the key.
   * @returns {Promise<boolean>}
   */
  public async updateJobState(key: string, newState: string): Promise<boolean> {
    Log.info('RedisClient:: updateJobState() UPDATING ' + key + ' to ' + newState + ' state.');
    let that = this;
    if (!this._isConnected) {
      Log.error('RedisClient::updateJobState() - ERROR Client not connected.');
      throw new Error('Client not connected');
    }
    return new Promise<boolean>((fulfill, reject) => {
      this.client.keys(key, (err: Error, results: any[]) => {
        console.log('redis key results', results);
        if (err) {
          Log.error('RedisClient::updateJobState() - ERROR ' + key + ' not found: ' + err);
          reject(err);
        }
        else {
          for (let result of results) {
                that.client.hget(result, 'data', function(err, jobData) {
                    
                    if (err) reject(err)

                    // PARSE as JSON & Store back in Redis Key
                    let jsonData = JSON.parse(jobData);
                    jsonData.state = 'REQUESTED';
                    jsonData = JSON.stringify(jsonData);

                    that.client.hset(result, 'data', jsonData, function(err, result) {
                      if (err) {
                        Log.error('RedisClient::updateJobState() - ERROR Could not update hSet ' + result + ':' + err);
                        reject(err);
                      } else {
                        fulfill(result);
                      }
                    });
                });
              }
        }
      });
    });
  }


  /**
   * Assigns the value to the key. If the key exists, its value is overwritten.
   *
   * @param {string} key The new key of the STATE field. ie. INIT, REQUESTED, BUILD_FAILED
   * @param {Object} value The value to associate with the key.
   * @returns {Promise<boolean>}
   */
  public async getJobState(key: string): Promise<string> {
    let that = this;
    if (!this._isConnected) {
      Log.error('RedisClient::getJobState() - ERROR Client not connected.');
      throw new Error('Client not connected');
    }
    return new Promise<string>((fulfill, reject) => {
      this.client.keys(key, (err: Error, results: any[]) => {
        console.log('redis key results', results);
        if (err) {
          Log.error('RedisClient::updateJobState() - ERROR ' + key + ' not found: ' + err);
          reject(err);
        }
        else {
          for (let result of results) {
                that.client.hget(result, 'data', function(err, jobData) {
                    
                    if (err) reject(err)

                    // PARSE as JSON & Store back in Redis Key
                    let jsonData = JSON.parse(jobData);
                    fulfill(jsonData.state);
                });
              }
        }
      });
    });
  }

  /**
   * Assigns the value to the key. If the key exists, its value is overwritten.
   *
   * @param {string} key The new key.
   * @param {Object} value The value to associate with the key.
   * @returns {Promise<boolean>}
   */
  public async set(key: string, value: Object): Promise<boolean> {
    if (!this._isConnected) {
      Log.error('RedisClient::set() - ERROR Client not connected.');
      throw new Error('Client not connected');
    }
    return new Promise<boolean>((fulfill, reject) => {
      this.client.hmset(key, value, (err: Error, reply: string) => {
        if (err)
          reject(err);
        else if(reply)
          fulfill(true);
        else
          reject(new Error('Failed to set value of key ' + key));
      });
    });
  }


  /**
   * Returns the value associated with key as a string or object.
   *
   * @param {string} key The key for the value to return.
   * @returns {Promise<any>}
   */
  public async get(key: string): Promise<any> {
    if (!this._isConnected) {
      Log.error('RedisClient::get() - ERROR Client not connected.');
      throw new Error('Client not connected');
    }
    return new Promise<any>((fulfill, reject) => {
      this.client.hgetall(key, (err: Error, reply: string) => {
        if (err)
          reject(err);
        else if (reply)
          fulfill(reply);
        else
          reject('Key ' + key + ' does not exist.');
      });
    });
  }


  /**
   * Deletes the specified key-value pair. If more than one key is given, the number
   * of keys successfully deleted is returned.
   *
   * @param {string|string[]} key The key for the key-value pair to delete.
   * @returns {Promise<number>}
   */
  public async del(key: string | string[]): Promise<number> {
    if (!this._isConnected) {
      Log.error('RedisClient::del() - ERROR Client not connected.');
      throw new Error('Client not connected');
    }
    return new Promise<number>((fulfill, reject) => {
      this.client.del(key, (err: Error, reply: string) => {
        if (err)
          reject(err);
        else if(reply)
          fulfill(+reply);
        else
          reject('Failed to delete key ' + key);
      });
    });
  }


  /**
   * Checks existence of the specified key. If multiple keys are given, then number
   * of keys that exist is returned.
   *
   * @param {string|string[]} key The key to check existence of.
   * @returns {Promise<boolean}
   */
  public async exists(key: string | string[]): Promise<number> {
    if (!this._isConnected) {
      Log.error('RedisClient::exists() - ERROR Client not connected.');
      throw new Error('Client not connected');
    }
    return new Promise<number>((fulfill, reject) => {
      this.client.exists(key, (err: Error, reply: string) => {
        if (err)
          reject(err);
        else
          fulfill(+reply);
      });
    });
  }


}

let https = require('https');
import url = require('url');
import {Url} from 'url';

import {IConfig, AppConfig} from '../../Config';

/**
 * Posts a comment on GitHub.
 */
export default class PostbackController {
  private config: IConfig;
  private reqOptions: any;

  constructor(hook: Url) {
    try {
      this.config = new AppConfig();

      //let hookUrl = url.parse(hook);
      this.reqOptions = {
          host: hook.host,
          port: 443,
          path: hook.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'UBC-CPSC310-AutoTest',
            'Authorization': 'token ' + this.config.getGithubToken()
          }
      }
    } catch(err) {
      throw 'Failed to create PostbackController. ' + err;
    }
  }

  public async submit(msg: string): Promise<number> {
    let body: string = JSON.stringify({body: msg});
    this.reqOptions.headers['Content-Length'] = Buffer.byteLength(body);

    return new Promise<number>((fulfill, reject) => {
      let req = https.request(this.reqOptions, res => {
        // res.on('end', () => {
        //   fulfill(true)
        // });
        fulfill(res.statusCode);
      });
      req.on('error', err => {
        reject(err);
      });
      req.write(body);
      req.end();
    });
  }


}

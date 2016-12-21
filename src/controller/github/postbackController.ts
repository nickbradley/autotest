let https = require('https');
let url = require('url');

import {IConfig, AppConfig} from '../../Config';

/**
 * Posts a comment on GitHub.
 */
export default class PostbackController {
  private config: IConfig;
  private reqOptions: any;

  constructor(hook: string) {
    try {
      this.config = new AppConfig();

      let hookUrl = url.parse(hook);
      this.reqOptions = {
          host: hookUrl.host,
          port: 443,
          path: hookUrl.path,
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

  async submit(msg: string) {
    let body = JSON.stringify({body: msg});
    this.reqOptions.headers['Content-Length'] = Buffer.byteLength(body);

    return new Promise<boolean>((fulfill, reject) => {
      let req = https.request(this.reqOptions, res => {
        res.on('end', () => {
          fulfill(true)
        });
      });
      req.on('error', err => {
        reject(err);
      });
      req.write(body);
      req.end();
    });
  }
}

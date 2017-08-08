/**
 * Created by rtholmes on 2016-06-19.
 */

import Server from './rest/Server';
import Log from './Util';
import { IConfig, AppConfig } from './Config';
import MongoDB from './db/MongoDB';

/**
 * Starts the server; doesn't listen to whether the start was successful.
 */
export class App {

    private config: IConfig = new AppConfig();
    
    public initServer() {
        let courseNums = this.config.getCourseNums();
        Log.info('App::initServer() - start');
        
        for (let i = 0; i < courseNums.length; i++) {
          
          // 1 + because ports under 1000 need 'sudo' priviledges
          // which is a potential security risk
          let portNum = parseInt(" " + 1 + courseNums[i]); 

          // start server
          let s = new Server();
          s.setPort(portNum); 
          s.start().then(function (val: boolean) {
            Log.info("App::initServer() - started: " + val);
          }).catch(function (err: Error) {
            Log.error("App::initServer() - ERROR: " + err.message);
          });
        }
    }
}

// This ends up starting the whole system and listens on a hardcoded port (4321)
Log.info('App - starting');
let app = new App();
app.initServer();

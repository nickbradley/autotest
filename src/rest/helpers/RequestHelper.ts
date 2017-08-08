import restify = require('restify');

const PORT_PREFIX = 1;

/**
 * This holds the logic to find the current server port that is running 
 * on a request, and parse the portNum into a courseNum.
 */
export default class PortHelper {

  public static parseServerPort(req: restify.Request): number {
    let serverPort = req.headers.host.toString().split(":")[1];
    return serverPort;
  }

  public static parseCourseNum(portNum: number): number {
    let courseNum = parseInt(portNum.toString().substring(PORT_PREFIX));
    return courseNum;
  }

}

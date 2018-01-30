export class RedisUtil {

  constructor() {
  }

  public static getRedisPort(courseNum: number): number {
    // ALL Redis Ports start with 7 append courseNum, ie . 7310, 7210
    const PORT_PREFIX = 7;
    return parseInt(PORT_PREFIX.toString() + String(courseNum));
  }

}


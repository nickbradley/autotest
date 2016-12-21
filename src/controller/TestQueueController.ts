import {IConfig, AppConfig} from '../Config';

export default class TestQueueController {
  private config: IConfig;
  private queue;

  constructor() {
    this.config = new AppConfig();
    this.queue = this.config.getTestQueue();
  }


}

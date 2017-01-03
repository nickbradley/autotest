import PushController from '../src/controller/github/PushController';
import TestJobController from '../src/controller/TestJobController';
import fs = require('fs');

let data = JSON.parse(fs.readFileSync('./test/github/push.json').toString());

let jobQueueController: TestJobController = TestJobController.getInstance();

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


describe('Push Controller', function() {
  let controller: PushController;
  before(function() {
    controller = new PushController();
  });
  after(async function() {

    await jobQueueController.close();
  });
  it('should process.', async function() {
    this.timeout(4*60*1000);
    let result = await controller.process(data);
    // console.log('****************************************');
    // console.log(result);
    do {
      await timeout(100);
    } while(await jobQueueController.count() > 0)
    await timeout(2*60*1000);
  });
});

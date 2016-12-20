import PostbackController from '../src/controller/github/postbackController';

describe('GitHub Postback Controller', function() {
  it('should respond with true.', function(done) {
    this.timeout(5000);
    try {
      //"https://api.github.com/repos/CS310-2016Fall/cpsc310project_team9/commits{/sha}",
      let hook = 'https://api.github.com/repos/nickbradley/CPSC310submit/commits/a9337108a9590e27b874d5ae29b6c98470ecd485/comments'
      //let hook = 'https://api.github.com/repos/CS310-2016Fall/cpsc310project_rtholmes/commits/21ef81dbee522c95605d21d7cfa5d82a855c2314/comments'
      let msg = 'test message';
      let controller = new PostbackController(hook);
      controller.submit(msg).then(done()).catch(err => done(err));
    } catch(err) {
      done(err);
    }
  });
});

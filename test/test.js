const assert = require('assert');

const t = require('../index');
const apiKey = require('./auth.json').apiKey;
const fs = require('fs');
const path = require('path');
const daskeyboardApplet = require('daskeyboard-applet')


describe('processProjectsResponse', () => {
  it('should return 2 options', async function () {
    const fakeResponse = fs.readFileSync(path.resolve('test/test-projects-response.json'));
    return t.processProjectsResponse(JSON.parse(fakeResponse)).then(options => {
      assert.ok(options);
      assert.equal(2, options.length);
    }).catch(err => assert.fail(err));
  });
});


describe('CircleCIBuildInfo', () => {

  describe('#run()', () => {
    it('should run correctly', async function () {
      return buildApp().then((signal) => {
        assert.ok(signal);
      }).catch((error) => {
        assert.fail(error)
      });
    });

    it('should get a green SET_COLOR signal for build passed', async function () {
      return buildAppWithCustomBuildPassed().then((signal) => {
        return signal.run().then(signal => {
          assert.ok(signal);
          assert.equal('#00FF00', signal.points[0][0].color);
          assert.equal(daskeyboardApplet.Effects.SET_COLOR, signal.points[0][0].effect);
        }).catch(err => assert.fail(err));
      }).catch(err => assert.fail(err));
    });

    it('should get a red BLINK signal for build failed', async function () {
      return buildAppWithCustomBuildFailed().then((signal) => {
        return signal.run().then(signal => {
          assert.ok(signal);
          assert.equal('#FF0000', signal.points[0][0].color);
          assert.equal(daskeyboardApplet.Effects.BLINK, signal.points[0][0].effect);
        }).catch(err => assert.fail(err));
      }).catch(err => assert.fail(err));
    });

    it('should get a blue solid signal for build canceled', async function () {
      return buildAppWithCustomBuildCanceled().then((signal) => {
        return signal.run().then(signal => {
          assert.ok(signal);
          assert.equal('#0000FF', signal.points[0][0].color);
          assert.equal(daskeyboardApplet.Effects.SET_COLOR, signal.points[0][0].effect);
        }).catch(err => assert.fail(err));
      }).catch(err => assert.fail(err));
    })
  });
});

async function buildApp() {
  let app = new t.CircleCIBuildInfo();
  return app.processConfig({
    authorization: {
      apiKey: apiKey
    }
  }).then(() => {
    return app;
  });
}

async function buildAppWithCustomBuildPassed() {
  let app = new t.CircleCIBuildInfo();
  app.getBuilds = async function () {
    return new Promise((resolve, reject) => {
      try {
        const fakeResponse = fs.readFileSync(path.resolve('test/test-builds-response-passed.json'));
        resolve(JSON.parse(fakeResponse));
      } catch (err) {
        reject(err);
      }
    });
  }
  return app.processConfig({
    authorization: {
      apiKey: apiKey
    },
    applet: {
      user: {
        vcs: 'github',
        username: 'brandonschabell',
        project: 'daskeyboard-applet-circleci'
      }
    }
  }).then(() => {
    return app;
  });
}

async function buildAppWithCustomBuildFailed() {
  let app = new t.CircleCIBuildInfo();
  app.getBuilds = async function () {
    return new Promise((resolve, reject) => {
      try {
        const fakeResponse = fs.readFileSync(path.resolve('test/test-builds-response-failed.json'));
        resolve(JSON.parse(fakeResponse));
      } catch (err) {
        reject(err);
      }
    });
  }
  return app.processConfig({
    authorization: {
      apiKey: apiKey
    },
    applet: {
      user: {
        vcs: 'github',
        username: 'brandonschabell',
        project: 'daskeyboard-applet-circleci'
      }
    }
  }).then(() => {
    return app;
  });
}

async function buildAppWithCustomBuildCanceled() {
  let app = new t.CircleCIBuildInfo();
  app.getBuilds = async function () {
    return new Promise((resolve, reject) => {
      try {
        const fakeResponse = fs.readFileSync(path.resolve('test/test-builds-response-canceled.json'));
        resolve(JSON.parse(fakeResponse));
      } catch (err) {
        reject(err);
      }
    });
  }
  return app.processConfig({
    authorization: {
      apiKey: apiKey
    },
    applet: {
      user: {
        vcs: 'github',
        username: 'brandonschabell',
        project: 'daskeyboard-applet-circleci'
      }
    }
  }).then(() => {
    return app;
  });
}
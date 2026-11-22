const BasaltDetector = require('./BasaltDetector');
const BasaltInstaller = require('./BasaltInstaller');
const BasaltLaunchPlanner = require('./BasaltLaunchPlanner');

class BasaltRuntimeHooks {
  static hooks() {
    return {
      detect: (args) => BasaltDetector.detect(args),
      install: (args) => BasaltInstaller.install(args),
      planLaunch: (args) => BasaltLaunchPlanner.plan(args),
    };
  }
}

module.exports = BasaltRuntimeHooks;

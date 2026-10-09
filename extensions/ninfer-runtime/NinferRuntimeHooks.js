const NinferDetector = require('./NinferDetector');
const NinferInstaller = require('./NinferInstaller');
const NinferLaunchPlanner = require('./NinferLaunchPlanner');
const NinferUninstaller = require('./NinferUninstaller');

class NinferRuntimeHooks {
  static hooks() {
    return {
      detect: (args) => NinferDetector.detect(args),
      install: (args) => NinferInstaller.install(args),
      uninstall: (args) => NinferUninstaller.uninstall(args),
      planLaunch: (args) => NinferLaunchPlanner.plan(args),
    };
  }
}

module.exports = NinferRuntimeHooks;

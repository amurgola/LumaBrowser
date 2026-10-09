const path = require('path');
const AppPaths = require('../../shared/AppPaths');

class AppOwnedDir {
  static resolve(subdir) {
    if (process.env.JEST_WORKER_ID) return null;
    try {
      return path.join(AppPaths.appBaseDir(), subdir);
    } catch (_) {
      return null;
    }
  }
}

module.exports = AppOwnedDir;

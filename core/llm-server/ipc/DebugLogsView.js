const DebugLog = require('../../DebugLog');

class DebugLogsView {
  static read({ argv = process.argv, app = null, log = DebugLog } = {}) {
    const isDev = argv.includes('--dev') || !!(app && !app.isPackaged);
    return { isDev, lines: isDev ? log.dump() : [] };
  }
}

module.exports = DebugLogsView;

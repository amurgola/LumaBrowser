class TabConsoleLog {
  static LIMIT = 100;
  static NUMERIC_LEVELS = { 0: 'verbose', 1: 'info', 2: 'warning', 3: 'error' };

  static add(entry, level, message, source, line) {
    if (!entry) return;
    entry.consoleLogs.push({ level, message, source, line, timestamp: new Date().toISOString() });
    if (entry.consoleLogs.length > TabConsoleLog.LIMIT) entry.consoleLogs.shift();
  }

  static list(entry, options = {}) {
    if (!entry) return [];
    if (options.level === undefined) return entry.consoleLogs.slice();
    return entry.consoleLogs.filter((log) => TabConsoleLog._matches(log, options.level));
  }

  static _matches(log, level) {
    return log.level === level || TabConsoleLog.NUMERIC_LEVELS[log.level] === level;
  }
}

module.exports = TabConsoleLog;

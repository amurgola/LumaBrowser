class SmokeConsole {
  static MAX_ERRORS = 30;
  static MAX_LINES = 80;
  static LEVELS = ['debug', 'log', 'warn', 'error'];

  constructor() {
    this.errors = [];
    this.lines = [];
  }

  attach(webContents) {
    webContents.on('console-message', (...args) => this.record(...args));
  }

  record(...args) {
    const { level, message, line, sourceId } = SmokeConsole._normalize(args);
    const text = String(message || '').slice(0, 500);
    if ((level === 3 || level === 'error') && this.errors.length < SmokeConsole.MAX_ERRORS) {
      this.errors.push({ message: text, line: line || 0, source: String(sourceId || '') });
    }
    if (this.lines.length < SmokeConsole.MAX_LINES) this.lines.push({ level: SmokeConsole._levelName(level), message: text });
  }

  static _normalize(args) {
    if (args[1] && typeof args[1] === 'object') {
      const { level, message, lineNumber, sourceId } = args[1];
      return { level, message, line: lineNumber, sourceId };
    }
    const [, level, message, line, sourceId] = args;
    return { level, message, line, sourceId };
  }

  static _levelName(level) {
    return typeof level === 'number' ? SmokeConsole.LEVELS[level] || String(level) : String(level);
  }
}

module.exports = SmokeConsole;

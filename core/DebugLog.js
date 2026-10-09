class DebugLog {
  static MAX_LINES = 1000;
  static MAX_LINE_CHARS = 2000;
  static LEVELS = ['log', 'warn', 'error'];

  static _lines = [];
  static _tappedConsoles = new WeakSet();

  static install(target = console) {
    if (DebugLog._tappedConsoles.has(target)) return;
    DebugLog._tappedConsoles.add(target);
    for (const level of DebugLog.LEVELS) DebugLog._tapLevel(target, level);
  }

  static isInstalled(target = console) {
    return DebugLog._tappedConsoles.has(target);
  }

  static dump() {
    return DebugLog._lines.slice();
  }

  static clear() {
    DebugLog._lines.length = 0;
  }

  static _tapLevel(target, level) {
    const original = target[level].bind(target);
    target[level] = (...args) => {
      DebugLog._record(level, args);
      original(...args);
    };
  }

  static _record(level, args) {
    try {
      const line = `[${level}] ${args.map(DebugLog._stringify).join(' ')}`;
      DebugLog._lines.push(line.slice(0, DebugLog.MAX_LINE_CHARS));
      DebugLog._trimToCapacity();
    } catch (_) {
    }
  }

  static _stringify(value) {
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch (_) { return String(value); }
  }

  static _trimToCapacity() {
    const overflow = DebugLog._lines.length - DebugLog.MAX_LINES;
    if (overflow > 0) DebugLog._lines.splice(0, overflow);
  }
}

module.exports = DebugLog;

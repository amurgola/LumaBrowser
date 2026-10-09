const fs = require('fs');
const path = require('path');

class CrashTraceRunLogs {
  static MAX_RUN_LOGS = 40;
  static ABNORMAL_TAIL_LINES = 80;
  static DUMP_LOOKBACK_MS = 5 * 60 * 1000;
  static SUMMARY_FILE = 'last-abnormal.txt';
  static NO_DUMP_NOTE = 'no minidump in Crashpad/reports: a native crash would have left one, so this was most likely '
    + 'an external kill (IDE stop button, Task Manager, taskkill) or a power loss rather than a crash';

  static list(dir) {
    let names = [];
    try { names = fs.readdirSync(dir); } catch (_) {}
    return names.filter((n) => /^run-.*\.log$/.test(n)).sort();
  }

  static prune(dir, keep = CrashTraceRunLogs.MAX_RUN_LOGS) {
    const logs = CrashTraceRunLogs.list(dir);
    for (const name of logs.slice(0, Math.max(0, logs.length - keep))) {
      try { fs.unlinkSync(path.join(dir, name)); } catch (_) {}
    }
  }

  static reviewPrevious(dir, currentFile, crashDumpsDir) {
    const file = CrashTraceRunLogs._previousLog(dir, currentFile);
    if (!file) return null;
    const log = CrashTraceRunLogs._read(file);
    if (!log) return null;
    if (log.lines.some((l) => / END /.test(l))) return { file, abnormal: false };
    const dumps = CrashTraceRunLogs._dumpsSince(crashDumpsDir, log.mtime - CrashTraceRunLogs.DUMP_LOOKBACK_MS);
    const lastEvent = CrashTraceRunLogs._lastEvent(log.lines);
    const summary = CrashTraceRunLogs._summary(file, log.lines, lastEvent, dumps);
    CrashTraceRunLogs._publish(dir, summary);
    return { file, abnormal: true, lastEvent, dumps };
  }

  static _previousLog(dir, currentFile) {
    const logs = CrashTraceRunLogs.list(dir).filter((n) => n !== path.basename(currentFile));
    const prev = logs[logs.length - 1];
    return prev ? path.join(dir, prev) : null;
  }

  static _read(file) {
    try {
      return { lines: fs.readFileSync(file, 'utf8').split('\n').filter(Boolean), mtime: fs.statSync(file).mtimeMs };
    } catch (_) {
      return null;
    }
  }

  static _lastEvent(lines) {
    return [...lines].reverse().find((l) => !/ hb( |$)/.test(l)) || '(none)';
  }

  static _dumpsSince(crashDumpsDir, sinceMs) {
    const out = [];
    try {
      const reports = path.join(crashDumpsDir, 'reports');
      for (const name of fs.readdirSync(reports)) {
        if (!/\.dmp$/i.test(name)) continue;
        const full = path.join(reports, name);
        if (fs.statSync(full).mtimeMs >= sinceMs) out.push(full);
      }
    } catch (_) {}
    return out;
  }

  static _summary(file, lines, lastEvent, dumps) {
    const tail = lines.slice(-CrashTraceRunLogs.ABNORMAL_TAIL_LINES);
    return [
      `previous run ${path.basename(file)} has no END line (process died without a quit path, or is still running)`,
      `last non-heartbeat event: ${lastEvent}`,
      `last line: ${lines[lines.length - 1] || '(empty)'}`,
      dumps.length ? `minidumps written around that time:\n  ${dumps.join('\n  ')}` : CrashTraceRunLogs.NO_DUMP_NOTE,
      '',
      `--- last ${tail.length} lines of ${file} ---`,
      ...tail,
    ].join('\n');
  }

  static _publish(dir, summary) {
    const summaryPath = path.join(dir, CrashTraceRunLogs.SUMMARY_FILE);
    try { fs.writeFileSync(summaryPath, `${new Date().toISOString()}\n${summary}\n`); } catch (_) {}
    console.warn(`[crash-trace] ${summary.split('\n').slice(0, 4).join('\n[crash-trace] ')}\n[crash-trace] full tail: ${summaryPath}`);
  }
}

module.exports = CrashTraceRunLogs;

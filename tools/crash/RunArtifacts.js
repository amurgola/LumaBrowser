const fs = require('fs');
const path = require('path');

class RunArtifacts {
  static CLOCK_SLACK_MS = 1000;

  constructor({ traceDir, reportsDir }) {
    this._traceDir = traceDir;
    this._reportsDir = reportsDir;
  }

  findTraceLog(pid, sinceMs) {
    const logs = this._recentFiles(this._traceDir, (n) => n.endsWith(`-${pid}.log`), sinceMs);
    return logs.sort().pop() || null;
  }

  dumpsSince(sinceMs) {
    return this._recentFiles(this._reportsDir, (n) => /\.dmp$/i.test(n), sinceMs);
  }

  static readLines(file) {
    try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean); } catch (_) { return []; }
  }

  static lastEvent(lines) {
    return [...lines].reverse().find((l) => !/ hb( |$)/.test(l)) || '(none)';
  }

  static hasEnd(lines) {
    return lines.some((l) => / END /.test(l));
  }

  static verdict({ code, hung, lines }) {
    if (hung) return 'HUNG';
    if (code === 0 && lines.some((l) => / END .*clean=true/.test(l))) return 'clean';
    return 'CRASH';
  }

  _recentFiles(dir, accept, sinceMs) {
    let names;
    try { names = fs.readdirSync(dir); } catch (_) { return []; }
    return names.filter(accept)
      .map((n) => path.join(dir, n))
      .filter((f) => this._modifiedSince(f, sinceMs));
  }

  _modifiedSince(file, sinceMs) {
    try { return fs.statSync(file).mtimeMs >= sinceMs - RunArtifacts.CLOCK_SLACK_MS; } catch (_) { return false; }
  }
}

module.exports = RunArtifacts;

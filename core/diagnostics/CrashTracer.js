const fs = require('fs');
const path = require('path');
const CrashTraceJournal = require('./CrashTraceJournal');
const CrashTraceFormat = require('./CrashTraceFormat');
const CrashTraceRunLogs = require('./CrashTraceRunLogs');
const CrashTraceHeartbeat = require('./CrashTraceHeartbeat');
const CrashTraceWiring = require('./CrashTraceWiring');

class CrashTracer {
  static DIR_NAME = 'crash-trace';
  static AUTO_QUIT_ENV = 'LUMA_AUTO_QUIT_MS';
  static MARK_ANNOTATION_MAX = 120;
  static END_MARK_MAX = 200;

  static _shared = null;

  constructor({ app = null, crashReporter = null, proc = process } = {}) {
    this._app = app;
    this._crashReporter = crashReporter;
    this._proc = proc;
    this._journal = null;
    this._dir = null;
    this._start = 0;
    this._lastMark = '';
    this._quitRequested = false;
    this._reporterStarted = false;
    this._heartbeat = null;
    this._previous = null;
  }

  static shared() {
    if (!CrashTracer._shared) CrashTracer._shared = new CrashTracer(CrashTracer._electronParts());
    return CrashTracer._shared;
  }

  static install() { return CrashTracer.shared().install(); }

  static mark(label, extra) { CrashTracer.shared().mark(label, extra); }

  static getLogPath() { return CrashTracer.shared().getLogPath(); }

  static getDir() { return CrashTracer.shared().getDir(); }

  static getPreviousRunReview() { return CrashTracer.shared().getPreviousRunReview(); }

  install() {
    if (this._journal || !this._app) return this;
    if (!this._openJournal()) return this;
    CrashTraceRunLogs.prune(this._dir);
    this.write(this._startLine());
    this._previous = CrashTraceRunLogs.reviewPrevious(this._dir, this._journal.file, this._crashDumpsDir());
    this._startCrashReporter();
    new CrashTraceWiring(this, this._app, this._proc).install();
    this._startHeartbeat();
    this._scheduleAutoQuit();
    return this;
  }

  mark(label, extra) {
    if (!this._journal) return;
    const line = `${label}${CrashTraceFormat.extra(extra)}`;
    this.write(line);
    this._lastMark = line;
    this._annotateLastMark(line);
  }

  getLogPath() {
    return this._journal ? this._journal.file : null;
  }

  getDir() {
    return this._journal ? this._dir : null;
  }

  getPreviousRunReview() {
    return this._journal ? this._previous : null;
  }

  write(line) {
    if (this._journal) this._journal.write(line);
  }

  noteQuitRequested() {
    this._quitRequested = true;
  }

  end(detail) {
    if (!this._journal || this._journal.closed) return;
    this.write(`END ${detail} clean=${this._quitRequested} lastMark=${CrashTraceFormat.short(this._lastMark, CrashTracer.END_MARK_MAX)}`);
    this._journal.close();
    if (this._heartbeat) this._heartbeat.stop();
  }

  _openJournal() {
    try {
      this._dir = path.join(this._app.getPath('userData'), CrashTracer.DIR_NAME);
      fs.mkdirSync(this._dir, { recursive: true });
    } catch (_) {
      return false;
    }
    const start = Date.now();
    const file = path.join(this._dir, `run-${new Date(start).toISOString().replace(/[:.]/g, '-')}-${this._proc.pid}.log`);
    this._journal = CrashTraceJournal.open(file, start);
    this._start = start;
    return !!this._journal;
  }

  _startLine() {
    const p = this._proc;
    return `START pid=${p.pid} electron=${p.versions.electron} chrome=${p.versions.chrome} `
      + `node=${p.versions.node} platform=${p.platform} argv=${JSON.stringify(p.argv.slice(1))}`;
  }

  _crashDumpsDir() {
    try { return this._app.getPath('crashDumps'); } catch (_) { return ''; }
  }

  _startCrashReporter() {
    const reporter = this._crashReporter;
    if (!reporter || typeof reporter.start !== 'function') return;
    try {
      reporter.start({
        productName: 'LumaBrowser',
        companyName: 'LumaByte',
        submitURL: '',
        uploadToServer: false,
        compress: false,
        extra: { run_log: path.basename(this._journal.file) },
      });
      this._reporterStarted = true;
      this.write(`crashReporter started dumps=${this._crashDumpsDir()}`);
    } catch (err) {
      this.write(`crashReporter start FAILED: ${err && err.message}`);
    }
  }

  _annotateLastMark(line) {
    if (!this._reporterStarted) return;
    try { this._crashReporter.addExtraParameter('last_mark', CrashTraceFormat.short(line, CrashTracer.MARK_ANNOTATION_MAX)); } catch (_) {}
  }

  _startHeartbeat() {
    this._heartbeat = new CrashTraceHeartbeat((line) => this.write(line), this._start, this._proc);
    this._heartbeat.start();
  }

  _scheduleAutoQuit() {
    const ms = Number(this._proc.env[CrashTracer.AUTO_QUIT_ENV]);
    if (!(ms > 0)) return;
    this.write(`harness: ${CrashTracer.AUTO_QUIT_ENV}=${ms}: will app.quit() ${ms}ms after ready`);
    this._app.whenReady().then(() => {
      const timer = setTimeout(() => { this.mark('harness:auto-quit'); this._app.quit(); }, ms);
      timer.unref?.();
    });
  }

  static _electronParts() {
    let electron = null;
    try { electron = require('electron'); } catch (_) {}
    if (!electron || typeof electron !== 'object') return {};
    return { app: electron.app || null, crashReporter: electron.crashReporter || null };
  }
}

module.exports = CrashTracer;

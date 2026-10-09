const CrashTraceFormat = require('./CrashTraceFormat');

class CrashTraceWiring {
  static APP_EVENTS = ['will-finish-launching', 'ready', 'window-all-closed', 'before-quit', 'will-quit'];
  static WINDOW_EVENTS = ['close', 'closed', 'unresponsive', 'responsive', 'hide', 'show', 'minimize', 'restore'];
  static ERR_ABORTED = -3;
  static IGNORED_REJECTION = 'Script failed to execute';

  constructor(tracer, app, proc = process) {
    this._tracer = tracer;
    this._app = app;
    this._proc = proc;
  }

  install() {
    this._patchExits();
    this._wireAppEvents();
    this._wireProcessEvents();
  }

  _write(line) {
    this._tracer.write(line);
  }

  _patchExits() {
    this._patchQuit();
    this._patchAppExit();
    this._patchRelaunch();
    this._patchProcessExit();
  }

  _patchQuit() {
    const tracer = this._tracer;
    const original = this._app.quit.bind(this._app);
    this._app.quit = function patchedQuit(...args) {
      tracer.noteQuitRequested();
      tracer.write(`app.quit() called from:\n${CrashTraceFormat.stackOf(2)}`);
      return original(...args);
    };
  }

  _patchAppExit() {
    const tracer = this._tracer;
    const original = this._app.exit.bind(this._app);
    this._app.exit = function patchedExit(code, ...rest) {
      tracer.noteQuitRequested();
      tracer.write(`app.exit(${code === undefined ? '' : code}) called from:\n${CrashTraceFormat.stackOf(2)}`);
      tracer.end(`code=${code === undefined ? 0 : code} via=app.exit`);
      return original(code, ...rest);
    };
  }

  _patchRelaunch() {
    const tracer = this._tracer;
    const original = this._app.relaunch.bind(this._app);
    this._app.relaunch = function patchedRelaunch(...args) {
      tracer.write(`app.relaunch() called from:\n${CrashTraceFormat.stackOf(2)}`);
      return original(...args);
    };
  }

  _patchProcessExit() {
    const tracer = this._tracer;
    const original = this._proc.exit.bind(this._proc);
    this._proc.exit = function patchedProcessExit(code, ...rest) {
      tracer.noteQuitRequested();
      tracer.write(`process.exit(${code === undefined ? '' : code}) called from:\n${CrashTraceFormat.stackOf(2)}`);
      return original(code, ...rest);
    };
  }

  _wireAppEvents() {
    const app = this._app;
    for (const ev of CrashTraceWiring.APP_EVENTS) app.on(ev, () => this._write(`app:${ev}`));
    app.on('quit', (_e, code) => { this._tracer.noteQuitRequested(); this._write(`app:quit exitCode=${code}`); });
    app.on('render-process-gone', (_e, wc, details) => this._write(`app:render-process-gone ${CrashTraceFormat.webContentsTag(wc)}${CrashTraceFormat.extra(details)}`));
    app.on('child-process-gone', (_e, details) => this._write(`app:child-process-gone${CrashTraceFormat.extra(details)}`));
    app.on('web-contents-created', (_e, wc) => this._wireWebContents(wc));
    app.on('browser-window-created', (_e, win) => this._wireWindow(win));
    app.on('second-instance', () => this._write('app:second-instance'));
  }

  _wireProcessEvents() {
    const proc = this._proc;
    proc.on('uncaughtExceptionMonitor', (err, origin) => this._write(`process:uncaughtException origin=${origin} ${(err && err.stack) || err}`));
    proc.on('unhandledRejection', (reason) => this._onUnhandledRejection(reason));
    proc.on('warning', (w) => this._write(`process:warning ${w && w.name}: ${w && w.message}`));
    proc.on('exit', (code) => this._tracer.end(`code=${code} via=process-exit`));
  }

  _onUnhandledRejection(reason) {
    const msg = String((reason && reason.message) || reason || '');
    if (msg.includes(CrashTraceWiring.IGNORED_REJECTION)) return;
    this._write(`process:unhandledRejection ${(reason && reason.stack) || msg}`);
  }

  _wireWebContents(wc) {
    const tag = CrashTraceFormat.webContentsTag(wc);
    this._write(`wc:created ${tag}${CrashTraceWiring._urlSuffix(wc)}`);
    const on = (ev, fn) => { try { wc.on(ev, fn); } catch (_) {} };
    for (const ev of ['did-start-loading', 'dom-ready', 'did-finish-load', 'did-stop-loading', 'unresponsive', 'responsive', 'destroyed']) {
      on(ev, () => this._write(`wc:${ev} ${tag}`));
    }
    on('did-navigate', (_e, u) => this._write(`wc:did-navigate ${tag} url=${CrashTraceFormat.short(u)}`));
    on('did-fail-load', (_e, code, desc, u, isMainFrame) => this._onFailLoad(tag, code, desc, u, isMainFrame));
    on('render-process-gone', (_e, details) => this._write(`wc:render-process-gone ${tag}${CrashTraceFormat.extra(details)}`));
    on('preload-error', (_e, preloadPath, err) => this._write(`wc:preload-error ${tag} ${preloadPath}: ${err && err.message}`));
  }

  _onFailLoad(tag, code, desc, url, isMainFrame) {
    if (code === CrashTraceWiring.ERR_ABORTED) return;
    this._write(`wc:did-fail-load ${tag} code=${code} ${desc} main=${!!isMainFrame} url=${CrashTraceFormat.short(url)}`);
  }

  _wireWindow(win) {
    let id = '?';
    try { id = win.id; } catch (_) {}
    this._write(`window:created id=${id}`);
    for (const ev of CrashTraceWiring.WINDOW_EVENTS) {
      try { win.on(ev, () => this._write(`window:${ev} id=${id}`)); } catch (_) {}
    }
  }

  static _urlSuffix(wc) {
    let url = '';
    try { url = wc.getURL(); } catch (_) {}
    return url ? ` url=${CrashTraceFormat.short(url)}` : '';
  }
}

module.exports = CrashTraceWiring;

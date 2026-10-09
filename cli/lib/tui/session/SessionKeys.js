class SessionKeys {
  static QUIT_WINDOW_MS = 2000;
  static APPROVAL_DECISIONS = ['once', 'run', 'reject'];

  constructor(app) {
    this.app = app;
  }

  handle(k) {
    const app = this.app;
    if (app.closed) return;
    if (app.approval) { this._approvalKey(k); return; }
    if (this._sessionKey(k)) return;
    app.quitArmed = 0;
    const r = app.editor.handleKey(k);
    if (r.submit !== undefined) app.submit(r.submit);
    else if (r.changed) app.requestRender();
  }

  _sessionKey(k) {
    const app = this.app;
    if (k.name === 'ctrl' && k.ch === 'c') { this._ctrlC(); return true; }
    if (k.name === 'ctrl' && k.ch === 'd') { if (!app.editor.text) app.quit(); return true; }
    if (k.name === 'ctrl' && k.ch === 'l') { app.term.write('\x1b[2J\x1b[H'); app.screen.invalidate(); app.requestRender(); return true; }
    if (k.name === 'ctrl' && k.ch === 'o') { app.toggleReasoning(); return true; }
    if (k.name === 'escape') { this._escape(); return true; }
    return false;
  }

  _ctrlC() {
    const app = this.app;
    if (app.streaming && !app.stopping) { app.abort(); return; }
    if (app.editor.text) { app.editor.clear(); app.quitArmed = 0; app.requestRender(); return; }
    const now = app.now();
    if (app.quitArmed && now - app.quitArmed < SessionKeys.QUIT_WINDOW_MS) { app.quit(); return; }
    app.quitArmed = now;
    app.requestRender();
  }

  _escape() {
    const app = this.app;
    if (app.editor.completions) { app.editor.completions = null; app.requestRender(); return; }
    if (app.streaming) app.abort();
  }

  _approvalKey(k) {
    const app = this.app;
    const a = app.approval;
    const n = SessionKeys.APPROVAL_DECISIONS.length;
    if (k.name === 'left' || (k.name === 'tab' && k.shift) || (k.name === 'char' && k.ch === 'h')) a.idx = (a.idx + n - 1) % n;
    else if (k.name === 'right' || k.name === 'tab' || (k.name === 'char' && k.ch === 'l')) a.idx = (a.idx + 1) % n;
    else if (k.name === 'enter') app.decide(SessionKeys.APPROVAL_DECISIONS[a.idx]);
    else if (k.name === 'char' && /^[yY]$/.test(k.ch)) app.decide('once');
    else if (k.name === 'char' && /^[aA]$/.test(k.ch)) app.decide('run');
    else if (k.name === 'char' && /^[nN]$/.test(k.ch)) app.decide('reject');
    else if (k.name === 'escape' || (k.name === 'ctrl' && k.ch === 'c')) app.decide('reject');
    app.requestRender();
  }
}

module.exports = SessionKeys;

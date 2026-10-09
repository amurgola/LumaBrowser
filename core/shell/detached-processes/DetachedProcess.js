class DetachedProcess {
  constructor({ child, command, cwd, logPath, startedAt, conversationId = null, inContainer = false, onExit, killTree, closeLog }) {
    this.pid = child.pid;
    this.command = String(command || '');
    this.cwd = String(cwd || '');
    this.logPath = logPath || null;
    this.startedAt = Number(startedAt) || Date.now();
    this.conversationId = conversationId == null ? null : String(conversationId);
    this.inContainer = !!inContainer;
    this.exitCode = null;
    this.signal = null;
    this.exitedAt = null;
    this.killed = false;
    this._child = child;
    this._listeners = typeof onExit === 'function' ? [onExit] : [];
    this._killTree = typeof killTree === 'function' ? killTree : null;
    this._closeLog = typeof closeLog === 'function' ? closeLog : null;
  }

  static isRegistrable(child) {
    return !!child && typeof child.pid === 'number';
  }

  get running() {
    return this.exitedAt == null;
  }

  watch(onSettled) {
    const child = this._child;
    const settle = (code, signal) => this._settle(code, signal, onSettled);
    if (typeof child.once === 'function') {
      child.once('exit', settle);
      child.once('error', () => settle(null, null));
    }
    if (child.exitCode != null || child.signalCode != null) settle(child.exitCode, child.signalCode);
  }

  view() {
    return {
      pid: this.pid,
      command: this.command,
      cwd: this.cwd,
      logPath: this.logPath,
      startedAt: this.startedAt,
      conversationId: this.conversationId,
      inContainer: this.inContainer,
      running: this.running,
      exitCode: this.exitCode,
      signal: this.signal,
      exitedAt: this.exitedAt,
      killed: this.killed,
      durationMs: (this.exitedAt || Date.now()) - this.startedAt,
    };
  }

  kill() {
    if (!this.running) return { ok: false, reason: `already exited with code ${this.exitCode}` };
    this.killed = true;
    DetachedProcess._quietly(() => this._killChild());
    return { ok: true };
  }

  addExitListener(listener) {
    if (this.running) this._listeners.push(listener);
    else setImmediate(() => DetachedProcess._quietly(() => listener(this.view())));
  }

  _killChild() {
    if (this._killTree) this._killTree(this._child);
    else if (this._child && typeof this._child.kill === 'function') this._child.kill('SIGKILL');
  }

  _settle(code, signal, onSettled) {
    if (!this.running) return;
    this._recordExit(code, signal);
    DetachedProcess._quietly(() => this._closeLog && this._closeLog());
    this._child = null;
    onSettled(this);
    this._notifyListeners();
  }

  _recordExit(code, signal) {
    this.exitCode = typeof code === 'number' ? code : null;
    this.signal = signal || null;
    this.exitedAt = Date.now();
  }

  _notifyListeners() {
    const view = this.view();
    for (const listener of this._listeners.splice(0)) DetachedProcess._quietly(() => listener(view));
  }

  static _quietly(action) {
    try { action(); } catch {}
  }
}

module.exports = DetachedProcess;

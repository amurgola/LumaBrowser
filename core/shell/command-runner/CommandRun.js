const DetachedProcesses = require('../DetachedProcesses');
const RunResult = require('./RunResult');

class CommandRun {
  static STDIO_DRAIN_GRACE_MS = 500;

  constructor(o) {
    this._o = o;
    this._child = o.child;
    this._capture = o.capture;
    this._startedAt = Date.now();
    this._timedOut = false;
    this._aborted = false;
    this._settled = false;
    this._timers = [];
    this._onAbort = () => { this._aborted = true; this._kill(); };
  }

  start() {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._armTimeout();
      this._armDetach();
      this._listenForAbort();
      this._pipeOutput();
      this._listenForEnd();
    });
  }

  _armTimeout() {
    this._timers.push(setTimeout(() => { this._timedOut = true; this._kill(); }, this._o.timeoutMs));
  }

  _armDetach() {
    const after = Number(this._o.detachAfterMs);
    if (Number.isFinite(after) && after > 0 && after < this._o.timeoutMs && this._child.pid) {
      this._timers.push(setTimeout(() => this._detach(), after));
    }
  }

  _listenForAbort() {
    const { signal } = this._o;
    if (!signal) return;
    if (signal.aborted) this._onAbort();
    else if (typeof signal.addEventListener === 'function') signal.addEventListener('abort', this._onAbort, { once: true });
  }

  _pipeOutput() {
    if (this._child.stdout) this._child.stdout.on('data', (d) => this._capture.push(d));
    if (this._child.stderr) this._child.stderr.on('data', (d) => this._capture.push(d));
  }

  _listenForEnd() {
    const { shell } = this._o;
    this._child.on('error', (e) => this._finish(null, null, `${shell.name} failed: ${e.message}`));
    this._child.on('close', (code, sig) => this._finish(code, sig, null));
    this._child.on('exit', (code, sig) => {
      setTimeout(() => this._finish(code, sig, null), CommandRun.STDIO_DRAIN_GRACE_MS);
    });
  }

  _finish(exitCode, signal, error) {
    if (!this._settle()) return;
    this._resolve(RunResult.finished({
      exitCode, signal, error, timedOut: this._timedOut, aborted: this._aborted, pid: this._child.pid,
      startedAt: this._startedAt, out: this._capture.finish(), shell: this._o.shell,
    }));
  }

  _detach() {
    if (!this._settle()) return;
    const logPath = this._capture.detach();
    const snap = this._capture.snapshot();
    this._register(logPath);
    this._resolve(RunResult.detached({ pid: this._child.pid, startedAt: this._startedAt, logPath, snap, shell: this._o.shell }));
  }

  _register(logPath) {
    const { command, cwd, conversationId, inContainer, killer } = this._o;
    DetachedProcesses.register({
      child: this._child, command, cwd, logPath, startedAt: this._startedAt, conversationId,
      inContainer: !!inContainer,
      killTree: (c) => killer.kill(c),
      closeLog: () => this._capture.finish(),
    });
  }

  _settle() {
    if (this._settled) return false;
    this._settled = true;
    this._unhook();
    return true;
  }

  _unhook() {
    for (const t of this._timers) clearTimeout(t);
    const { signal } = this._o;
    if (signal && typeof signal.removeEventListener === 'function') {
      try { signal.removeEventListener('abort', this._onAbort); } catch (_) {}
    }
  }

  _kill() {
    this._o.killer.kill(this._child);
  }
}

module.exports = CommandRun;

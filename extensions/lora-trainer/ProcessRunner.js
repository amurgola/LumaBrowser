const { spawn } = require('child_process');
const ChildProcessRegistry = require('../../core/shell/ChildProcessRegistry');
const ProcessTreeKiller = require('../../core/shell/command-runner/ProcessTreeKiller');

class ProcessRunner {
  static CANCEL_POLL_MS = 500;
  static TAIL_LINES = 25;
  static LINE_MAX = 2000;
  static LINE_BREAK = /\r\n|\n|\r/;

  constructor({ spawnFn = spawn, platform = process.platform, track = (child) => ChildProcessRegistry.track(child) } = {}) {
    this._spawn = spawnFn;
    this._platform = platform;
    this._track = track;
    this._killer = new ProcessTreeKiller({ platform, spawn: spawnFn });
  }

  run({ command, args = [], cwd, env, onLine, isCanceled, timeoutMs = 0 }) {
    return new Promise((resolve) => {
      const state = { tail: [], pending: '', canceled: false, timedOut: false, settled: false, timers: [] };
      const finish = (code) => this._finish(state, code, resolve);
      let child;
      try {
        child = this._spawn(command, args, this._options(cwd, env));
      } catch (err) {
        state.tail.push(err.message);
        return finish(null);
      }
      this._track(child);
      const collect = (chunk) => ProcessRunner._collect(state, chunk, onLine);
      child.stdout.on('data', collect);
      child.stderr.on('data', collect);
      child.on('error', (err) => { state.tail.push(err.message); finish(null); });
      child.on('close', (code) => { ProcessRunner._flush(state, onLine); finish(code); });
      this._watch(state, child, isCanceled, timeoutMs);
      return undefined;
    });
  }

  _options(cwd, env) {
    return { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], detached: this._platform !== 'win32' };
  }

  _watch(state, child, isCanceled, timeoutMs) {
    if (typeof isCanceled === 'function') {
      state.timers.push(setInterval(() => {
        if (state.settled || !isCanceled()) return;
        state.canceled = true;
        this._killer.kill(child);
      }, ProcessRunner.CANCEL_POLL_MS));
    }
    if (timeoutMs > 0) {
      state.timers.push(setTimeout(() => {
        state.timedOut = true;
        this._killer.kill(child);
      }, timeoutMs));
    }
  }

  _finish(state, code, resolve) {
    if (state.settled) return;
    state.settled = true;
    for (const timer of state.timers) { clearInterval(timer); clearTimeout(timer); }
    const ok = code === 0 && !state.canceled && !state.timedOut;
    resolve({ ok, code, canceled: state.canceled, timedOut: state.timedOut, tail: state.tail.join('\n') });
  }

  static _collect(state, chunk, onLine) {
    const parts = (state.pending + chunk.toString('utf8')).split(ProcessRunner.LINE_BREAK);
    state.pending = parts.pop();
    for (const part of parts) ProcessRunner._emit(state, part, onLine);
  }

  static _flush(state, onLine) {
    const rest = state.pending;
    state.pending = '';
    ProcessRunner._emit(state, rest, onLine);
  }

  static _emit(state, raw, onLine) {
    const line = String(raw).trim().slice(0, ProcessRunner.LINE_MAX);
    if (!line) return;
    state.tail.push(line);
    if (state.tail.length > ProcessRunner.TAIL_LINES) state.tail.shift();
    if (typeof onLine === 'function') { try { onLine(line); } catch (_) {} }
  }
}

module.exports = ProcessRunner;

const { spawn, execFile } = require('child_process');

class PythonEnvShell {
  static OUTPUT_MAX = 512 * 1024;
  static OUTPUT_KEEP = 256 * 1024;
  static CANCEL_POLL_MS = 500;
  static LINE_MAX = 200;
  static TAIL_LINES = 8;
  static TAIL_MAX = 2000;
  static EXEC_MAX_BUFFER = 4 * 1024 * 1024;
  static REASON_MAX = 500;
  static INFORMATIVE = /downloading|installed|building|preparing|resolved|bytecode|creat/i;
  static NUL = String.fromCharCode(0);

  static stream({ mode, distro, cmd, timeout, canceled, onLine }) {
    return new Promise((resolve) => new PythonEnvShell(resolve, { timeout, canceled, onLine }).start(mode, distro, cmd));
  }

  static exec(cmd, args, timeout) {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (result) => {
        if (!settled) { settled = true; resolve(result); }
      };
      const options = { windowsHide: true, timeout, maxBuffer: PythonEnvShell.EXEC_MAX_BUFFER };
      const child = execFile(cmd, args, options, (err, stdout, stderr) => settle(err
        ? { ok: false, reason: (stderr || err.message || '').slice(0, PythonEnvShell.REASON_MAX) }
        : { ok: true, stdout, stderr }));
      child.on('error', (err) => settle({ ok: false, reason: err.message }));
    });
  }

  static lastLines(text, n = PythonEnvShell.TAIL_LINES) {
    const lines = PythonEnvShell._stripNul(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return lines.slice(-n).join('\n').slice(0, PythonEnvShell.TAIL_MAX);
  }

  static informativeLines(text) {
    return String(text).split(/\r?\n|\r/)
      .map((raw) => PythonEnvShell._stripNul(raw).trim())
      .filter((line) => line && PythonEnvShell.INFORMATIVE.test(line))
      .map((line) => line.slice(0, PythonEnvShell.LINE_MAX));
  }

  constructor(resolve, { timeout, canceled, onLine }) {
    this._resolve = resolve;
    this._timeout = timeout;
    this._canceled = typeof canceled === 'function' ? canceled : () => false;
    this._onLine = typeof onLine === 'function' ? onLine : null;
    this._out = '';
    this._settled = false;
  }

  start(mode, distro, cmd) {
    const child = PythonEnvShell._spawn(mode, distro, cmd);
    child.stdout.on('data', (chunk) => this._collect(chunk));
    child.stderr.on('data', (chunk) => this._collect(chunk));
    this._poll = setInterval(() => this._checkCanceled(child), PythonEnvShell.CANCEL_POLL_MS);
    this._killer = setTimeout(() => this._timedOut(child), this._timeout);
    child.on('error', (err) => this._finish({ ok: false, tail: err.message }));
    child.on('exit', (code) => this._finish({ ok: code === 0, tail: code === 0 ? '' : PythonEnvShell.lastLines(this._out) }));
  }

  static _spawn(mode, distro, cmd) {
    const options = { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] };
    if (mode !== 'wsl') return spawn('bash', ['-lc', cmd], options);
    return spawn('wsl.exe', [...(distro ? ['-d', distro] : []), '--', 'bash', '-lc', cmd], options);
  }

  _collect(chunk) {
    const text = chunk.toString('utf8');
    this._out += text;
    if (this._out.length > PythonEnvShell.OUTPUT_MAX) this._out = this._out.slice(-PythonEnvShell.OUTPUT_KEEP);
    if (this._onLine) for (const line of PythonEnvShell.informativeLines(text)) this._onLine(line);
  }

  _checkCanceled(child) {
    if (!this._canceled()) return;
    PythonEnvShell._kill(child);
    this._finish({ ok: false, tail: 'canceled', canceled: true });
  }

  _timedOut(child) {
    PythonEnvShell._kill(child);
    this._finish({ ok: false, tail: `timed out after ${Math.round(this._timeout / 60000)} min` });
  }

  _finish({ ok, tail, canceled = false }) {
    if (this._settled) return;
    this._settled = true;
    clearInterval(this._poll);
    clearTimeout(this._killer);
    this._resolve({ ok, out: this._out, tail, canceled });
  }

  static _kill(child) {
    try { child.kill(); } catch (_) {}
  }

  static _stripNul(text) {
    return String(text || '').split(PythonEnvShell.NUL).join('');
  }
}

module.exports = PythonEnvShell;

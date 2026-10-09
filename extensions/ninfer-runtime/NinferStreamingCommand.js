const { spawn } = require('child_process');
const NinferShell = require('./NinferShell');

class NinferStreamingCommand {
  static NUL = String.fromCharCode(0);
  static OUTPUT_MAX = 512 * 1024;
  static OUTPUT_KEEP = 256 * 1024;
  static CANCEL_POLL_MS = 500;
  static LINE_MAX = 200;
  static PROGRESS_LINE = /\[\d+\/\d+\]|cloning|receiving|resolving|building|linking|configuring|generating|extracting|error|warning: unused/i;

  constructor({ mode, distro, cmd, timeout, isCanceled, onLine }) {
    this._mode = mode;
    this._distro = distro;
    this._cmd = cmd;
    this._timeout = timeout;
    this._isCanceled = isCanceled;
    this._onLine = onLine;
    this._out = '';
  }

  static run(options) {
    return new NinferStreamingCommand(options).execute();
  }

  execute() {
    return new Promise((resolve) => {
      this._spawn();
      this._settleWith(resolve);
      this._watchOutput();
      this._watchCancel();
      this._watchTimeout();
      this._watchExit();
    });
  }

  _spawn() {
    const [bin, args] = NinferShell.spawnArgs(this._mode, this._distro, this._cmd);
    const options = { stdio: ['ignore', 'pipe', 'pipe'] };
    if (this._mode === 'wsl') options.windowsHide = true;
    this._child = spawn(bin, args, options);
  }

  _settleWith(resolve) {
    let settled = false;
    this._finish = (res) => {
      if (settled) return;
      settled = true;
      clearInterval(this._poll);
      clearTimeout(this._killer);
      resolve(res);
    };
  }

  _watchOutput() {
    const onChunk = (chunk) => this._absorb(chunk.toString('utf8').split(NinferStreamingCommand.NUL).join(''));
    this._child.stdout.on('data', onChunk);
    this._child.stderr.on('data', onChunk);
  }

  _absorb(text) {
    const S = NinferStreamingCommand;
    this._out += text;
    if (this._out.length > S.OUTPUT_MAX) this._out = this._out.slice(-S.OUTPUT_KEEP);
    if (typeof this._onLine !== 'function') return;
    for (const raw of text.split(/\r?\n|\r/)) {
      const line = raw.trim();
      if (line && S.PROGRESS_LINE.test(line)) this._onLine(line.slice(0, S.LINE_MAX));
    }
  }

  _watchCancel() {
    this._poll = setInterval(() => {
      if (typeof this._isCanceled !== 'function' || !this._isCanceled()) return;
      this._kill();
      this._finish({ ok: false, out: this._out, canceled: true });
    }, NinferStreamingCommand.CANCEL_POLL_MS);
  }

  _watchTimeout() {
    this._killer = setTimeout(() => {
      this._kill();
      this._finish({ ok: false, out: this._out, tail: `timed out after ${Math.round(this._timeout / 60000)} min` });
    }, this._timeout);
  }

  _watchExit() {
    this._child.on('error', (err) => this._finish({ ok: false, out: this._out, tail: err.message }));
    this._child.on('exit', (code) => this._finish({
      ok: code === 0,
      out: this._out,
      tail: code === 0 ? '' : this._out.split('\n').slice(-12).join('\n'),
    }));
  }

  _kill() {
    try { this._child.kill(); } catch (_) {}
  }
}

module.exports = NinferStreamingCommand;

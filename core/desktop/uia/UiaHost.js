const { spawn } = require('child_process');
const UiaHostScript = require('./UiaHostScript');
const JsonLineReader = require('./JsonLineReader');

class UiaHost {
  static DEFAULT_TIMEOUT_MS = 15000;
  static START_TIMEOUT_MS = 20000;
  static WAKE_TIMEOUT_MS = 5000;
  static HIT_TIMEOUT_MS = 3000;
  static STDERR_KEEP_CHARS = 4000;
  static READY_ID = 0;

  constructor({ spawnImpl = spawn, timeoutMs = UiaHost.DEFAULT_TIMEOUT_MS } = {}) {
    this._spawn = spawnImpl;
    this._timeoutMs = timeoutMs;
    this._child = null;
    this._ready = null;
    this._nextId = 1;
    this._pending = new Map();
    this._chain = Promise.resolve();
  }

  request(payload, { timeoutMs = this._timeoutMs } = {}) {
    const run = this._chain.then(async () => {
      await this._start();
      return this._send(payload, timeoutMs);
    });
    this._chain = run.catch(() => {});
    return run;
  }

  async tree(hwnd, { maxNodes = 300 } = {}) {
    const r = UiaHost._requireOk(await this.request({ cmd: 'tree', hwnd, maxNodes }), 'UI Automation tree failed');
    return { nodes: UiaHost._asArray(r.nodes), truncated: !!r.truncated };
  }

  async act(ref, action = 'click', value) {
    return UiaHost._requireOk(await this.request({ cmd: 'act', ref, action, value }), 'UI Automation action failed');
  }

  async wake(hwnd) {
    const r = UiaHost._requireOk(await this.request({ cmd: 'wake', hwnd }, { timeoutMs: UiaHost.WAKE_TIMEOUT_MS }), 'UI Automation wake failed');
    return { widgets: r.widgets || 0, msaa: r.msaa || 0 };
  }

  async hit(x, y, ref) {
    const payload = { cmd: 'hit', x, y, ...(ref != null ? { ref } : {}) };
    return UiaHost._requireOk(await this.request(payload, { timeoutMs: UiaHost.HIT_TIMEOUT_MS }), 'UI Automation hit test failed');
  }

  close() {
    if (this._child) {
      try { this._child.kill(); } catch (_) {}
    }
    this._child = null;
    this._ready = null;
  }

  _start() {
    if (this._ready) return this._ready;
    const child = this._spawnSidecar();
    const log = { stderr: '' };
    this._child = child;
    this._ready = this._awaitReady(log);
    this._wireChild(child, log);
    this._ready.catch(() => { this._ready = null; });
    return this._ready;
  }

  _spawnSidecar() {
    const encoded = Buffer.from(UiaHostScript.SCRIPT, 'utf16le').toString('base64');
    return this._spawn('powershell.exe', [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded,
    ], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  }

  _awaitReady(log) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`UI Automation host did not start: ${log.stderr.slice(-400)}`)), UiaHost.START_TIMEOUT_MS);
      this._pending.set(UiaHost.READY_ID, {
        resolve: (msg) => { clearTimeout(timer); resolve(msg); },
        reject: (err) => { clearTimeout(timer); reject(err); },
      });
    });
  }

  _wireChild(child, log) {
    const reader = new JsonLineReader();
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => reader.push(chunk).forEach((msg) => this._deliver(msg)));
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { log.stderr = (log.stderr + chunk).slice(-UiaHost.STDERR_KEEP_CHARS); });
    child.on('exit', (code) => this._onExit(child, code, log.stderr));
  }

  _deliver(msg) {
    if (!msg || typeof msg !== 'object') return;
    const pending = this._pending.get(msg.id);
    if (!pending) return;
    this._pending.delete(msg.id);
    pending.resolve(msg);
  }

  _onExit(child, code, stderr) {
    if (this._child && this._child !== child) return;
    const err = new Error(`UI Automation host exited (${code})${stderr ? `: ${stderr.slice(-300)}` : ''}`);
    for (const pending of this._pending.values()) pending.reject(err);
    this._pending.clear();
    this._child = null;
    this._ready = null;
  }

  _send(payload, timeoutMs) {
    const id = this._nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pending.delete(id);
        this.close();
        reject(new Error(`UI Automation request timed out after ${timeoutMs} ms`));
      }, timeoutMs);
      this._pending.set(id, {
        resolve: (msg) => { clearTimeout(timer); resolve(msg); },
        reject: (err) => { clearTimeout(timer); reject(err); },
      });
      this._child.stdin.write(`${JSON.stringify({ ...payload, id })}\n`);
    });
  }

  static _requireOk(reply, fallbackError) {
    if (!reply.ok) throw new Error(reply.error || fallbackError);
    return reply;
  }

  static _asArray(nodes) {
    if (Array.isArray(nodes)) return nodes;
    return nodes ? [nodes] : [];
  }
}

module.exports = UiaHost;

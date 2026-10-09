const SandboxPolicy = require('./SandboxPolicy');
const SandboxWindow = require('./SandboxWindow');
const SandboxNetBridge = require('./SandboxNetBridge');

class ToolSandbox {
  static MAX_QUEUED = 8;
  static GRACE_MS = 2000;
  static EXEC_CHANNEL = 'toolforge:exec';
  static RESULT_CHANNEL = 'toolforge:result';
  static NET_CHANNEL = 'toolforge:net';
  static _netOwner = null;

  constructor({ getLiveApi, safeFetch, logger, electron } = {}) {
    this._electron = electron || require('electron');
    this._logger = logger || console;
    this._window = new SandboxWindow({ electron: this._electron, onCrash: (error) => this._failActive(error) });
    this._net = new SandboxNetBridge({ getLiveApi, safeFetch });
    this._queue = [];
    this._busy = false;
    this._active = null;
    this._bindIpc();
  }

  exec(spec) {
    if (this._queue.length >= ToolSandbox.MAX_QUEUED) {
      return Promise.resolve({ ok: false, error: `Sandbox is busy (max ${ToolSandbox.MAX_QUEUED} tool runs queued). Try again shortly.` });
    }
    return new Promise((resolve) => {
      this._queue.push({ spec, resolve });
      this._pump();
    });
  }

  dispose() {
    this._window.destroy();
    for (const { resolve } of this._queue.splice(0)) resolve({ ok: false, error: 'Sandbox shut down.' });
    this._unbindIpc();
  }

  _bindIpc() {
    const { ipcMain } = this._electron;
    this._resultListener = (event, msg) => { if (this._window.isSender(event)) this._onResult(msg); };
    ipcMain.on(ToolSandbox.RESULT_CHANNEL, this._resultListener);
    ipcMain.removeHandler(ToolSandbox.NET_CHANNEL);
    ipcMain.handle(ToolSandbox.NET_CHANNEL, (event, msg) => this._onNet(event, msg));
    ToolSandbox._netOwner = this;
  }

  _unbindIpc() {
    const { ipcMain } = this._electron;
    ipcMain.removeListener(ToolSandbox.RESULT_CHANNEL, this._resultListener);
    if (ToolSandbox._netOwner !== this) return;
    ipcMain.removeHandler(ToolSandbox.NET_CHANNEL);
    ToolSandbox._netOwner = null;
  }

  async _onNet(event, msg) {
    if (!this._window.isSender(event)) return { success: false, error: 'not authorized' };
    return this._net.handle(msg, this._active);
  }

  _pump() {
    if (this._busy || !this._queue.length) return;
    this._busy = true;
    const { spec, resolve } = this._queue.shift();
    this._runOne(spec).then((result) => {
      this._busy = false;
      resolve(result);
      this._pump();
    });
  }

  async _runOne(spec) {
    const timeoutMs = SandboxPolicy.clampTimeout(spec.timeoutMs);
    let win;
    try {
      win = await this._window.prepare();
    } catch (error) {
      return { ok: false, error: `Sandbox failed to start: ${(error && error.message) || error}` };
    }
    return this._dispatch(win, spec, timeoutMs, this._window.nextCallId());
  }

  _dispatch(win, spec, timeoutMs, callId) {
    return new Promise((resolve) => {
      const settle = this._settler(callId, resolve);
      this._active = { callId, allowedHosts: Array.isArray(spec.allowedHosts) ? spec.allowedHosts : [], settle };
      settle.timer = setTimeout(() => this._timedOut(settle, timeoutMs), timeoutMs + ToolSandbox.GRACE_MS);
      try {
        win.webContents.send(ToolSandbox.EXEC_CHANNEL, ToolSandbox._execMessage(callId, spec, timeoutMs));
      } catch (error) {
        settle({ ok: false, error: `Could not dispatch to sandbox: ${(error && error.message) || error}` });
      }
    });
  }

  _settler(callId, resolve) {
    let settled = false;
    const settle = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(settle.timer);
      if (this._active && this._active.callId === callId) this._active = null;
      resolve(result);
    };
    return settle;
  }

  _timedOut(settle, timeoutMs) {
    this._window.destroy();
    settle({ ok: false, error: `Tool timed out after ${Math.round(timeoutMs / 1000)}s.` });
  }

  _onResult(msg) {
    if (!msg || !this._active || msg.callId !== this._active.callId) return;
    if (msg.ok) this._active.settle({ ok: true, result: msg.result });
    else this._active.settle({ ok: false, error: msg.error || 'Tool failed.' });
  }

  _failActive(error) {
    if (this._active && typeof this._active.settle === 'function') this._active.settle({ ok: false, error });
  }

  static _execMessage(callId, spec, timeoutMs) {
    return { callId, code: spec.code, args: spec.args || {}, config: spec.config || {}, timeoutMs };
  }
}

module.exports = ToolSandbox;

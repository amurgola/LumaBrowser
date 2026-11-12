const ChatModelRef = require('../../core/llm-server/chat/router/ChatModelRef');

class LabHelperModel {
  static RUNTIME_ID = 'llama-cpp-luma';

  constructor({ stem, host = '127.0.0.1', port, ctx = 8192, runtimeId = LabHelperModel.RUNTIME_ID, ready = () => true } = {}) {
    this._stem = stem;
    this._host = host;
    this._port = port;
    this._ctx = ctx;
    this._runtimeId = runtimeId;
    this._ready = ready;
    this._inFlight = 0;
  }

  ref() { return ChatModelRef.HELPER_PREFIX + this._stem; }

  readyRef() { return this._ready() ? this.ref() : null; }

  contextSize() { return this._ctx; }

  getStatus() {
    return { enabled: true, modelInstalled: true, ref: this.ref(), contextSize: this._ctx, state: this._ready() ? 'ready' : 'idle', port: this._port, error: null };
  }

  facade() {
    const self = this;
    return {
      runtimeServer: {
        plan: null,
        authKey: null,
        getStatus: () => ({ state: self._ready() ? 'ready' : 'idle', host: self._host, port: self._port, plan: null }),
        markActive: () => {},
      },
      getDefaults: () => ({ runtimeId: self._runtimeId }),
      getRunningThinking: () => null,
      getLocalSlotCount: () => 2,
      getLocalInFlight: () => self._inFlight,
      noteLocalRequestStart: () => { self._inFlight += 1; },
      noteLocalRequestEnd: () => { self._inFlight = Math.max(0, self._inFlight - 1); },
    };
  }
}

module.exports = LabHelperModel;

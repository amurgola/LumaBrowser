class LabServerService {
  static RUNTIME_ID = 'llama-cpp-luma';

  constructor({ chatStore, host = '127.0.0.1', port, ctx = 16384, effort = 'default', modelStem = 'model', runtimeId = LabServerService.RUNTIME_ID, helperModel = null } = {}) {
    this.chatStore = chatStore;
    this.modelSettings = null;
    this.helperModel = helperModel;
    this.ctxPerSlot = ctx;
    this._host = host;
    this._port = port;
    this._effort = effort;
    this._stem = modelStem;
    this._runtimeId = runtimeId;
    this._lastRef = null;
    this._inFlight = 0;
    this.runtimeServer = {
      dirty: false,
      plan: null,
      authKey: null,
      getStatus: () => ({ state: 'ready', host: this._host, port: this._port, plan: null }),
      markActive: () => {},
    };
  }

  getDefaults() {
    return { runtimeId: this._runtimeId, modelPath: null, reasoningEffort: this._effort, noThink: this._effort === 'off', contextSize: this.ctxPerSlot };
  }

  getEffectiveContext() {
    return { ctxPerSlot: this.ctxPerSlot };
  }

  computeLocalProviderEntry() {
    return { selectedModel: this._stem, displayName: this._stem };
  }

  getLastModelRef() { return this._lastRef; }
  setLastModelRef(ref) { this._lastRef = ref; }
  getRunningThinking() { return null; }
  getLocalSlotCount() { return 1; }
  getLocalInFlight() { return this._inFlight; }
  noteLocalRequestStart() { this._inFlight += 1; }
  noteLocalRequestEnd() { this._inFlight = Math.max(0, this._inFlight - 1); }
}

module.exports = LabServerService;

class DebuggerTraceRecorder {
  static PROTOCOL_VERSION = '1.3';
  static END_TIMEOUT_MS = 30000;

  constructor(webContents) {
    this._debugger = webContents.debugger;
    this._events = [];
    this._attachedHere = false;
    this._onMessage = null;
    this._complete = null;
  }

  async start(categories) {
    this._attach();
    this._listen();
    try {
      await this._debugger.sendCommand('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: categories } });
    } catch (err) {
      this._release();
      throw err;
    }
  }

  async stop() {
    try {
      await this._debugger.sendCommand('Tracing.end');
      await this._waitForCompletion();
      return { traceEvents: this._events };
    } finally {
      this._release();
    }
  }

  _attach() {
    this._debugger.attach(DebuggerTraceRecorder.PROTOCOL_VERSION);
    this._attachedHere = true;
  }

  _listen() {
    let finish;
    this._complete = new Promise((resolve) => { finish = resolve; });
    this._onMessage = (_event, method, params) => {
      if (method === 'Tracing.dataCollected') this._events.push(...((params && params.value) || []));
      if (method === 'Tracing.tracingComplete') finish();
    };
    this._debugger.on('message', this._onMessage);
  }

  _waitForCompletion() {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('the trace did not finish flushing')), DebuggerTraceRecorder.END_TIMEOUT_MS);
    });
    return Promise.race([this._complete, timeout]).finally(() => clearTimeout(timer));
  }

  _release() {
    try { if (this._onMessage) this._debugger.removeListener('message', this._onMessage); } catch (_) {}
    this._onMessage = null;
    if (!this._attachedHere) return;
    this._attachedHere = false;
    try { this._debugger.detach(); } catch (_) {}
  }
}

module.exports = DebuggerTraceRecorder;

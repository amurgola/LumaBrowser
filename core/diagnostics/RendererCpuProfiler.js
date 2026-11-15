const CpuProfiler = require('./CpuProfiler');

class RendererCpuProfiler extends CpuProfiler {
  static PROTOCOL_VERSION = '1.3';

  constructor(webContents, { shareDebugger = false } = {}) {
    super();
    this._debugger = webContents.debugger;
    this._shared = shareDebugger;
  }

  async _attach() {
    if (!this._shared) this._debugger.attach(RendererCpuProfiler.PROTOCOL_VERSION);
  }

  _send(method, params) {
    return this._debugger.sendCommand(method, params);
  }

  _detach() {
    if (!this._shared) this._debugger.detach();
  }
}

module.exports = RendererCpuProfiler;

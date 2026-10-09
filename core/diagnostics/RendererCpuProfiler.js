const CpuProfiler = require('./CpuProfiler');

class RendererCpuProfiler extends CpuProfiler {
  static PROTOCOL_VERSION = '1.3';

  constructor(webContents) {
    super();
    this._debugger = webContents.debugger;
  }

  async _attach() {
    this._debugger.attach(RendererCpuProfiler.PROTOCOL_VERSION);
  }

  _send(method, params) {
    return this._debugger.sendCommand(method, params);
  }

  _detach() {
    this._debugger.detach();
  }
}

module.exports = RendererCpuProfiler;

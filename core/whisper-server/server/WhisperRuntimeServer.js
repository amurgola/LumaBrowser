const axios = require('axios');
const BaseRuntimeServer = require('../../shared/runtime/BaseRuntimeServer');
const FreePort = require('../../shared/runtime/FreePort');

class WhisperRuntimeServer extends BaseRuntimeServer {
  static PORT_RANGE = FreePort.portWindow('whisper');
  static HEALTH_REQUEST_TIMEOUT_MS = 1500;

  static findFreePort(opts = {}) {
    return FreePort.findFreePort({ range: WhisperRuntimeServer.PORT_RANGE, ...opts });
  }

  _logTag() { return '[whisper]'; }
  _processNoun() { return 'whisper-server'; }
  _loadingLabel() { return 'voice model'; }

  async _healthCheck() {
    const res = await axios.get(`http://127.0.0.1:${this.port}/`, {
      timeout: WhisperRuntimeServer.HEALTH_REQUEST_TIMEOUT_MS,
      validateStatus: (status) => WhisperRuntimeServer._isServed(status),
    });
    return WhisperRuntimeServer._isServed(res.status);
  }

  static _isServed(status) {
    return status >= 200 && status < 500;
  }
}

module.exports = WhisperRuntimeServer;

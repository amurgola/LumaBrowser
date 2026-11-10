const axios = require('axios');
const BaseRuntimeServer = require('../../shared/runtime/BaseRuntimeServer');
const FreePort = require('../../shared/runtime/FreePort');

class HelperRuntimeServer extends BaseRuntimeServer {
  static PORT_RANGE = FreePort.portWindow('helper');
  static HEALTH_REQUEST_TIMEOUT_MS = 1500;

  static findFreePort(opts = {}) {
    return FreePort.findFreePort({ range: HelperRuntimeServer.PORT_RANGE, ...opts });
  }

  _logTag() { return '[helper-model]'; }
  _processNoun() { return 'helper llama-server'; }
  _loadingLabel() { return 'helper model'; }

  async _healthCheck() {
    const res = await axios.get(`http://127.0.0.1:${this.port}/health`, {
      timeout: HelperRuntimeServer.HEALTH_REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });
    return res.status === 200;
  }
}

module.exports = HelperRuntimeServer;

const axios = require('axios');
const BaseRuntimeServer = require('../../shared/runtime/BaseRuntimeServer');
const FreePort = require('../../shared/runtime/FreePort');

class RouterRuntimeServer extends BaseRuntimeServer {
  static PORT_RANGE = FreePort.portWindow('router');
  static HEALTH_REQUEST_TIMEOUT_MS = 1500;

  static findFreePort(opts = {}) {
    return FreePort.findFreePort({ range: RouterRuntimeServer.PORT_RANGE, ...opts });
  }

  _logTag() { return '[group-router]'; }
  _processNoun() { return 'router llama-server'; }
  _loadingLabel() { return 'router model'; }

  async _healthCheck() {
    const res = await axios.get(`http://127.0.0.1:${this.port}/health`, {
      timeout: RouterRuntimeServer.HEALTH_REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });
    return res.status === 200;
  }
}

module.exports = RouterRuntimeServer;

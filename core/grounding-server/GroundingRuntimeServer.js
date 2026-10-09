const axios = require('axios');
const BaseRuntimeServer = require('../shared/runtime/BaseRuntimeServer');
const FreePort = require('../shared/runtime/FreePort');

class GroundingRuntimeServer extends BaseRuntimeServer {
  static PORT_RANGE = FreePort.portWindow('grounding');
  static HEALTH_REQUEST_TIMEOUT_MS = 1500;

  static findFreePort(opts = {}) {
    return FreePort.findFreePort({ range: GroundingRuntimeServer.PORT_RANGE, ...opts });
  }

  _logTag() { return '[grounding-server]'; }
  _processNoun() { return 'grounding llama-server'; }
  _loadingLabel() { return 'grounding model'; }

  async _healthCheck() {
    const res = await axios.get(`http://127.0.0.1:${this.port}/health`, {
      timeout: GroundingRuntimeServer.HEALTH_REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });
    return res.status === 200;
  }
}

module.exports = GroundingRuntimeServer;

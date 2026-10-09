const http = require('http');
const CoreRequire = require('./CoreRequire');

const BaseRuntimeServer = CoreRequire.load('shared/runtime/BaseRuntimeServer');

class AudioCppServer extends BaseRuntimeServer {
  static HEALTH_REQUEST_TIMEOUT_MS = 1500;

  _logTag() { return '[chatterbox]'; }
  _processNoun() { return 'audiocpp_server'; }
  _loadingLabel() { return 'voice engine'; }

  _healthCheck() {
    return new Promise((resolve) => {
      const req = http.get({ host: '127.0.0.1', port: this.port, path: '/health', timeout: AudioCppServer.HEALTH_REQUEST_TIMEOUT_MS }, (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.on('error', () => resolve(false));
    });
  }
}

module.exports = AudioCppServer;

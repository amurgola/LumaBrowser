const ImageRuntimeServer = require('./ImageRuntimeServer');
const FreePort = require('../../shared/runtime/FreePort');

class VideoRuntimeServer extends ImageRuntimeServer {
  static PORT_RANGE = FreePort.portWindow('video');

  static SETTLE_TIMEOUT_MS = 600000;

  static findFreePort(opts = {}) {
    return FreePort.findFreePort({ range: VideoRuntimeServer.PORT_RANGE, ...opts });
  }

  _logTag() { return '[video-server]'; }
  _processNoun() { return 'sd-server'; }
  _loadingLabel() { return 'video server'; }
  _settleTimeoutMs() { return VideoRuntimeServer.SETTLE_TIMEOUT_MS; }
}

module.exports = VideoRuntimeServer;

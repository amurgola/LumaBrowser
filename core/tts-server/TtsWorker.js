const RamPinMessagePort = require('../shared/runtime/rampin/RamPinMessagePort');
const TtsWorkerSession = require('./worker/TtsWorkerSession');

class TtsWorker {
  static main() {
    const port = RamPinMessagePort.fromProcess(process);
    if (!port) return process.exit(1);
    const session = new TtsWorkerSession({
      post: (message) => port.post(message),
      exit: (code) => process.exit(code),
    });
    port.on((message) => session.handle(message));
  }
}

TtsWorker.main();

module.exports = TtsWorker;

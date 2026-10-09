const RamPinMessagePort = require('../../shared/runtime/rampin/RamPinMessagePort');
const SherpaSttWorkerSession = require('./SherpaSttWorkerSession');

class SherpaSttWorker {
  static main() {
    const port = RamPinMessagePort.fromProcess(process);
    if (!port) return process.exit(1);
    const session = new SherpaSttWorkerSession({
      post: (message) => port.post(message),
      exit: (code) => process.exit(code),
    });
    port.on((message) => session.handle(message));
  }
}

SherpaSttWorker.main();

module.exports = SherpaSttWorker;

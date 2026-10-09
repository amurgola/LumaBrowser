const RamPinMessagePort = require('./RamPinMessagePort');
const RamPinSession = require('./RamPinSession');

class RamPinWorker {
  static main() {
    const port = RamPinMessagePort.fromProcess(process);
    if (!port) return process.exit(1);
    const session = new RamPinSession({
      post: (message) => port.post(message),
      createLock: () => RamPinWorker._createLock(process.platform),
      exit: (code) => process.exit(code),
    });
    port.on((message) => session.handle(message));
  }

  static _createLock(platform) {
    const LockClass = platform === 'win32' ? require('./WindowsMemoryLock') : require('./LinuxMemoryLock');
    return new LockClass();
  }
}

RamPinWorker.main();

module.exports = RamPinWorker;

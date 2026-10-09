class RamPinMessagePort {
  static fromProcess(proc) {
    if (proc.parentPort) return RamPinMessagePort._overParentPort(proc.parentPort);
    if (typeof proc.send === 'function') return RamPinMessagePort._overForkIpc(proc);
    return null;
  }

  constructor(subscribe, send) {
    this._subscribe = subscribe;
    this._send = send;
  }

  on(callback) {
    this._subscribe(callback);
  }

  post(message) {
    try {
      this._send(message);
    } catch (_) {}
  }

  static _overParentPort(parentPort) {
    return new RamPinMessagePort(
      (callback) => parentPort.on('message', (event) => callback(event && event.data)),
      (message) => parentPort.postMessage(message)
    );
  }

  static _overForkIpc(proc) {
    return new RamPinMessagePort(
      (callback) => proc.on('message', (message) => callback(message)),
      (message) => proc.send(message)
    );
  }
}

module.exports = RamPinMessagePort;

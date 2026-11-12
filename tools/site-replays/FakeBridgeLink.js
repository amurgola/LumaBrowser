const { EventEmitter } = require('events');

class FakeBridgeLink extends EventEmitter {
  onFrame(fn) {
    this.on('frame', fn);
  }

  onClose(fn) {
    this.on('close', fn);
  }

  close() {}

  push(type, payload) {
    this.emit('frame', type, payload);
  }

  async send(_type, _payload) {
    throw new Error(`${this.constructor.name} must implement send(type, payload)`);
  }

  static sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = FakeBridgeLink;

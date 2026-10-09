const net = require('net');

class RpcPortWaiter {
  static CONNECT_TIMEOUT_MS = 2000;
  static RETRY_MS = 500;

  static wait(host, port, timeoutMs, stillWanted = () => true) {
    return new Promise((resolve) => {
      const startedAt = Date.now();
      const retry = () => {
        if (Date.now() - startedAt > timeoutMs) return resolve(false);
        setTimeout(tryOnce, RpcPortWaiter.RETRY_MS);
      };
      const tryOnce = () => {
        if (!stillWanted()) return resolve(false);
        RpcPortWaiter._probe(host, port, () => resolve(true), retry);
      };
      tryOnce();
    });
  }

  static _probe(host, port, onOpen, onClosed) {
    const socket = net.connect({ host, port, timeout: RpcPortWaiter.CONNECT_TIMEOUT_MS });
    socket.once('connect', () => { socket.destroy(); onOpen(); });
    socket.once('error', onClosed);
    socket.once('timeout', () => { socket.destroy(); onClosed(); });
  }
}

module.exports = RpcPortWaiter;

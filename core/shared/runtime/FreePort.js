const net = require('net');

class FreePort {
  static LOOPBACK = '127.0.0.1';

  static PORT_WINDOWS = Object.freeze({
    llm: Object.freeze({ start: 8080, end: 8099 }),
    image: Object.freeze({ start: 8100, end: 8119 }),
    video: Object.freeze({ start: 8120, end: 8139 }),
    whisper: Object.freeze({ start: 8140, end: 8159 }),
    music: Object.freeze({ start: 8160, end: 8179 }),
    router: Object.freeze({ start: 8180, end: 8199 }),
    grounding: Object.freeze({ start: 8200, end: 8219 }),
    rpcLend: Object.freeze({ start: 50052, end: 50059 }),
  });

  static portWindow(name) {
    const window = FreePort.PORT_WINDOWS[name];
    if (!window) throw FreePort._unknownWindowError(name);
    return { start: window.start, end: window.end };
  }

  static async findFreePort({ range, exclude = [] } = {}) {
    const inRange = range ? await FreePort._firstFreeInRange(range, FreePort._excludedSet(exclude)) : null;
    return inRange != null ? inRange : FreePort.ephemeralPort();
  }

  static isPortFree(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => server.close(() => resolve(true)));
      server.listen(port, FreePort.LOOPBACK);
    });
  }

  static ephemeralPort() {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', reject);
      server.listen(0, FreePort.LOOPBACK, () => {
        const { port } = server.address();
        server.close(() => resolve(port));
      });
    });
  }

  static _unknownWindowError(name) {
    const known = Object.keys(FreePort.PORT_WINDOWS).join(', ');
    return new Error(`portWindow: unknown window "${name}". Known: ${known}`);
  }

  static _excludedSet(exclude) {
    return new Set((exclude || []).filter((p) => typeof p === 'number'));
  }

  static async _firstFreeInRange(range, excluded) {
    for (let port = range.start; port <= range.end; port++) {
      if (excluded.has(port)) continue;
      if (await FreePort.isPortFree(port)) return port;
    }
    return null;
  }
}

module.exports = FreePort;

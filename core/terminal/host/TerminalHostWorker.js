const PtySessionTable = require('./PtySessionTable');

class TerminalHostWorker {
  static PTY_PACKAGE = '@lydell/node-pty';

  constructor(port, { load = TerminalHostWorker.loadModules, exit = (code) => process.exit(code) } = {}) {
    this._port = port;
    this._load = load;
    this._exit = exit;
    this._table = null;
  }

  listen() {
    this._port.on('message', (event) => this._onMessage(event && event.data !== undefined ? event.data : event));
  }

  static loadModules() {
    const ptyPath = require.resolve(TerminalHostWorker.PTY_PACKAGE).replace(/app\.asar([\\/])/, 'app.asar.unpacked$1');
    return {
      pty: require(ptyPath),
      xterm: { Terminal: require('@xterm/headless').Terminal, SerializeAddon: require('@xterm/addon-serialize').SerializeAddon },
    };
  }

  _onMessage(message) {
    if (!message || typeof message.type !== 'string') return;
    if (message.type === 'init') this._init();
    else if (message.type === 'shutdown') this._shutdown();
    else if (message.type === 'request') this._answer(message);
    else if (message.type === 'post' && this._table) this._table.post(message.method, message.params);
  }

  _init() {
    try {
      const modules = this._load();
      this._table = new PtySessionTable({ ...modules, emit: (event) => this._port.postMessage({ type: 'event', event }) });
      this._port.postMessage({ type: 'ready' });
    } catch (err) {
      this._port.postMessage({ type: 'init-error', message: err && err.message ? err.message : String(err) });
    }
  }

  async _answer({ id, method, params }) {
    try {
      const result = await this._table.handle(method, params);
      this._port.postMessage({ type: 'response', id, result });
    } catch (err) {
      this._port.postMessage({ type: 'response', id, error: err && err.message ? err.message : String(err) });
    }
  }

  _shutdown() {
    if (this._table) this._table.shutdown();
    this._exit(0);
  }
}

if (process.parentPort) new TerminalHostWorker(process.parentPort).listen();

module.exports = TerminalHostWorker;

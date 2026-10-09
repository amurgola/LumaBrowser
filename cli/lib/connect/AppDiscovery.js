const HandshakeFile = require('./HandshakeFile');
const AppHealth = require('./AppHealth');
const AppExecutable = require('./AppExecutable');
const AppProcess = require('./AppProcess');

class AppDiscovery {
  static START_WAIT_MS = 60 * 1000;
  static POLL_MS = 1000;

  constructor({ readHandshake, healthy, launch, sleep, handshakePath, startWaitMs, pollMs } = {}) {
    this._readHandshake = readHandshake || (() => HandshakeFile.read());
    this._healthy = healthy || AppHealth.check;
    this._launch = launch || ((exe) => AppProcess.launch(exe, ['--hidden']));
    this._sleep = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
    this._handshakePath = handshakePath || (() => HandshakeFile.path());
    this._startWaitMs = startWaitMs || AppDiscovery.START_WAIT_MS;
    this._pollMs = pollMs || AppDiscovery.POLL_MS;
  }

  async discover({ autoStart = true, log = () => {}, resolveExecutable = () => AppExecutable.resolve() } = {}) {
    const current = this._readHandshake();
    if (await this._isLive(current)) return AppDiscovery._target(current, false);
    const exe = autoStart ? resolveExecutable() : null;
    if (!exe) throw this.notRunningError();
    log('LumaBrowser is not running; starting it…');
    this._launch(exe);
    return this._waitForFreshHandshake(current ? current.token : null);
  }

  notRunningError() {
    const e = new Error(`LumaBrowser is not running (no live handshake at ${this._handshakePath()}).\n`
      + 'Start the app, or install it with `npx lumabrowser start` so `luma` can launch it for you.');
    e.code = 'NOT_RUNNING';
    return e;
  }

  async _waitForFreshHandshake(staleToken) {
    const deadline = Date.now() + this._startWaitMs;
    while (Date.now() < deadline) {
      await this._sleep(this._pollMs);
      const hs = this._readHandshake();
      if (hs && hs.token !== staleToken && await this._healthy(hs.port)) return AppDiscovery._target(hs, true);
    }
    throw new Error(`LumaBrowser did not come up within ${Math.round(this._startWaitMs / 1000)} seconds.`);
  }

  async _isLive(hs) {
    return !!hs && await this._healthy(hs.port);
  }

  static _target(hs, started) {
    return { port: hs.port, token: hs.token, started };
  }
}

module.exports = AppDiscovery;

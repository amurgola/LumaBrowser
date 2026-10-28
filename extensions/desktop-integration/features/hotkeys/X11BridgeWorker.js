const RamPinMessagePort = require('../../../../core/shared/runtime/rampin/RamPinMessagePort');
const X11Api = require('./X11Api');
const X11ChordPoller = require('./X11ChordPoller');

class X11BridgeWorker {
  static POLL_MS = 40;

  static main() {
    const port = RamPinMessagePort.fromProcess(process);
    if (!port) return process.exit(1);
    let api;
    try {
      api = X11Api.load();
    } catch (err) {
      port.post({ type: 'error', message: `The X11 bridge cannot open XWayland: ${(err && err.message) || err}` });
      return process.exit(1);
    }
    const worker = new X11BridgeWorker({ api, post: (m) => port.post(m), exit: (code) => process.exit(code) });
    port.on((message) => worker.handle(message));
    worker.start();
    return undefined;
  }

  constructor({ api, post, exit, setInterval: si = setInterval, clearInterval: ci = clearInterval }) {
    this._api = api;
    this._post = post;
    this._exit = exit;
    this._si = si;
    this._ci = ci;
    this._poller = new X11ChordPoller({ keycodeOf: api.keycodeOf });
    this._lastHeld = '';
    this._timer = null;
  }

  start() {
    this._timer = this._si(() => this.tick(), X11BridgeWorker.POLL_MS);
    this._post({ type: 'ready' });
  }

  tick() {
    const { held, fired } = this._poller.tick(this._api.keysDown());
    const key = held.join(',');
    if (key !== this._lastHeld) {
      this._lastHeld = key;
      this._post({ type: 'held', vks: held });
    }
    for (const id of fired) this._post({ type: 'fire', id });
  }

  handle(message) {
    const m = message || {};
    if (m.type === 'chords') { this._post({ type: 'chords', unmapped: this._poller.setChords(m.chords) }); return; }
    if (m.type === 'inject') { this._inject(m.names || []); return; }
    if (m.type === 'release') { this._release(m.vks || []); return; }
    if (m.type === 'stop') { if (this._timer) this._ci(this._timer); this._exit(0); }
  }

  _inject(names) {
    const codes = names.map((n) => this._api.keycode(n)).filter((c) => c > 0);
    for (const c of codes) this._api.key(c, true);
    for (const c of [...codes].reverse()) this._api.key(c, false);
    this._api.flush();
  }

  _release(vks) {
    for (const [vk, keysyms] of X11ChordPoller.MODIFIERS) {
      if (!vks.includes(vk)) continue;
      for (const k of keysyms) { const c = this._api.keycodeOf(k); if (c > 0) this._api.key(c, false); }
    }
    this._api.flush();
  }
}

if (require.main === module || process.parentPort) X11BridgeWorker.main();

module.exports = X11BridgeWorker;

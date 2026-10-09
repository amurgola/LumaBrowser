const ChromeIdentity = require('../ChromeIdentity');
const ChromeObjectShim = require('../ChromeObjectShim');
const PasskeyShim = require('../PasskeyShim');

class IdentityOverride {
  static LOG_PREFIX = '[chromeIdentity]';

  static AUTO_ATTACH = { autoAttach: true, waitForDebuggerOnStart: false, flatten: true };

  static IGNORABLE_ERROR = /not found|detached|closed|No session/i;

  static _byWebContents = new WeakMap();

  static apply(wc, opts = {}) {
    if (!wc || wc.isDestroyed() || !wc.debugger) return;
    IdentityOverride._overrideFor(wc, opts).installReporting('could not attach debugger for UA override');
  }

  static _overrideFor(wc, opts) {
    let override = IdentityOverride._byWebContents.get(wc);
    if (!override) {
      override = new IdentityOverride(wc, opts.autoAttach !== false);
      IdentityOverride._byWebContents.set(wc, override);
      override._listen();
    }
    return override;
  }

  constructor(wc, autoAttach) {
    this._wc = wc;
    this._autoAttach = autoAttach;
  }

  installReporting(failureMessage) {
    try {
      this._install();
    } catch (err) {
      console.warn(`${IdentityOverride.LOG_PREFIX} ${failureMessage}:`, err.message);
    }
  }

  _install() {
    if (this._wc.isDestroyed()) return;
    if (!this._wc.debugger.isAttached()) this._wc.debugger.attach('1.3');
    this._setupTarget({ type: 'page', autoAttach: this._autoAttach });
  }

  _listen() {
    this._wc.debugger.on('message', (_e, method, params) => this._onMessage(method, params));
    this._wc.debugger.on('detach', () => this._onDetach());
  }

  _onMessage(method, params) {
    if (method !== 'Target.attachedToTarget' || !this._autoAttach) return;
    this._setupTarget({
      sessionId: params.sessionId,
      type: params.targetInfo && params.targetInfo.type,
      autoAttach: true,
      waiting: !!params.waitingForDebugger,
    });
  }

  _onDetach() {
    setImmediate(() => {
      if (this._wc.isDestroyed()) return;
      this.installReporting('re-install after detach failed');
    });
  }

  _setupTarget({ sessionId, type, autoAttach, waiting }) {
    const send = (method, params) => this._send(sessionId, type, method, params);
    if (IdentityOverride._isFrame(type)) IdentityOverride._setupFrame(send);
    else if (IdentityOverride._isWorker(type)) send('Network.setUserAgentOverride', ChromeIdentity.overrideParams());
    if (autoAttach && (IdentityOverride._isFrame(type) || IdentityOverride._isWorker(type))) {
      send('Target.setAutoAttach', IdentityOverride.AUTO_ATTACH);
    }
    if (waiting) send('Runtime.runIfWaitingForDebugger');
  }

  static _setupFrame(send) {
    send('Emulation.setUserAgentOverride', ChromeIdentity.overrideParams());
    send('Page.enable');
    send('Page.addScriptToEvaluateOnNewDocument', { source: `${ChromeObjectShim.SOURCE}\n${PasskeyShim.SOURCE}` });
  }

  _send(sessionId, type, method, params) {
    const args = sessionId ? [method, params || {}, sessionId] : [method, params || {}];
    this._wc.debugger.sendCommand(...args).catch((err) => {
      if (!IdentityOverride.IGNORABLE_ERROR.test(err.message)) {
        console.warn(`${IdentityOverride.LOG_PREFIX} ${method} (${type}) failed: ${err.message}`);
      }
    });
  }

  static _isFrame(type) {
    return type === 'page' || type === 'iframe';
  }

  static _isWorker(type) {
    return /worker/.test(type || '');
  }
}

module.exports = IdentityOverride;

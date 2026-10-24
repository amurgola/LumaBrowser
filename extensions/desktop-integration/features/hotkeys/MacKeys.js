const MacApi = require('./MacApi');

class MacKeys {
  static FLAGS = [[0x20000, 0x10], [0x40000, 0x11], [0x80000, 0x12], [0x100000, 0x5b]];
  static COMMAND = 0x100000;
  static COMBOS = { copy: 0x08, paste: 0x09 };
  static NO_PERMISSION = 'Allow LumaBrowser in System Settings > Privacy & Security > Accessibility, then try again';

  constructor({ platform = process.platform, loadApi = () => MacApi.load(), trusted = MacKeys._electronTrusted } = {}) {
    this._platform = platform;
    this._loadApi = loadApi;
    this._trusted = trusted;
    this._prompted = false;
  }

  get supported() {
    return this._platform === 'darwin';
  }

  unavailableReason() {
    let ok = true;
    try {
      ok = !!this._trusted(!this._prompted);
    } catch (_) {
      ok = true;
    }
    this._prompted = true;
    return ok ? null : MacKeys.NO_PERMISSION;
  }

  heldModifiers() {
    const flags = this._loadApi().flagsState();
    return MacKeys.FLAGS.filter(([mask]) => (flags & mask) !== 0).map(([, vk]) => vk);
  }

  clipboardSequence() {
    return this._loadApi().changeCount();
  }

  foregroundWindow() {
    return this._loadApi().frontmostPid() || 0;
  }

  focusWindow(pid) {
    return this._loadApi().activate(pid);
  }

  windowTitle(pid) {
    return this._loadApi().appName(pid) || '';
  }

  releaseKeys() {}

  sendCombo(name) {
    const key = MacKeys.COMBOS[name];
    if (key === undefined) throw new Error(`Unknown combo ${name}`);
    const api = this._loadApi();
    api.postKey(key, true, MacKeys.COMMAND);
    api.postKey(key, false, MacKeys.COMMAND);
  }

  static _electronTrusted(prompt) {
    const { systemPreferences } = require('electron');
    return typeof systemPreferences.isTrustedAccessibilityClient === 'function' ? systemPreferences.isTrustedAccessibilityClient(!!prompt) : true;
  }
}

module.exports = MacKeys;

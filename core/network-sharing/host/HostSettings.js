const crypto = require('crypto');
const os = require('os');

class HostSettings {
  static ENABLED_KEY = 'core.sharing.enabled';
  static PIN_KEY = 'core.sharing.pin';
  static NAME_KEY = 'core.sharing.instanceName';
  static INSTANCE_ID_KEY = 'core.sharing.instanceId';
  static BIND_MODE_KEY = 'core.sharing.bindMode';
  static TLS_PORT_KEY = 'core.sharing.tlsPort';
  static WEB_ENABLED_KEY = 'core.sharing.web.enabled';
  static WEB_PORT_KEY = 'core.sharing.web.port';
  static WEB_TOOLS_KEY = 'core.sharing.web.allowedTools';
  static WEB_PUBLIC_URL_KEY = 'core.sharing.web.publicUrl';
  static DEFAULT_WEB_PORT = 80;
  static DEFAULT_TLS_PORT = 3443;
  static MAX_NAME_LENGTH = 63;
  static PIN_PATTERN = /^\d{4,8}$/;
  static PUBLIC_URL_PATTERN = /^https?:\/\/[^\s/]+/i;

  static SHARE_FLAGS = {
    shareLocalLlm: { key: 'core.sharing.shareLocalLlm', fallback: true },
    shareRemoteLlms: { key: 'core.sharing.shareRemoteLlms', fallback: true },
    shareImageGen: { key: 'core.sharing.shareImageGen', fallback: true },
    shareImageEdit: { key: 'core.sharing.shareImageEdit', fallback: true },
    shareGpus: { key: 'core.sharing.shareGpus', fallback: false },
    shareAgents: { key: 'core.sharing.shareAgents', fallback: true },
    shareVoice: { key: 'core.sharing.shareVoice', fallback: true },
  };

  constructor(db) {
    this._db = db;
  }

  readEnabled() {
    return !!this._db.get(HostSettings.ENABLED_KEY, false);
  }

  writeEnabled(enabled) {
    this._db.set(HostSettings.ENABLED_KEY, !!enabled);
  }

  instanceId() {
    const existing = this._db.get(HostSettings.INSTANCE_ID_KEY, null);
    if (existing) return existing;
    const created = crypto.randomUUID();
    this._db.set(HostSettings.INSTANCE_ID_KEY, created);
    return created;
  }

  getPin() {
    return this._db.get(HostSettings.PIN_KEY, null);
  }

  hasPin() {
    return !!this.getPin();
  }

  setPin(pin) {
    const text = String(pin == null ? '' : pin).trim();
    if (!HostSettings.PIN_PATTERN.test(text)) return false;
    this._db.set(HostSettings.PIN_KEY, text);
    return true;
  }

  clearPin() {
    this._db.delete(HostSettings.PIN_KEY);
  }

  getInstanceName() {
    return this._db.get(HostSettings.NAME_KEY, '') || os.hostname() || 'LumaBrowser';
  }

  setInstanceName(name) {
    const text = String(name || '').slice(0, HostSettings.MAX_NAME_LENGTH).trim();
    if (text) this._db.set(HostSettings.NAME_KEY, text);
    else this._db.delete(HostSettings.NAME_KEY);
  }

  getBindMode() {
    return this._db.get(HostSettings.BIND_MODE_KEY, 'lan') === 'any' ? 'any' : 'lan';
  }

  setBindMode(mode) {
    this._db.set(HostSettings.BIND_MODE_KEY, mode === 'any' ? 'any' : 'lan');
  }

  getShareFlags() {
    const flags = {};
    for (const [name, { key, fallback }] of Object.entries(HostSettings.SHARE_FLAGS)) flags[name] = this._bool(key, fallback);
    return flags;
  }

  setShareFlag(flag, value) {
    const entry = Object.prototype.hasOwnProperty.call(HostSettings.SHARE_FLAGS, flag) ? HostSettings.SHARE_FLAGS[flag] : null;
    if (!entry) return false;
    this._db.set(entry.key, !!value);
    return true;
  }

  getTlsPort() {
    return HostSettings.validPort(this._db.get(HostSettings.TLS_PORT_KEY, HostSettings.DEFAULT_TLS_PORT)) || HostSettings.DEFAULT_TLS_PORT;
  }

  setTlsPort(port) {
    this._db.set(HostSettings.TLS_PORT_KEY, port);
  }

  isWebEnabled() {
    return this._bool(HostSettings.WEB_ENABLED_KEY, false);
  }

  setWebEnabled(enabled) {
    this._db.set(HostSettings.WEB_ENABLED_KEY, !!enabled);
  }

  getWebPort() {
    return HostSettings.validPort(this._db.get(HostSettings.WEB_PORT_KEY, HostSettings.DEFAULT_WEB_PORT)) || HostSettings.DEFAULT_WEB_PORT;
  }

  setWebPort(port) {
    this._db.set(HostSettings.WEB_PORT_KEY, port);
  }

  getWebPublicUrl() {
    const value = this._db.get(HostSettings.WEB_PUBLIC_URL_KEY, '');
    return typeof value === 'string' ? value : '';
  }

  setWebPublicUrl(url) {
    const text = String(url == null ? '' : url).trim().replace(/\/+$/, '');
    if (!text) {
      this._db.delete(HostSettings.WEB_PUBLIC_URL_KEY);
      return { success: true, webPublicUrl: '' };
    }
    if (!HostSettings.PUBLIC_URL_PATTERN.test(text)) {
      return { success: false, error: 'The URL must start with http:// or https:// (e.g. https://chat.example.com).' };
    }
    this._db.set(HostSettings.WEB_PUBLIC_URL_KEY, text);
    return { success: true, webPublicUrl: text };
  }

  getWebAllowedTools() {
    return this._db.get(HostSettings.WEB_TOOLS_KEY, null);
  }

  setWebAllowedTools(tools) {
    if (tools == null) this._db.delete(HostSettings.WEB_TOOLS_KEY);
    else this._db.set(HostSettings.WEB_TOOLS_KEY, tools);
  }

  static validPort(value) {
    const port = Number(value);
    return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : null;
  }

  _bool(key, fallback) {
    const value = this._db.get(key, fallback);
    return value === undefined || value === null ? fallback : !!value;
  }
}

module.exports = HostSettings;

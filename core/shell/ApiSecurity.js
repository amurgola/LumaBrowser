const IpClass = require('../shared/net/IpClass');
const ApiSecurityConfig = require('./api-security/ApiSecurityConfig');
const IpWhitelist = require('./api-security/IpWhitelist');
const ApiKeyEntry = require('./api-security/ApiKeyEntry');

class ApiSecurity {
  static STORAGE_KEY = ApiSecurityConfig.STORAGE_KEY;
  static VALID_MODES = ApiSecurityConfig.VALID_MODES;

  constructor(db) {
    this._db = db;
    this.reload();
  }

  reload() {
    this._cfg = this._readConfig();
    this._keyIndex = new Map(this._cfg.apiKeys.map((entry) => [entry.key, entry]));
    this._whitelist = new IpWhitelist(this._cfg.ipWhitelist);
  }

  middleware() {
    return (req, res, next) => {
      if (!this._originAllowed(IpClass.clientIp(req))) {
        return res.status(403).json({ error: 'Origin not allowed by API security policy' });
      }
      if (this._keyRequiredFor(req) && !this.isValidKey(ApiKeyEntry.fromHeaders(req.headers))) {
        return res.status(401).json({ error: 'Invalid or missing API key' });
      }
      return next();
    };
  }

  isValidKey(key) {
    if (!key || typeof key !== 'string') return false;
    return this._keyIndex.has(key.trim());
  }

  getConfig() {
    return {
      networkMode: this._cfg.networkMode,
      ipWhitelist: [...this._cfg.ipWhitelist],
      requireApiKey: this._cfg.requireApiKey,
      apiKeys: this._cfg.apiKeys.map((entry) => ({ ...entry })),
    };
  }

  setNetworkMode(mode) {
    if (!ApiSecurityConfig.isValidMode(mode)) return { success: false, error: `Invalid network mode: ${mode}` };
    this._update((cfg) => { cfg.networkMode = mode; });
    return { success: true };
  }

  setWhitelist(list) {
    if (!Array.isArray(list)) return { success: false, error: 'Whitelist must be an array' };
    const cleaned = ApiSecurity._cleanWhitelist(list);
    if (cleaned.invalid) return { success: false, error: `Invalid IP or CIDR: ${cleaned.invalid}` };
    this._update((cfg) => { cfg.ipWhitelist = cleaned.entries; });
    return { success: true };
  }

  setRequireApiKey(enabled) {
    this._update((cfg) => { cfg.requireApiKey = !!enabled; });
    return { success: true };
  }

  createKey(label) {
    const entry = ApiKeyEntry.create(label);
    this._update((cfg) => { cfg.apiKeys = [...cfg.apiKeys, entry]; });
    return { success: true, key: entry };
  }

  updateKeyLabel(id, label) {
    return this._replaceKey(id, (entry) => ApiKeyEntry.relabeled(entry, label));
  }

  refreshKey(id) {
    return this._replaceKey(id, (entry) => ApiKeyEntry.refreshed(entry));
  }

  deleteKey(id) {
    const cfg = this._readConfig();
    const kept = cfg.apiKeys.filter((entry) => entry.id !== id);
    if (kept.length === cfg.apiKeys.length) return { success: false, error: 'Key not found' };
    cfg.apiKeys = kept;
    this._writeConfig(cfg);
    return { success: true };
  }

  _originAllowed(ip) {
    switch (this._cfg.networkMode) {
      case 'any': return true;
      case 'system': return IpClass.isLoopbackIp(ip);
      case 'lan': return IpClass.isLanPeer(ip);
      case 'whitelist': return this._whitelist.matches(ip);
      default: return false;
    }
  }

  _keyRequiredFor(req) {
    return this._cfg.requireApiKey && req.path !== '/health';
  }

  _replaceKey(id, change) {
    const cfg = this._readConfig();
    const index = cfg.apiKeys.findIndex((entry) => entry.id === id);
    if (index < 0) return { success: false, error: 'Key not found' };
    cfg.apiKeys[index] = change(cfg.apiKeys[index]);
    this._writeConfig(cfg);
    return { success: true, key: cfg.apiKeys[index] };
  }

  static _cleanWhitelist(list) {
    const entries = [];
    for (const raw of list) {
      const entry = String(raw || '').trim();
      if (!entry || entries.includes(entry)) continue;
      if (!IpWhitelist.isValidEntry(entry)) return { entries, invalid: entry };
      entries.push(entry);
    }
    return { entries, invalid: null };
  }

  _update(change) {
    const cfg = this._readConfig();
    change(cfg);
    this._writeConfig(cfg);
  }

  _readConfig() {
    const stored = this._db ? this._db.get(ApiSecurityConfig.STORAGE_KEY, null) : null;
    return ApiSecurityConfig.normalize(stored);
  }

  _writeConfig(cfg) {
    if (this._db) this._db.set(ApiSecurityConfig.STORAGE_KEY, cfg);
    this.reload();
  }
}

module.exports = ApiSecurity;

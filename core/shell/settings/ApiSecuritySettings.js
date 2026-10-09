class ApiSecuritySettings {
  static UNAVAILABLE = { success: false, error: 'API security not available' };
  static MASK = '******';
  static MIN_UNMASKED_LENGTH = 13;

  constructor(apiSecurity) {
    this._security = apiSecurity;
  }

  static mask(key) {
    return key && key.length >= ApiSecuritySettings.MIN_UNMASKED_LENGTH ? `${key.slice(0, 6)}...${key.slice(-4)}` : ApiSecuritySettings.MASK;
  }

  getConfig() {
    if (!this._security) return null;
    const config = this._security.getConfig();
    return config && { ...config, apiKeys: (config.apiKeys || []).map(ApiSecuritySettings._maskedEntry) };
  }

  revealKey(id) {
    if (!this._security) return { ...ApiSecuritySettings.UNAVAILABLE };
    const entry = (this._security.getConfig().apiKeys || []).find((k) => k.id === id);
    if (!entry) return { success: false, error: 'Key not found' };
    return { success: true, key: entry.key };
  }

  setNetworkMode(mode) { return this._call((s) => s.setNetworkMode(mode)); }
  setWhitelist(list) { return this._call((s) => s.setWhitelist(list)); }
  setRequireApiKey(enabled) { return this._call((s) => s.setRequireApiKey(enabled)); }
  createKey(label) { return this._call((s) => s.createKey(label)); }
  refreshKey(id) { return this._call((s) => s.refreshKey(id)); }
  deleteKey(id) { return this._call((s) => s.deleteKey(id)); }

  updateKeyLabel(id, label) {
    return this._call((s) => {
      const result = s.updateKeyLabel(id, label);
      if (result && result.key) result.key = ApiSecuritySettings._maskedEntry(result.key);
      return result;
    });
  }

  _call(fn) {
    if (!this._security) return { ...ApiSecuritySettings.UNAVAILABLE };
    return fn(this._security);
  }

  static _maskedEntry(entry) {
    return { ...entry, key: ApiSecuritySettings.mask(entry.key) };
  }
}

module.exports = ApiSecuritySettings;

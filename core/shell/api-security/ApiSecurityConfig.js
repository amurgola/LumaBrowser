class ApiSecurityConfig {
  static STORAGE_KEY = 'core.apiSecurity';
  static VALID_MODES = new Set(['any', 'system', 'lan', 'whitelist']);

  static freshNetworkMode(env = process.env) {
    return env.LUMA_DOCKER ? 'any' : 'system';
  }

  static defaults(env = process.env) {
    return { networkMode: ApiSecurityConfig.freshNetworkMode(env), ipWhitelist: [], requireApiKey: false, apiKeys: [] };
  }

  static isValidMode(mode) {
    return ApiSecurityConfig.VALID_MODES.has(mode);
  }

  static normalize(raw, env = process.env) {
    const cfg = { ...ApiSecurityConfig.defaults(env), ...(raw || {}) };
    cfg.networkMode = ApiSecurityConfig._normalizedMode(cfg.networkMode, raw, env);
    if (!Array.isArray(cfg.ipWhitelist)) cfg.ipWhitelist = [];
    if (!Array.isArray(cfg.apiKeys)) cfg.apiKeys = [];
    cfg.requireApiKey = !!cfg.requireApiKey;
    return cfg;
  }

  static _normalizedMode(mode, raw, env) {
    if (ApiSecurityConfig.isValidMode(mode)) return mode;
    return raw ? 'any' : ApiSecurityConfig.freshNetworkMode(env);
  }
}

module.exports = ApiSecurityConfig;

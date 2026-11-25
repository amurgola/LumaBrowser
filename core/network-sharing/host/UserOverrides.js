const HostSettings = require('./HostSettings');

class UserOverrides {
  static LIST_FIELDS = ['llms', 'imageModels', 'tools'];
  static LIST_MAX = 500;

  static normalize(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const normalized = { shareFlags: UserOverrides._flags(source.shareFlags) };
    for (const field of UserOverrides.LIST_FIELDS) normalized[field] = UserOverrides._list(source[field]);
    return normalized;
  }

  static isEmpty(overrides) {
    const normalized = UserOverrides.normalize(overrides);
    return Object.keys(normalized.shareFlags).length === 0 && UserOverrides.LIST_FIELDS.every((field) => normalized[field] === null);
  }

  static _flags(raw) {
    const flags = {};
    if (!raw || typeof raw !== 'object') return flags;
    for (const name of Object.keys(HostSettings.SHARE_FLAGS)) {
      if (typeof raw[name] === 'boolean') flags[name] = raw[name];
    }
    return flags;
  }

  static _list(raw) {
    if (!Array.isArray(raw)) return null;
    const names = raw.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
    return [...new Set(names)].slice(0, UserOverrides.LIST_MAX);
  }
}

module.exports = UserOverrides;

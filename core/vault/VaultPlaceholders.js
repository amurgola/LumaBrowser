class VaultPlaceholders {
  static PATTERN = /\{\{\s*vault:([a-z0-9._-]+)\s*\}\}/gi;
  static _resolver = null;

  static install(resolver) {
    VaultPlaceholders._resolver = typeof resolver === 'function' ? resolver : null;
  }

  static namesIn(value) {
    const names = new Set();
    VaultPlaceholders._walk(value, (s) => {
      for (const m of s.matchAll(VaultPlaceholders.PATTERN)) names.add(m[1].toLowerCase());
      return s;
    });
    return [...names];
  }

  static replace(value, values) {
    return VaultPlaceholders._walk(value, (s) => s.replace(VaultPlaceholders.PATTERN, (all, name) => {
      const v = values[name.toLowerCase()];
      return v == null ? all : v;
    }));
  }

  static resolveFor(toolName, params, caller) {
    if (!VaultPlaceholders.namesIn(params).length) return { params };
    if (!VaultPlaceholders._resolver) return { error: 'Vault placeholders need the password manager, which is not available here.' };
    try {
      return VaultPlaceholders._resolver(toolName, params, caller || {});
    } catch (err) {
      return { error: `Vault placeholders could not be resolved: ${err.message}` };
    }
  }

  static _walk(value, onString, depth = 0) {
    if (typeof value === 'string') return onString(value);
    if (depth > 8 || !value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((v) => VaultPlaceholders._walk(v, onString, depth + 1));
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = VaultPlaceholders._walk(v, onString, depth + 1);
    return out;
  }
}

module.exports = VaultPlaceholders;

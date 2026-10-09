const ConfigValue = require('./ConfigValue');
const KeyPath = require('./KeyPath');

class TomlRenderer {
  static key(name) {
    return KeyPath.BARE_KEY.test(name) ? name : JSON.stringify(name);
  }

  static keyPath(path) {
    return path.map((name) => TomlRenderer.key(name)).join('.');
  }

  static pair(name, value) {
    return `${TomlRenderer.key(name)} = ${TomlRenderer.value(value)}`;
  }

  static table(path, table, eol) {
    const lines = [`[${TomlRenderer.keyPath(path)}]`, ...Object.entries(table).map(([k, v]) => TomlRenderer.pair(k, v))];
    return lines.join(eol) + eol;
  }

  static value(value) {
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number') return TomlRenderer._number(value);
    if (typeof value === 'boolean' || typeof value === 'bigint') return String(value);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return `[${value.map((v) => TomlRenderer.value(v)).join(', ')}]`;
    if (ConfigValue.isTable(value)) return TomlRenderer._inlineTable(value);
    throw new TypeError(`TOML has no way to write ${value === null ? 'null' : typeof value}`);
  }

  static _number(n) {
    if (Number.isNaN(n)) return 'nan';
    if (!Number.isFinite(n)) return n > 0 ? 'inf' : '-inf';
    return String(n);
  }

  static _inlineTable(table) {
    const entries = Object.entries(table).map(([k, v]) => TomlRenderer.pair(k, v));
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  }
}

module.exports = TomlRenderer;

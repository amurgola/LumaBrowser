class FeatureSettingsSchema {
  static TYPES = new Set(['text', 'textarea', 'number', 'bool', 'select', 'hotkey']);
  static KEY_PATTERN = /^[A-Za-z0-9_.-]{1,60}$/;
  static MAX_TEXT = 20000;

  static normalize(raw) {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    const fields = [];
    for (const entry of raw) {
      const field = FeatureSettingsSchema._field(entry);
      if (!field || seen.has(field.key)) continue;
      seen.add(field.key);
      fields.push(field);
    }
    return fields;
  }

  static withValues(fields, settings) {
    return fields.map((f) => ({ ...f, value: settings.get(f.key, f.default) }));
  }

  static coerce(fields, key, value) {
    const field = fields.find((f) => f.key === key);
    if (!field) throw new Error(`Unknown setting "${key}"`);
    switch (field.type) {
      case 'bool': return value === true || value === 'true' || value === 1 || value === '1';
      case 'number': return FeatureSettingsSchema._number(field, value);
      case 'select': return FeatureSettingsSchema._option(field, value);
      default: return String(value == null ? '' : value).slice(0, FeatureSettingsSchema.MAX_TEXT);
    }
  }

  static _field(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const key = String(entry.key || '');
    const type = FeatureSettingsSchema.TYPES.has(entry.type) ? entry.type : 'text';
    if (!FeatureSettingsSchema.KEY_PATTERN.test(key)) return null;
    const field = { key, type, label: String(entry.label || key), help: entry.help ? String(entry.help) : '', default: entry.default === undefined ? null : entry.default };
    if (type === 'select') field.options = FeatureSettingsSchema._options(entry.options);
    if (type === 'number') Object.assign(field, FeatureSettingsSchema._bounds(entry));
    return field;
  }

  static _options(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((o) => (o && typeof o === 'object' ? { value: o.value, label: String(o.label == null ? o.value : o.label) } : { value: o, label: String(o) }));
  }

  static _bounds(entry) {
    const out = {};
    for (const k of ['min', 'max', 'step']) if (Number.isFinite(entry[k])) out[k] = entry[k];
    return out;
  }

  static _number(field, value) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`"${field.label}" must be a number`);
    if (field.min !== undefined && n < field.min) throw new Error(`"${field.label}" must be at least ${field.min}`);
    if (field.max !== undefined && n > field.max) throw new Error(`"${field.label}" must be at most ${field.max}`);
    return n;
  }

  static _option(field, value) {
    const match = field.options.find((o) => String(o.value) === String(value));
    if (!match) throw new Error(`"${field.label}" has no option "${value}"`);
    return match.value;
  }
}

module.exports = FeatureSettingsSchema;

class BareArgumentRepair {
  static ABSOLUTE_URL = /^https?:\/\/\S+$/i;

  constructor(schemas) {
    this._schemas = schemas;
  }

  repair(name, params) {
    if (params == null) return {};
    if (typeof params !== 'string') return params;
    if (!params.trim()) return {};
    const field = this._fieldFor(name, params.trim());
    return field ? { [field]: params } : params;
  }

  _fieldFor(name, text) {
    const entry = this._schemas && this._schemas.entry(name);
    if (!entry) return null;
    const properties = entry.properties || {};
    const required = entry.required || [];
    if (BareArgumentRepair.ABSOLUTE_URL.test(text) && BareArgumentRepair._isText(properties.url)) return 'url';
    if (required.length === 1) return BareArgumentRepair._isText(properties[required[0]]) ? required[0] : null;
    if (required.length > 1) return null;
    return Object.keys(properties).find((key) => BareArgumentRepair._isText(properties[key])) || null;
  }

  static _isText(property) {
    if (!property) return false;
    if (typeof property === 'string') return /^string\b/.test(property);
    const type = property.type;
    return type === 'string' || (Array.isArray(type) && type.includes('string'));
  }
}

module.exports = BareArgumentRepair;

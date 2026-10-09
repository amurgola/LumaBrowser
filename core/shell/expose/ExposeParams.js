class ExposeParams {
  static SCHEMA_KEYS = ['description', 'items', 'properties', 'enum'];

  static toInputSchema(params) {
    const properties = {};
    const required = [];
    for (const [name, def] of Object.entries(params || {})) {
      properties[name] = ExposeParams._schemaProperty(def);
      if (def.required) required.push(name);
    }
    return { type: 'object', properties, required };
  }

  static coerce(args, params) {
    for (const [name, def] of Object.entries(params || {})) {
      if (typeof args[name] !== 'string') continue;
      args[name] = ExposeParams._coerceValue(args[name], def.type);
    }
    return args;
  }

  static missingRequired(args, params) {
    return Object.entries(params || {})
      .filter(([name, def]) => def.required && ExposeParams._isBlank(args[name]))
      .map(([name]) => name);
  }

  static _schemaProperty(def) {
    const prop = { type: def.type || 'string' };
    for (const key of ExposeParams.SCHEMA_KEYS) {
      if (def[key]) prop[key] = def[key];
    }
    if (def.default !== undefined) prop.default = def.default;
    return prop;
  }

  static _coerceValue(value, type) {
    if (type === 'number') return Number(value);
    if (type === 'boolean') return value === 'true' || value === '1';
    if (type === 'array' || type === 'object') return ExposeParams._parseJsonOr(value);
    return value;
  }

  static _parseJsonOr(value) {
    try { return JSON.parse(value); } catch (_) { return value; }
  }

  static _isBlank(value) {
    return value === undefined || value === null || value === '';
  }
}

module.exports = ExposeParams;

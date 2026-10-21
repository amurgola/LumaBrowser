class ParamTemplate {
  static NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
  static PLACEHOLDER = /\{\{\s*([a-z][a-z0-9_]*)\s*(?:\|\s*(url|raw)\s*)?\}\}/g;
  static TYPES = Object.freeze(['string', 'number', 'boolean']);

  static normalizeParam(param, index) {
    const name = String((param && param.name) || '').trim();
    if (!ParamTemplate.NAME_PATTERN.test(name)) {
      throw new Error(`Param ${index + 1}: name must be snake_case letters, digits and underscores (got "${name}")`);
    }
    const type = param.type && ParamTemplate.TYPES.includes(param.type) ? param.type : 'string';
    const out = {
      name,
      type,
      required: param.required !== false && param.default === undefined,
      description: String(param.description || ''),
    };
    if (param.default !== undefined) out.default = ParamTemplate._coerce(param.default, type, name);
    if (param.example !== undefined) out.example = param.example;
    return out;
  }

  static resolve(params, input = {}) {
    const values = {};
    const source = input && typeof input === 'object' ? input : {};
    for (const param of params || []) {
      const given = source[param.name];
      if (given === undefined || given === null || given === '') {
        if (param.default !== undefined) { values[param.name] = param.default; continue; }
        if (param.required) return { ok: false, error: `Missing required parameter "${param.name}"` };
        values[param.name] = param.type === 'string' ? '' : null;
        continue;
      }
      try {
        values[param.name] = ParamTemplate._coerce(given, param.type, param.name);
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }
    return { ok: true, values };
  }

  static render(value, values, { encode = false } = {}) {
    if (typeof value === 'string') return ParamTemplate._renderString(value, values, encode);
    if (Array.isArray(value)) return value.map((item) => ParamTemplate.render(item, values, { encode }));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [key, item] of Object.entries(value)) out[key] = ParamTemplate.render(item, values, { encode });
      return out;
    }
    return value;
  }

  static referenced(value, found = new Set()) {
    if (typeof value === 'string') {
      for (const match of value.matchAll(ParamTemplate.PLACEHOLDER)) found.add(match[1]);
    } else if (Array.isArray(value)) {
      value.forEach((item) => ParamTemplate.referenced(item, found));
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach((item) => ParamTemplate.referenced(item, found));
    }
    return found;
  }

  static inputSchema(params) {
    const properties = {};
    const required = [];
    for (const param of params || []) {
      properties[param.name] = { type: param.type, description: param.description || '' };
      if (param.default !== undefined) properties[param.name].default = param.default;
      if (param.example !== undefined) properties[param.name].examples = [param.example];
      if (param.required) required.push(param.name);
    }
    return { type: 'object', properties, required };
  }

  static _renderString(text, values, encode) {
    return text.replace(ParamTemplate.PLACEHOLDER, (whole, name, filter) => {
      if (!(name in (values || {}))) return whole;
      const value = values[name];
      const str = value == null ? '' : String(value);
      const shouldEncode = filter === 'url' || (encode && filter !== 'raw');
      return shouldEncode ? encodeURIComponent(str) : str;
    });
  }

  static _coerce(value, type, name) {
    if (type === 'number') {
      const n = typeof value === 'number' ? value : Number(String(value).trim());
      if (!Number.isFinite(n)) throw new Error(`Parameter "${name}" must be a number`);
      return n;
    }
    if (type === 'boolean') {
      if (typeof value === 'boolean') return value;
      const s = String(value).trim().toLowerCase();
      if (['true', '1', 'yes'].includes(s)) return true;
      if (['false', '0', 'no'].includes(s)) return false;
      throw new Error(`Parameter "${name}" must be true or false`);
    }
    return typeof value === 'string' ? value : String(value);
  }
}

module.exports = ParamTemplate;

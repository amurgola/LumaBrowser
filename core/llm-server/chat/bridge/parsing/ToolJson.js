const BrowserTools = require('../../../../llm-service/BrowserTools');
const TruncatedJsonRepair = require('./TruncatedJsonRepair');

class ToolJson {
  static NAME_KEYS = ['tool', 'name'];
  static RESERVED_KEYS = new Set(['tool', 'name', 'params', 'arguments']);

  static read(text) {
    const raw = String(text).trim();
    const strict = ToolJson._readStrict(raw);
    if (strict !== undefined) return strict;
    return ToolJson._readRepaired(raw) || ToolJson._readUnkeyedName(raw);
  }

  static fromObject(o) {
    if (!o || typeof o !== 'object') return null;
    const inner = ToolJson._doubledWrapper(o);
    if (inner) return inner;
    const tool = typeof o.tool === 'string' ? o.tool : (typeof o.name === 'string' ? o.name : null);
    const params = ToolJson._argsObject(o);
    if (!tool || !params) return null;
    return ToolJson._withMarkers({ tool, params }, o);
  }

  static restAsParams(o) {
    const out = {};
    for (const key of Object.keys(o)) {
      if (!ToolJson.RESERVED_KEYS.has(key)) out[key] = o[key];
    }
    return out;
  }

  static _readStrict(raw) {
    for (const text of [raw, BrowserTools.fixIllegalJsonEscapes(raw)]) {
      let obj;
      try { obj = JSON.parse(text); } catch (_) { continue; }
      return ToolJson.fromObject(obj) || ToolJson._flattenedOnToolKey(obj);
    }
    return undefined;
  }

  static _flattenedOnToolKey(obj) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj) && typeof obj.tool === 'string') {
      return { tool: obj.tool, params: ToolJson.restAsParams(obj) };
    }
    return null;
  }

  static _readRepaired(raw) {
    try {
      const repaired = TruncatedJsonRepair.repair(raw);
      if (repaired === raw) return null;
      const call = ToolJson.fromObject(JSON.parse(repaired));
      return call ? { ...call, __repaired: true } : null;
    } catch (_) {
      return null;
    }
  }

  static _readUnkeyedName(raw) {
    const fixed = raw.replace(/^\{\s*"([A-Za-z0-9_]+)"\s*,/, '{"tool":"$1",');
    if (fixed === raw) return null;
    try {
      const o = JSON.parse(fixed);
      if (!o || typeof o.tool !== 'string') return null;
      return { tool: o.tool, params: ToolJson._argsObject(o) || ToolJson.restAsParams(o) };
    } catch (_) {
      return null;
    }
  }

  static _doubledWrapper(o) {
    for (const key of ToolJson.NAME_KEYS) {
      if (o[key] && typeof o[key] === 'object' && !Array.isArray(o[key])) {
        const inner = ToolJson.fromObject(o[key]);
        if (inner) return inner;
      }
    }
    return null;
  }

  static _argsObject(o) {
    if (o.params && typeof o.params === 'object') return o.params;
    if (o.arguments && typeof o.arguments === 'object') return o.arguments;
    return null;
  }

  static _withMarkers(out, o) {
    if (typeof o.__argsLost === 'string') out.__argsLost = o.__argsLost;
    if (o.__argsCut === true) out.__argsCut = true;
    if (o.__repaired === true) out.__repaired = true;
    return out;
  }
}

module.exports = ToolJson;

const BalancedJson = require('../../../../shared/llm/BalancedJson');
const BrowserTools = require('../../../../llm-service/BrowserTools');
const ToolJson = require('./ToolJson');
const TruncatedJsonRepair = require('./TruncatedJsonRepair');

class XmlToolCallParser {
  static OPEN = /<tool_call>|<function\s*=|<function\s+name\s*=/i;
  static OPEN_GLOBAL = /<tool_call>|<function\s*=|<function\s+name\s*=/gi;
  static FN_NAME = /<function(?:=|\s+name\s*=\s*)["']?([A-Za-z0-9_.:-]+)/i;
  static PARAM = /<parameter\s*(?:=\s*|name\s*=\s*)["']?([A-Za-z0-9_.:-]+)["']?\s*>([\s\S]*?)<\/parameter>/gi;
  static WRAPPER_OPEN = '<tool_call>';
  static WRAPPER_CLOSE = '</tool_call>';
  static PLACEHOLDER_NAME = 'tool';

  static hasOpener(content) {
    return XmlToolCallParser.OPEN.test(String(content || ''));
  }

  static parseLast(content) {
    if (!content) return null;
    const s = String(content);
    if (!XmlToolCallParser.OPEN.test(s)) return null;
    const wrapAt = s.toLowerCase().lastIndexOf(XmlToolCallParser.WRAPPER_OPEN);
    const fnAt = XmlToolCallParser.FN_NAME.test(s) ? s.search(XmlToolCallParser.FN_NAME) : -1;
    const start = wrapAt >= 0 ? wrapAt : fnAt;
    if (start < 0) return null;
    return XmlToolCallParser.parseRegion(s.slice(start));
  }

  static parseAll(content) {
    if (!content) return [];
    const s = String(content);
    if (!XmlToolCallParser.OPEN.test(s)) return [];
    const starts = XmlToolCallParser._callStarts(s);
    if (starts.length < 2) return [];
    const out = [];
    for (let i = 0; i < starts.length; i++) {
      const got = XmlToolCallParser.parseRegion(s.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : s.length));
      if (got) out.push(got);
    }
    return out;
  }

  static parseRegion(raw) {
    const region = String(raw);
    const nameMatch = XmlToolCallParser.FN_NAME.exec(region);
    const xmlName = (nameMatch && nameMatch[1] !== XmlToolCallParser.PLACEHOLDER_NAME) ? nameMatch[1] : null;
    const brace = region.indexOf('{');
    const fromJson = brace === -1 ? null : XmlToolCallParser._fromJsonBody(region, brace, xmlName);
    if (fromJson) return fromJson;
    return XmlToolCallParser._fromParameters(region, xmlName, brace !== -1);
  }

  static coerceParam(raw) {
    const v = String(raw).trim();
    if (!/^(true|false|null|-?\d|[[{])/.test(v)) return v;
    try {
      const parsed = JSON.parse(v);
      return (typeof parsed === 'string') ? v : parsed;
    } catch (_) {
      return v;
    }
  }

  static _callStarts(s) {
    const lower = s.toLowerCase();
    const starts = [];
    let wrapperEnd = -1;
    const re = new RegExp(XmlToolCallParser.OPEN_GLOBAL.source, 'gi');
    let m;
    while ((m = re.exec(s)) !== null) {
      if (m.index < wrapperEnd) continue;
      starts.push(m.index);
      if (m[0].toLowerCase() === XmlToolCallParser.WRAPPER_OPEN) {
        const close = lower.indexOf(XmlToolCallParser.WRAPPER_CLOSE, m.index);
        wrapperEnd = close === -1 ? s.length : close + XmlToolCallParser.WRAPPER_CLOSE.length;
      }
    }
    return starts;
  }

  static _fromJsonBody(region, brace, xmlName) {
    const balanced = BalancedJson.extractObject(region, brace);
    const slice = balanced || TruncatedJsonRepair.repair(region.slice(brace));
    const cut = balanced ? {} : { __repaired: true };
    const obj = XmlToolCallParser._parseObject(slice);
    if (!obj || typeof obj !== 'object') return null;
    const whole = ToolJson.fromObject(obj);
    if (whole) return { ...whole, ...cut };
    if (xmlName) return { tool: xmlName, params: obj, ...cut };
    return null;
  }

  static _parseObject(slice) {
    try { return JSON.parse(slice); } catch (_) {}
    try { return JSON.parse(BrowserTools.fixIllegalJsonEscapes(slice)); } catch (_) { return null; }
  }

  static _fromParameters(region, xmlName, hadJsonBody) {
    if (!xmlName || !/<parameter|<\/function>|<\/tool_call>/i.test(region)) return null;
    const params = {};
    let found = 0;
    const re = new RegExp(XmlToolCallParser.PARAM.source, 'gi');
    let pm;
    while ((pm = re.exec(region)) !== null) {
      params[pm[1]] = XmlToolCallParser.coerceParam(pm[2]);
      found += 1;
    }
    if (!found && hadJsonBody) return null;
    return { tool: xmlName, params };
  }
}

module.exports = XmlToolCallParser;

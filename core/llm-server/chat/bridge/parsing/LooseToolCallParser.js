const BalancedJson = require('../../../../shared/llm/BalancedJson');
const HarmonyLeakedToolCallParser = require('../../HarmonyLeakedToolCallParser');
const ToolJson = require('./ToolJson');
const XmlToolCallParser = require('./XmlToolCallParser');

class LooseToolCallParser {
  static FENCE = /```([^\n`]*)\n?([\s\S]*?)```/g;
  static BARE_MARKER = /\{\s*"tool"\s*:/g;

  static parseFirst(content) {
    const calls = LooseToolCallParser.parseAll(content);
    return calls.length ? calls[0] : null;
  }

  static parseAll(content) {
    if (!content) return [];
    const s = String(content);
    const fenced = new LooseToolCallParser(s)._jsonCalls();
    if (fenced.length) return fenced;
    const xml = XmlToolCallParser.parseAll(s);
    if (xml.length) return xml;
    const oneXml = XmlToolCallParser.parseLast(s);
    if (oneXml) return [oneXml];
    return HarmonyLeakedToolCallParser.parseAll(s, BalancedJson.extractObject);
  }

  constructor(text) {
    this._s = text;
    this._out = [];
    this._spans = [];
  }

  _jsonCalls() {
    this._readFences();
    this._readUnterminatedFence();
    this._readBareObjects();
    return this._out;
  }

  _readFences() {
    const s = this._s;
    const re = new RegExp(LooseToolCallParser.FENCE.source, 'g');
    let m;
    while ((m = re.exec(s)) !== null) {
      const bodyAt = m.index + m[0].length - m[2].length - 3;
      const brace = s.indexOf('{', bodyAt);
      const balanced = brace === -1 ? null : BalancedJson.extractObject(s, brace);
      const got = ToolJson.read(balanced || m[2]);
      if (!got) continue;
      this._out.push(got);
      if (balanced) {
        const end = brace + balanced.length;
        this._spans.push([m.index, end]);
        if (end > re.lastIndex) re.lastIndex = end;
      } else {
        this._spans.push([m.index, m.index + m[0].length]);
      }
    }
  }

  _readUnterminatedFence() {
    const s = this._s;
    const openOnly = s.lastIndexOf('```');
    if (openOnly === -1 || this._spans.some(([a, b]) => openOnly >= a && openOnly < b)) return;
    const tail = s.slice(openOnly + 3).replace(/^[^\n`]*\n?/, '');
    if (tail.indexOf('```') !== -1) return;
    const got = ToolJson.read(tail);
    if (got) {
      this._out.push(got);
      this._spans.push([openOnly, s.length]);
    }
  }

  _readBareObjects() {
    const s = this._s;
    const re = new RegExp(LooseToolCallParser.BARE_MARKER.source, 'g');
    let lastUnbalanced = -1;
    let bm;
    while ((bm = re.exec(s)) !== null) {
      const at = bm.index;
      if (this._insideAccepted(at)) continue;
      const slice = BalancedJson.extractObject(s, at);
      if (!slice) { lastUnbalanced = at; continue; }
      this._spans.push([at, at + slice.length]);
      const got = ToolJson.read(slice);
      if (got) this._out.push(got);
    }
    if (lastUnbalanced !== -1 && !this._insideAccepted(lastUnbalanced)) {
      const got = ToolJson.read(s.slice(lastUnbalanced));
      if (got) this._out.push(got);
    }
  }

  _insideAccepted(index) {
    return this._spans.some(([a, b]) => index > a && index < b);
  }
}

module.exports = LooseToolCallParser;

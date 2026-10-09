const BrowserTools = require('../../../../llm-service/BrowserTools');
const CallMarkers = require('./CallMarkers');
const LooseToolCallParser = require('./LooseToolCallParser');
const OffFormatShape = require('./OffFormatShape');
const ToolCallSniffer = require('./ToolCallSniffer');

class RunToolCallParser {
  constructor({ health, maxMalformedReprompts }) {
    this._health = health;
    this._maxReprompts = maxMalformedReprompts;
    this._reprompts = 0;
    this._lastCallRepaired = false;
    this.sawOffFormat = false;
  }

  parseToolCall(content) {
    const calls = this.parseToolCalls(content);
    return calls.length ? calls[0] : null;
  }

  parseToolCalls(content) {
    const strict = BrowserTools.parseToolCalls(content);
    const calls = strict.length ? strict : LooseToolCallParser.parseAll(content);
    this._noteDrift(content, strict, calls);
    if (calls.length) return this._withMarkersMoved(calls);
    return this._malformedReprompt(content);
  }

  takeLastCallRepaired() {
    const repaired = this._lastCallRepaired;
    this._lastCallRepaired = false;
    return repaired;
  }

  _noteDrift(content, strict, calls) {
    if (!strict.length && calls.length) {
      this.sawOffFormat = true;
      this._health.noteOffFormat(OffFormatShape.of(content));
      return;
    }
    const coerced = strict.length ? calls.find((c) => c && c.__coerced) : null;
    if (coerced) {
      this.sawOffFormat = true;
      this._health.noteOffFormat(coerced.__coerced);
    }
  }

  _withMarkersMoved(calls) {
    for (const call of calls) {
      const repaired = CallMarkers.transfer(call);
      if (repaired && calls.length === 1) this._lastCallRepaired = true;
    }
    return calls;
  }

  _malformedReprompt(content) {
    if (this._reprompts >= this._maxReprompts || !ToolCallSniffer.looksLikeAttempt(content)) return [];
    this._reprompts++;
    this.sawOffFormat = true;
    return [{ tool: CallMarkers.MALFORMED_TOOL, params: {} }];
  }
}

module.exports = RunToolCallParser;

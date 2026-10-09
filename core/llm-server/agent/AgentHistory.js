const TokenEstimator = require('../../shared/text/TokenEstimator');
const AgentLoopText = require('./AgentLoopText');
const CarriedNotesLedger = require('./CarriedNotesLedger');
const ToolHistoryBudget = require('./ToolHistoryBudget');
const ToolHistoryEvictor = require('./ToolHistoryEvictor');

class AgentHistory {
  static DEFAULT_TOOL = 'tool';
  static SHRINK_MIN_KEEP = 2000;

  static charsOf(messages) {
    let n = 0;
    for (const message of messages || []) n += AgentHistory._contentChars(message && message.content);
    return n;
  }

  constructor(options) {
    this._ctxPerSlot = options.ctxPerSlot;
    this._nativeToolsTokens = Number(options.nativeToolsTokens) || 0;
    this._onEvicted = options.onEvicted || null;
    this._messages = [];
    this._toolLedger = [];
    this._notes = new CarriedNotesLedger(options.carriedTotal);
    this._screenshotIndex = -1;
  }

  get messages() {
    return this._messages;
  }

  get length() {
    return this._messages.length;
  }

  push(role, content) {
    this._messages.push({ role, content });
  }

  last() {
    return this._messages[this._messages.length - 1];
  }

  popLast() {
    return this._messages.pop();
  }

  chars() {
    return AgentHistory.charsOf(this._messages);
  }

  fixedTokens() {
    const first = this._messages[0];
    const system = first && first.role === 'system' ? String(first.content || '') : '';
    return Math.ceil(system.length / TokenEstimator.CHARS_PER_TOKEN) + this._nativeToolsTokens;
  }

  softToolBudget() {
    return ToolHistoryBudget.soft(this._ctxPerSlot, this.fixedTokens());
  }

  hardToolBudget() {
    return ToolHistoryBudget.hard(this._ctxPerSlot, this.fixedTokens());
  }

  toolHistoryChars() {
    return this._toolLedger.reduce((n, entry) => n + entry.chars, 0);
  }

  pushToolResult(base, notes = '', tool = AgentHistory.DEFAULT_TOOL, params = null) {
    this.push('user', notes ? base + notes : base);
    const index = this._messages.length - 1;
    this._toolLedger.push({ index, tool, params, chars: base.length });
    this.evictToolHistory(this.softToolBudget(), this.hardToolBudget());
    if (notes) this._notes.track(this._messages, index, notes);
  }

  evictToolHistory(budget, hardBudget) {
    ToolHistoryEvictor.evict(this._messages, this._toolLedger, budget, this._onEvicted, hardBudget);
  }

  shrinkNewestToolResult(target) {
    const entry = this._toolLedger[this._toolLedger.length - 1];
    if (!entry) return 0;
    const message = this._messages[entry.index];
    const current = String(message.content || '');
    const keep = Math.max(AgentHistory.SHRINK_MIN_KEEP, Math.floor(target / 2));
    if (current.length <= keep) return 0;
    const dropped = current.length - keep;
    message.content = current.slice(0, keep) + AgentLoopText.overflowShrunk(dropped, entry.tool);
    const removed = Math.min(entry.chars, dropped);
    entry.chars = Math.max(0, entry.chars - dropped);
    return removed;
  }

  appendToLastUser(block) {
    const last = this.last();
    if (last && last.role === 'user' && typeof last.content === 'string') last.content = `${last.content}\n\n${block}`;
    else this.push('user', block);
  }

  markScreenshot() {
    this._screenshotIndex = this._messages.length - 1;
  }

  expireScreenshotNote() {
    const index = this._screenshotIndex;
    if (index < 0 || index >= this._messages.length - 1) return;
    const message = this._messages[index];
    if (message && typeof message.content === 'string') {
      message.content = message.content.replace(AgentLoopText.SCREENSHOT_ATTACHED, AgentLoopText.SCREENSHOT_STALE);
    }
    this._screenshotIndex = -1;
  }

  applyCompaction(result) {
    const { keptFrom, prefixLength } = result;
    const remap = (index) => (index < keptFrom ? -1 : index - keptFrom + prefixLength);
    this._remapToolLedger(remap);
    this._notes.remap(remap);
    if (this._screenshotIndex >= 0) this._screenshotIndex = remap(this._screenshotIndex);
    this._messages.splice(0, this._messages.length, ...result.messages);
  }

  _remapToolLedger(remap) {
    for (let k = this._toolLedger.length - 1; k >= 0; k--) {
      const index = remap(this._toolLedger[k].index);
      if (index < 0) this._toolLedger.splice(k, 1);
      else this._toolLedger[k].index = index;
    }
  }

  static _contentChars(content) {
    if (typeof content === 'string') return content.length;
    if (!Array.isArray(content)) return 0;
    let n = 0;
    for (const part of content) {
      if (typeof part === 'string') n += part.length;
      else if (part && typeof part.text === 'string') n += part.text.length;
    }
    return n;
  }
}

module.exports = AgentHistory;

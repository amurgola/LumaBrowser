const ToolGrammar = require('../ToolGrammar');

class TurnStatus {
  constructor(now) {
    this.now = now;
    this.current = null;
    this.since = 0;
  }

  set(s) {
    const key = s ? (s.kind || s.text) : 'working';
    const prev = this.current ? (this.current.kind || this.current.text) : 'working';
    if (key !== prev || !this.since) this.since = this.now();
    this.current = s;
  }

  clear() {
    this.set(null);
  }

  reset() {
    this.current = null;
    this.since = 0;
  }

  label(reasoning, dot) {
    const s = this.current;
    if (s && s.text) return s.text;
    const kind = (s && s.kind) || 'working';
    const secs = this.since ? (this.now() - this.since) / 1000 : 0;
    let text = ToolGrammar.longWaitText(kind, secs) || kind;
    if (kind === 'thinking' && reasoning) text += ` ${dot} ${ToolGrammar.fmtTokens(reasoning.chars)} chars`;
    return text;
  }
}

module.exports = TurnStatus;

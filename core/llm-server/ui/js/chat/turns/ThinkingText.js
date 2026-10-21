import ToolCardText from './ToolCardText.js';

export default class ThinkingText {
  static CHARS_PER_TOKEN = 4;

  static MIN_ELAPSED_MS = 1000;

  static approxTokens(text) {
    return Math.round(String(text || '').length / ThinkingText.CHARS_PER_TOKEN);
  }

  static tokens(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }

  static summary(text, streaming, facts = {}) {
    const reported = facts && Number.isFinite(facts.tokens) && facts.tokens > 0 ? facts.tokens : null;
    const n = reported != null ? reported : ThinkingText.approxTokens(text);
    const time = ThinkingText.elapsed(facts && facts.elapsedMs);
    if (!n && !time) return streaming ? 'Thinking…' : 'Thinking';
    const bits = [time, n ? ThinkingText.tokens(n) + ' tokens' : ''].filter(Boolean).join(' · ');
    return (streaming ? 'Thinking… ' : 'Thought for ') + bits;
  }

  static elapsed(ms) {
    if (!Number.isFinite(ms) || ms < ThinkingText.MIN_ELAPSED_MS) return '';
    return ToolCardText.elapsed(ms);
  }
}

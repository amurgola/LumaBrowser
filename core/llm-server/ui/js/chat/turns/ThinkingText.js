export default class ThinkingText {
  static CHARS_PER_TOKEN = 4;

  static approxTokens(text) {
    return Math.round(String(text || '').length / ThinkingText.CHARS_PER_TOKEN);
  }

  static tokens(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }

  static summary(text, streaming) {
    const n = ThinkingText.approxTokens(text);
    if (!n) return streaming ? 'Thinking…' : 'Thinking';
    return (streaming ? 'Thinking… ' : 'Thought for ') + ThinkingText.tokens(n) + ' tokens';
  }
}

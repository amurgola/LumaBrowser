class PromptBudget {
  static CHARS_PER_TOKEN = 3.6;
  static DEFAULT_WINDOW = 16384;
  static REFERENCE_WINDOW = 16384;
  static MIN_SCALE = 0.5;
  static MAX_SCALE = 3;
  static HISTORY_SHARE = 0.5;
  static LAYER_TOKENS = Object.freeze({
    brief: 500, premise: 300, story: 450, card: 300, offstage: 40, offstageTotal: 320, setting: 120, anchor: 200,
  });
  static MIN_HISTORY_MESSAGES = 4;

  static window(data, contextWindow = null) {
    const fromRouter = Number(contextWindow);
    if (Number.isFinite(fromRouter) && fromRouter > 0) return Math.floor(fromRouter);
    const fromSetup = parseInt((data && data.llmCtx) || '', 10);
    if (Number.isFinite(fromSetup) && fromSetup > 0) return fromSetup;
    return PromptBudget.DEFAULT_WINDOW;
  }

  static estimate(text) {
    return Math.ceil(String(text || '').length / PromptBudget.CHARS_PER_TOKEN);
  }

  static estimateMessages(messages) {
    let n = 0;
    for (const m of messages || []) n += PromptBudget.estimate(PromptBudget._text(m)) + 4;
    return n;
  }

  static layerTokens(layer, window) {
    const base = PromptBudget.LAYER_TOKENS[layer] || 0;
    const scale = Math.min(PromptBudget.MAX_SCALE, Math.max(PromptBudget.MIN_SCALE, (window || PromptBudget.DEFAULT_WINDOW) / PromptBudget.REFERENCE_WINDOW));
    return Math.round(base * scale);
  }

  static historyTokens(window) {
    return Math.floor((window || PromptBudget.DEFAULT_WINDOW) * PromptBudget.HISTORY_SHARE);
  }

  static clip(text, tokens) {
    const s = String(text || '');
    const maxChars = Math.floor(tokens * PromptBudget.CHARS_PER_TOKEN);
    if (s.length <= maxChars) return s;
    const head = s.slice(0, maxChars);
    const cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf('\n'));
    return (cut > maxChars * 0.5 ? head.slice(0, cut + 1) : head).trimEnd() + ' …';
  }

  static _text(m) {
    if (!m) return '';
    if (typeof m.content === 'string') return m.content;
    if (Array.isArray(m.content)) return m.content.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join(' ');
    return '';
  }
}

module.exports = PromptBudget;

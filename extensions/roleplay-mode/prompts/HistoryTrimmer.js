const PromptBudget = require('./PromptBudget');
const ProseCleanup = require('./ProseCleanup');

class HistoryTrimmer {
  static trim(messages, tokenBudget) {
    const list = Array.isArray(messages) ? messages : [];
    if (list.length <= PromptBudget.MIN_HISTORY_MESSAGES || PromptBudget.estimateMessages(list) <= tokenBudget) {
      return { messages: list, dropped: 0 };
    }
    let cut = HistoryTrimmer._steppedCut(list, tokenBudget);
    const maxCut = Math.max(0, list.length - PromptBudget.MIN_HISTORY_MESSAGES);
    if (cut > maxCut) {
      cut = maxCut;
      while (cut > 0 && !HistoryTrimmer._isUserTurn(list[cut])) cut -= 1;
    }
    if (cut <= 0) return { messages: list, dropped: 0 };
    return { messages: list.slice(cut), dropped: cut };
  }

  static withoutDebris(messages) {
    const list = Array.isArray(messages) ? messages : [];
    let cleaned = 0;
    const out = list.map((m) => {
      if (!m || m.role !== 'assistant' || typeof m.content !== 'string') return m;
      const content = HistoryTrimmer.stripDebris(m.content);
      if (content === m.content) return m;
      cleaned += 1;
      return Object.assign({}, m, { content });
    });
    return cleaned ? { messages: out, cleaned } : { messages: list, cleaned: 0 };
  }

  static stripDebris(text) {
    let s = String(text || '');
    if (/<think>|```choices/i.test(s)) s = s.replace(HistoryTrimmer.THINK, '').replace(HistoryTrimmer.CHOICES, '').trim();
    return /^\s{0,3}#{1,6}\s/m.test(s) ? ProseCleanup.clean(s) : s;
  }

  static THINK = /<think>[\s\S]*?<\/think>\s*/gi;
  static CHOICES = /```choices[^\S\n]*\n?[\s\S]*?(?:```|$)/gi;

  static STEP_SHARE = 0.25;

  static _steppedCut(list, tokenBudget) {
    const sizes = list.map((m) => PromptBudget.estimate(PromptBudget._text(m)) + 4);
    const total = sizes.reduce((a, b) => a + b, 0);
    const step = Math.max(1, Math.floor(tokenBudget * HistoryTrimmer.STEP_SHARE));
    const drop = Math.ceil((total - tokenBudget) / step) * step;
    let gone = 0;
    let cut = 0;
    while (cut < list.length && gone < drop) { gone += sizes[cut]; cut += 1; }
    while (cut < list.length && !HistoryTrimmer._isUserTurn(list[cut])) cut += 1;
    if (cut < list.length) return cut;
    cut = HistoryTrimmer._indexKeeping(list, tokenBudget);
    while (cut > 0 && !HistoryTrimmer._isUserTurn(list[cut])) cut -= 1;
    return cut;
  }

  static _indexKeeping(list, tokenBudget) {
    let used = 0;
    for (let i = list.length - 1; i >= 0; i -= 1) {
      used += PromptBudget.estimate(PromptBudget._text(list[i])) + 4;
      if (used > tokenBudget) return i + 1;
    }
    return 0;
  }

  static _isUserTurn(m) {
    return !!m && m.role === 'user';
  }
}

module.exports = HistoryTrimmer;

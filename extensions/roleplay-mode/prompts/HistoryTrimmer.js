const PromptBudget = require('./PromptBudget');

class HistoryTrimmer {
  static trim(messages, tokenBudget) {
    const list = Array.isArray(messages) ? messages : [];
    if (list.length <= PromptBudget.MIN_HISTORY_MESSAGES || PromptBudget.estimateMessages(list) <= tokenBudget) {
      return { messages: list, dropped: 0 };
    }
    let cut = HistoryTrimmer._indexKeeping(list, tokenBudget);
    while (cut > 0 && !HistoryTrimmer._isUserTurn(list[cut])) cut -= 1;
    const maxCut = Math.max(0, list.length - PromptBudget.MIN_HISTORY_MESSAGES);
    if (cut > maxCut) {
      cut = maxCut;
      while (cut > 0 && !HistoryTrimmer._isUserTurn(list[cut])) cut -= 1;
    }
    if (cut <= 0) return { messages: list, dropped: 0 };
    return { messages: list.slice(cut), dropped: cut };
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

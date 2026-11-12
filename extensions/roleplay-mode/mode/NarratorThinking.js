class NarratorThinking {
  static MODES = Object.freeze(['off', 'brief', 'full']);
  static DEFAULT = 'brief';
  static BRIEF_TOKENS = 512;
  static BUDGET_FIELD = 'reasoning_budget_tokens';
  static DIRECTIVE = 'If you think before answering, keep it to a few lines: decide what happens, then write. '
    + 'Do not draft the reply or check it against these rules in your thinking.';

  static of(data) {
    const pick = String((data && data.options && data.options.narratorThinking) || '').toLowerCase();
    return NarratorThinking.MODES.includes(pick) ? pick : NarratorThinking.DEFAULT;
  }

  static samplerFields(data) {
    return NarratorThinking.of(data) === 'brief' ? { [NarratorThinking.BUDGET_FIELD]: NarratorThinking.BRIEF_TOKENS } : {};
  }

  static directive(data) {
    return NarratorThinking.of(data) === 'brief' ? NarratorThinking.DIRECTIVE : '';
  }

  static effort(data) {
    return NarratorThinking.of(data) === 'off' ? 'off' : null;
  }
}

module.exports = NarratorThinking;

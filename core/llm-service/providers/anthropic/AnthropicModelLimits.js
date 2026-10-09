class AnthropicModelLimits {
  static DEFAULT_MAX_TOKENS = 32000;
  static CEILINGS = [
    { pattern: /claude-(fable|mythos|opus|sonnet)-5\b/, maxTokens: 128000 },
    { pattern: /claude-(opus|sonnet)-4-[6-9]\b/, maxTokens: 128000 },
    { pattern: /claude-(opus|sonnet|haiku)-4-5\b/, maxTokens: 64000 },
  ];
  static ADAPTIVE_THINKING = [/claude-(fable|mythos|opus|sonnet)-5\b/, /claude-(opus|sonnet)-4-[6-9]\b/];
  static REJECTION_CEILING = /max_tokens:\s*\d+\s*>\s*(\d+)/;

  static _learned = new Map();

  static outputCeilingFor(modelId) {
    const id = AnthropicModelLimits._normalize(modelId);
    const learned = AnthropicModelLimits._learned.get(id);
    if (learned) return learned;
    const known = AnthropicModelLimits.CEILINGS.find(({ pattern }) => pattern.test(id));
    return known ? known.maxTokens : AnthropicModelLimits.DEFAULT_MAX_TOKENS;
  }

  static learnCeiling(modelId, ceiling) {
    AnthropicModelLimits._learned.set(AnthropicModelLimits._normalize(modelId), ceiling);
  }

  static ceilingFromRejection(message) {
    const match = AnthropicModelLimits.REJECTION_CEILING.exec(String(message || ''));
    return match ? Number(match[1]) : null;
  }

  static resolveMaxTokens(options = {}, modelId) {
    const ceiling = AnthropicModelLimits.outputCeilingFor(modelId);
    const asked = Number(options.max_tokens);
    return Number.isFinite(asked) && asked > 0 ? Math.min(Math.floor(asked), ceiling) : ceiling;
  }

  static takesAdaptiveThinking(modelId) {
    const id = AnthropicModelLimits._normalize(modelId);
    return AnthropicModelLimits.ADAPTIVE_THINKING.some((pattern) => pattern.test(id));
  }

  static _normalize(modelId) {
    return String(modelId || '').toLowerCase();
  }
}

module.exports = AnthropicModelLimits;

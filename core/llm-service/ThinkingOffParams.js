class ThinkingOffParams {
  static QWEN_PATTERN = /(^|[-/_])(qwen|qwq)/;

  static RULES = [
    { matches: (id) => ThinkingOffParams.QWEN_PATTERN.test(id), params: () => ({ chat_template_kwargs: { enable_thinking: false }, reasoning_effort: 'minimal' }) },
    { matches: (id) => /(^|[-/_])(glm|chatglm|z-ai)/.test(id), params: () => ({ enable_thinking: false }) },
    { matches: (id) => /deepseek.*(r1|reasoner)/.test(id) || /\bdeepseek-v3\.1-thinking\b/.test(id), params: () => ({ thinking: { type: 'disabled' } }) },
    { matches: (id) => /(^|[-/_])(gpt-5|o1|o3|o4)(-|$)/.test(id), params: () => ({ reasoning_effort: 'minimal' }) },
    { matches: (id) => /gpt-oss/.test(id), params: () => ({ reasoning_effort: 'low' }) },
    { matches: (id) => /(^|[-/_])grok-(3-mini|4)/.test(id), params: () => ({ reasoning_effort: 'low' }) },
    { matches: (id) => /gemini-2\.5/.test(id), params: () => ({ thinkingConfig: { thinkingBudget: 0 } }) },
    { matches: (id) => id.includes('/'), params: () => ({ reasoning: { effort: 'none' } }) },
  ];

  static forModel(modelId) {
    const id = String(modelId || '').toLowerCase();
    if (!id) return {};
    const rule = ThinkingOffParams.RULES.find((candidate) => candidate.matches(id));
    return rule ? rule.params() : {};
  }

  static isQwenFamily(modelId) {
    return ThinkingOffParams.QWEN_PATTERN.test(String(modelId || '').toLowerCase());
  }
}

module.exports = ThinkingOffParams;

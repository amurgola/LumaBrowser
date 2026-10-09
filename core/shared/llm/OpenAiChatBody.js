class OpenAiChatBody {
  static ANTI_REPETITION_SAMPLER = {
    repeat_penalty: 1.1,
    repeat_last_n: 256,
  };

  static DEFAULT_TEMPERATURE = 0.7;

  static build({
    model = null,
    messages,
    temperature,
    maxTokens,
    stream = false,
    local = false,
    familySamplerDefaults = null,
    samplerOverrides = null,
    tools = null,
    toolChoice = 'auto',
    chatTemplateKwargs = null,
    reasoningBudget = null,
    promptCacheKey = null,
    promptCacheRetention = '24h',
    extra = null,
  } = {}) {
    const body = OpenAiChatBody._baseBody({
      model, messages, temperature, maxTokens, stream, local, familySamplerDefaults, samplerOverrides, extra,
    });
    OpenAiChatBody._applyStreamUsage(body);
    OpenAiChatBody._applyThinkingControls(body, chatTemplateKwargs, reasoningBudget);
    OpenAiChatBody._applyTools(body, tools, toolChoice);
    OpenAiChatBody._applyPromptCache(body, promptCacheKey, promptCacheRetention);
    return body;
  }

  static _baseBody({ model, messages, temperature, maxTokens, stream, local, familySamplerDefaults, samplerOverrides, extra }) {
    return {
      ...(model ? { model } : null),
      messages,
      stream: !!stream,
      temperature: typeof temperature === 'number' ? temperature : OpenAiChatBody.DEFAULT_TEMPERATURE,
      ...OpenAiChatBody._llamaCppExtensions(local),
      ...OpenAiChatBody._objectOrNull(familySamplerDefaults),
      ...OpenAiChatBody._objectOrNull(samplerOverrides),
      ...OpenAiChatBody._maxTokensField(maxTokens),
      ...OpenAiChatBody._objectOrNull(extra),
    };
  }

  static _llamaCppExtensions(local) {
    if (!local) return null;
    return { ...OpenAiChatBody.ANTI_REPETITION_SAMPLER, cache_prompt: true };
  }

  static _maxTokensField(maxTokens) {
    return typeof maxTokens === 'number' && maxTokens > 0 ? { max_tokens: maxTokens } : null;
  }

  static _applyStreamUsage(body) {
    if (body.stream) body.stream_options = { include_usage: true };
  }

  static _applyThinkingControls(body, chatTemplateKwargs, reasoningBudget) {
    if (OpenAiChatBody._isNonEmptyObject(chatTemplateKwargs)) body.chat_template_kwargs = chatTemplateKwargs;
    if (typeof reasoningBudget === 'number') body.reasoning_budget = reasoningBudget;
  }

  static _applyTools(body, tools, toolChoice) {
    if (!Array.isArray(tools) || !tools.length) return;
    body.tools = tools;
    body.tool_choice = toolChoice;
  }

  static _applyPromptCache(body, promptCacheKey, promptCacheRetention) {
    if (!promptCacheKey) return;
    body.prompt_cache_key = promptCacheKey;
    if (body.prompt_cache_retention === undefined) body.prompt_cache_retention = promptCacheRetention;
  }

  static _objectOrNull(value) {
    return value && typeof value === 'object' ? value : null;
  }

  static _isNonEmptyObject(value) {
    return !!value && typeof value === 'object' && Object.keys(value).length > 0;
  }
}

module.exports = OpenAiChatBody;

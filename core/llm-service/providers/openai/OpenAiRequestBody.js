const OpenAiChatBody = require('../../../shared/llm/OpenAiChatBody');
const AnthropicCacheControl = require('./AnthropicCacheControl');

class OpenAiRequestBody {
  static LOCAL_OPTION_KEYS = new Set([
    'timeout', 'stream', 'sessionId', 'cacheControl', 'cache_control',
    'promptCacheKey', 'local', 'samplerOverrides', 'repetitionGuard',
    'max_tokens',
    'model',
  ]);

  static build(messages, options, { streaming, endpoint, managedLocal, selectedModel }) {
    const model = options.model || selectedModel;
    if (!model) return null;
    return OpenAiChatBody.build({
      model,
      messages: OpenAiRequestBody._cacheMarked(messages, options),
      temperature: options.temperature,
      maxTokens: options.max_tokens,
      stream: !!streaming,
      local: options.local !== undefined ? !!options.local : managedLocal,
      samplerOverrides: options.samplerOverrides,
      promptCacheKey: OpenAiRequestBody._promptCacheKey(options, endpoint),
      extra: OpenAiRequestBody._forwardedOptions(options),
    });
  }

  static endpointSupportsPromptCacheKey(endpoint) {
    if (!endpoint) return false;
    try {
      const host = new URL(endpoint).hostname.toLowerCase();
      return host === 'api.openai.com' || host.endsWith('.openai.com');
    } catch (_) {
      return false;
    }
  }

  static _cacheMarked(messages, options) {
    const cacheControl = options.cacheControl || options.cache_control || null;
    return cacheControl === 'anthropic' ? AnthropicCacheControl.apply(messages) : messages;
  }

  static _promptCacheKey(options, endpoint) {
    const sessionId = options.sessionId || null;
    if (!sessionId) return null;
    const explicit = options.promptCacheKey;
    if (explicit === true) return sessionId;
    if (explicit === false) return null;
    return OpenAiRequestBody.endpointSupportsPromptCacheKey(endpoint) ? sessionId : null;
  }

  static _forwardedOptions(options) {
    return Object.fromEntries(Object.entries(options || {}).filter(([key]) => !OpenAiRequestBody.LOCAL_OPTION_KEYS.has(key)));
  }
}

module.exports = OpenAiRequestBody;

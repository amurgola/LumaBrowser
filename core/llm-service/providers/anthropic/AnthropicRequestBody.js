const AnthropicMessageConverter = require('./AnthropicMessageConverter');
const AnthropicModelLimits = require('./AnthropicModelLimits');

class AnthropicRequestBody {
  static EFFORT_LEVELS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
  static NO_XHIGH_MODELS = /-4-6\b/;

  static build(messages, options, model, stream) {
    const { system, messages: converted } = AnthropicMessageConverter.convert(messages);
    const body = { model, messages: converted, max_tokens: AnthropicModelLimits.resolveMaxTokens(options, model) };
    if (stream) body.stream = true;
    if (system) body.system = system;
    if (AnthropicModelLimits.takesAdaptiveThinking(model)) AnthropicRequestBody._addThinking(body, options, model);
    return body;
  }

  static effortFromOptions(options = {}) {
    const direct = options.reasoningEffort;
    if (AnthropicRequestBody._isEffort(direct)) return direct;
    const kwargs = options.chatTemplateKwargs || {};
    if (AnthropicRequestBody._isEffort(kwargs.reasoning_effort)) return kwargs.reasoning_effort;
    if (kwargs.enable_thinking === false || options.reasoningBudget === 0) return 'low';
    return null;
  }

  static _addThinking(body, options, model) {
    body.thinking = { type: 'adaptive', display: 'summarized' };
    const effort = AnthropicRequestBody._effortFor(model, options);
    if (effort) body.output_config = { effort };
  }

  static _effortFor(model, options) {
    const effort = AnthropicRequestBody.effortFromOptions(options);
    if (effort === 'xhigh' && AnthropicRequestBody.NO_XHIGH_MODELS.test(String(model).toLowerCase())) return 'high';
    return effort;
  }

  static _isEffort(value) {
    return typeof value === 'string' && AnthropicRequestBody.EFFORT_LEVELS.has(value);
  }
}

module.exports = AnthropicRequestBody;

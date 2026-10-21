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
    AnthropicRequestBody._addTools(body, options.tools);
    return body;
  }

  static _addTools(body, tools) {
    if (!Array.isArray(tools) || !tools.length) return;
    const converted = tools.map(AnthropicRequestBody._tool).filter(Boolean);
    if (converted.length) body.tools = converted;
  }

  static _tool(schema) {
    const fn = (schema && schema.function) || schema;
    if (!fn || typeof fn.name !== 'string' || !fn.name) return null;
    const tool = {
      name: fn.name,
      input_schema: fn.parameters && typeof fn.parameters === 'object' ? fn.parameters : { type: 'object', properties: {} },
      eager_input_streaming: true,
    };
    if (fn.description) tool.description = String(fn.description);
    return tool;
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

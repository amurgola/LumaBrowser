const AnthropicContent = require('./AnthropicContent');
const MessageTurnTranslator = require('./MessageTurnTranslator');
const ToolDefinitionTranslator = require('./ToolDefinitionTranslator');

class MessagesRequestTranslator {
  static MAX_STOP_SEQUENCES = 4;

  static translate(body, modelId) {
    if (!Array.isArray(body.messages) || body.messages.length === 0) return { error: 'messages is required' };
    const out = { model: modelId, messages: MessagesRequestTranslator._messages(body) };
    ToolDefinitionTranslator.apply(body, out);
    MessagesRequestTranslator._applySampling(body, out);
    MessagesRequestTranslator._applyThinking(body, out);
    MessagesRequestTranslator._applyStream(body, out);
    return { body: out };
  }

  static _messages(body) {
    const system = AnthropicContent.systemText(body.system);
    const messages = system ? [{ role: 'system', content: system }] : [];
    for (const turn of body.messages) messages.push(...MessageTurnTranslator.translate(turn));
    return messages;
  }

  static _applySampling(body, out) {
    if (Number.isFinite(body.max_tokens)) out.max_tokens = Math.max(1, Math.floor(body.max_tokens));
    for (const key of ['temperature', 'top_p', 'top_k']) {
      if (typeof body[key] === 'number') out[key] = body[key];
    }
    if (Array.isArray(body.stop_sequences) && body.stop_sequences.length) {
      out.stop = body.stop_sequences.slice(0, MessagesRequestTranslator.MAX_STOP_SEQUENCES);
    }
  }

  static _applyThinking(body, out) {
    const thinking = body.thinking;
    if (thinking && typeof thinking === 'object') {
      if (thinking.type === 'disabled') out.enable_thinking = false;
      else if (thinking.type === 'enabled') MessagesRequestTranslator._enableThinking(thinking, out);
    }
    const effort = body.output_config && body.output_config.effort;
    if (typeof effort === 'string' && effort) out.reasoning_effort = effort;
  }

  static _enableThinking(thinking, out) {
    out.enable_thinking = true;
    if (Number.isFinite(thinking.budget_tokens) && thinking.budget_tokens > 0) out.reasoning_budget = Math.floor(thinking.budget_tokens);
  }

  static _applyStream(body, out) {
    if (body.stream !== true) return;
    out.stream = true;
    out.stream_options = { include_usage: true };
  }
}

module.exports = MessagesRequestTranslator;

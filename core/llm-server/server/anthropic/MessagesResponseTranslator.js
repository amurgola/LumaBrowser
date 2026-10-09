const AnthropicIds = require('./AnthropicIds');
const StopReason = require('./StopReason');

class MessagesResponseTranslator {
  static translate(completion, modelId) {
    const choice = (completion.choices && completion.choices[0]) || {};
    const message = choice.message || {};
    const toolUses = MessagesResponseTranslator.toolUseBlocks(message.tool_calls);
    return {
      id: AnthropicIds.messageId(completion.id),
      type: 'message',
      role: 'assistant',
      model: modelId,
      content: MessagesResponseTranslator._content(message, toolUses),
      stop_reason: StopReason.forReply(choice.finish_reason, toolUses.length > 0),
      stop_sequence: null,
      usage: MessagesResponseTranslator.usage(completion.usage),
    };
  }

  static toolUseBlocks(toolCalls) {
    if (!Array.isArray(toolCalls)) return [];
    return toolCalls.map((call) => ({
      type: 'tool_use',
      id: String((call && call.id) || AnthropicIds.toolUseId()),
      name: String((call && call.function && call.function.name) || ''),
      input: MessagesResponseTranslator._input(call && call.function && call.function.arguments),
    }));
  }

  static usage(usage) {
    const counts = usage || {};
    return { input_tokens: counts.prompt_tokens || 0, output_tokens: counts.completion_tokens || 0 };
  }

  static _content(message, toolUses) {
    const content = [];
    if (typeof message.reasoning_content === 'string' && message.reasoning_content) {
      content.push({ type: 'thinking', thinking: message.reasoning_content, signature: '' });
    }
    if (typeof message.content === 'string' && message.content) content.push({ type: 'text', text: message.content });
    content.push(...toolUses);
    if (!content.length) content.push({ type: 'text', text: '' });
    return content;
  }

  static _input(raw) {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw !== 'string' || !raw.trim()) return {};
    try {
      return JSON.parse(raw);
    } catch (_) {
      return { _raw: raw };
    }
  }
}

module.exports = MessagesResponseTranslator;

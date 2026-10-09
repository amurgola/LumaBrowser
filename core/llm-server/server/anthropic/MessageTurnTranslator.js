const AnthropicContent = require('./AnthropicContent');
const AnthropicIds = require('./AnthropicIds');

class MessageTurnTranslator {
  static translate(turn) {
    if (!turn || typeof turn !== 'object') return [];
    const role = turn.role === 'assistant' ? 'assistant' : 'user';
    if (typeof turn.content === 'string') return [{ role, content: turn.content }];
    if (!Array.isArray(turn.content)) return [];
    const blocks = turn.content.filter((block) => block && typeof block === 'object');
    return role === 'assistant' ? [MessageTurnTranslator._assistant(blocks)] : MessageTurnTranslator._user(blocks);
  }

  static _assistant(blocks) {
    const text = blocks.filter((b) => b.type === 'text').map((b) => String(b.text || '')).join('');
    const reasoning = blocks.filter((b) => b.type === 'thinking').map((b) => String(b.thinking || '')).join('');
    const toolCalls = blocks.filter((b) => b.type === 'tool_use').map((b) => MessageTurnTranslator._toolCall(b));
    const message = { role: 'assistant', content: text || (toolCalls.length ? null : '') };
    if (toolCalls.length) message.tool_calls = toolCalls;
    if (reasoning) message.reasoning_content = reasoning;
    return message;
  }

  static _toolCall(block) {
    return {
      id: String(block.id || AnthropicIds.toolUseId()),
      type: 'function',
      function: { name: String(block.name || ''), arguments: JSON.stringify(block.input == null ? {} : block.input) },
    };
  }

  static _user(blocks) {
    const toolMessages = blocks.filter((b) => b.type === 'tool_result').map((b) => MessageTurnTranslator._toolMessage(b));
    const parts = blocks.map((b) => MessageTurnTranslator._userPart(b)).filter(Boolean);
    if (!parts.length) return toolMessages;
    return [...toolMessages, { role: 'user', content: MessageTurnTranslator._userContent(parts) }];
  }

  static _toolMessage(block) {
    return { role: 'tool', tool_call_id: String(block.tool_use_id || ''), content: AnthropicContent.toolResultText(block.content) };
  }

  static _userPart(block) {
    if (block.type === 'text') return { type: 'text', text: String(block.text || '') };
    if (block.type === 'image') return AnthropicContent.imagePart(block);
    if (block.type === 'document') return { type: 'text', text: '[document attached]' };
    return null;
  }

  static _userContent(parts) {
    if (parts.every((part) => part.type === 'text')) return parts.map((part) => part.text).join('');
    return parts;
  }
}

module.exports = MessageTurnTranslator;

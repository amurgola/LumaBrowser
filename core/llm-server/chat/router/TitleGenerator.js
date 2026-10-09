const ThinkingOff = require('../../../llm-service/ThinkingOff');
const CollectedCompletion = require('./CollectedCompletion');
const ConversationTitle = require('./ConversationTitle');

class TitleGenerator {
  static TIMEOUT_MS = 30000;
  static TEMPERATURE = 0.3;
  static EXCERPT_CHARS = 600;

  constructor({ chatStore, models, dispatch }) {
    this._store = chatStore;
    this._models = models;
    this._collected = new CollectedCompletion(dispatch);
  }

  async generate(conversationId) {
    const conv = this._store.getConversation(conversationId);
    if (!conv || TitleGenerator._modeNamedItself(conv)) return { success: false };
    const exchange = this._firstExchange(conversationId);
    if (!exchange) return { success: false };
    const modelRef = conv.modelRef || this._models.list().defaultRef || null;
    if (!modelRef) return { success: false };
    try {
      const title = ConversationTitle.clean(await this._ask(modelRef, conversationId, exchange));
      if (!title) return { success: false };
      this._store.renameConversation(conversationId, title);
      return { success: true, title };
    } catch (_) {
      return { success: false };
    }
  }

  static _modeNamedItself(conv) {
    return !!(conv.mode && conv.mode !== 'chat' && conv.title && conv.title !== ConversationTitle.PLACEHOLDER);
  }

  _firstExchange(conversationId) {
    const messages = this._store.listMessages(conversationId);
    const user = messages.find((m) => m.role === 'user' && m.content);
    if (!user) return null;
    const assistant = messages.find((m) => m.role === 'assistant' && m.content);
    return { user: user.content, assistant: (assistant && assistant.content) || '' };
  }

  _ask(modelRef, conversationId, exchange) {
    const { extra, messages } = ThinkingOff.resolve(modelRef, [{ role: 'user', content: TitleGenerator._prompt(exchange) }]);
    return this._collected.run({
      modelRef,
      messages,
      temperature: TitleGenerator.TEMPERATURE,
      extra: { ...(extra || {}), trace: { conversationId, callType: 'title' } },
      timeoutMs: TitleGenerator.TIMEOUT_MS,
      timeoutMessage: 'title timeout',
    });
  }

  static _prompt(exchange) {
    return 'Write a 3 to 6 word title for this conversation. '
      + 'Reply with ONLY the title - no quotes, no punctuation, no preamble.\n\n'
      + 'User: ' + exchange.user.slice(0, TitleGenerator.EXCERPT_CHARS) + '\n'
      + 'Assistant: ' + exchange.assistant.slice(0, TitleGenerator.EXCERPT_CHARS);
  }
}

module.exports = TitleGenerator;

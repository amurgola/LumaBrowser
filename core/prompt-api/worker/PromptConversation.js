class PromptConversation {
  static CONTEXT_WINDOW = 8192;
  static CHARS_PER_TOKEN = 4;
  static ROLES = ['system', 'user', 'assistant'];

  constructor(messages = []) {
    this._messages = messages.map((message) => ({ ...message }));
  }

  static fromInitialPrompts(initialPrompts) {
    return new PromptConversation(PromptConversation.toChatMessages(initialPrompts || []));
  }

  static toChatMessages(input) {
    return (Array.isArray(input) ? input : []).map((message) => ({
      role: PromptConversation.ROLES.includes(message.role) ? message.role : 'user',
      content: PromptConversation._textOf(message.content),
    }));
  }

  static estimateTokens(messages) {
    const chars = messages.reduce((sum, message) => sum + message.content.length, 0);
    return Math.ceil(chars / PromptConversation.CHARS_PER_TOKEN);
  }

  withInput(input) {
    return [...this.messages(), ...PromptConversation.toChatMessages(input)];
  }

  record(input, answer) {
    this.append(input);
    this._messages.push({ role: 'assistant', content: String(answer) });
  }

  append(input) {
    this._messages.push(...PromptConversation.toChatMessages(input));
  }

  messages() {
    return this._messages.map((message) => ({ ...message }));
  }

  usage() {
    return PromptConversation.estimateTokens(this._messages);
  }

  clone() {
    return new PromptConversation(this._messages);
  }

  static _textOf(content) {
    if (typeof content === 'string') return content;
    return (Array.isArray(content) ? content : []).map((part) => {
      if (!part || part.type !== 'text') throw new Error(`The local model takes text only, not ${(part && part.type) || 'this content'}`);
      return String(part.value == null ? '' : part.value);
    }).join('');
  }
}

module.exports = PromptConversation;

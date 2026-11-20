const AgentSystemPromptBuilder = require('../../agent/AgentSystemPromptBuilder');
const ChatAssistantText = require('../ChatAssistantText');

class PlainChatPrompt {
  constructor({ db, now = () => new Date() }) {
    this._db = db;
    this._now = now;
  }

  applyTo(messages) {
    const list = Array.isArray(messages) ? messages : [];
    if (list[0] && list[0].role === 'system') return list;
    return [{ role: 'system', content: this.build() }, ...list];
  }

  build() {
    const custom = this._customInstructions();
    return [
      PlainChatPrompt._block('role', ChatAssistantText.ROLE_PLAIN),
      PlainChatPrompt._block('current_date', ChatAssistantText.today(this._now())),
      PlainChatPrompt._block('answering', ChatAssistantText.ANSWERING),
      PlainChatPrompt._block('tools', ChatAssistantText.NO_TOOLS),
      custom ? PlainChatPrompt._block('user_instructions', `${ChatAssistantText.USER_INSTRUCTIONS_LEAD}\n${custom}`) : null,
    ].filter(Boolean).join('\n\n');
  }

  _customInstructions() {
    const db = this._db;
    if (!db || typeof db.get !== 'function') return '';
    try {
      return String(db.get(AgentSystemPromptBuilder.USER_PROMPT_SETTING, '') || '').trim();
    } catch (_) {
      return '';
    }
  }

  static _block(tag, body) {
    return `<${tag}>\n${body}\n</${tag}>`;
  }
}

module.exports = PlainChatPrompt;

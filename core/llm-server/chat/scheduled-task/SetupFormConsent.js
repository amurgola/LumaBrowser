class SetupFormConsent {
  static OPENER = '(Setup form submitted)';

  static TOOLS = ['create_scheduled_task'];

  static preApprovedTools(messages, existingTask) {
    if (existingTask) return [];
    const fromUser = (Array.isArray(messages) ? messages : []).filter((message) => message && message.role === 'user');
    if (fromUser.length !== 1) return [];
    return SetupFormConsent._text(fromUser[0]).startsWith(SetupFormConsent.OPENER) ? SetupFormConsent.TOOLS.slice() : [];
  }

  static _text(message) {
    const content = message.content;
    if (typeof content === 'string') return content.trimStart();
    if (!Array.isArray(content)) return '';
    const part = content.find((item) => item && typeof item.text === 'string');
    return part ? part.text.trimStart() : '';
  }
}

module.exports = SetupFormConsent;

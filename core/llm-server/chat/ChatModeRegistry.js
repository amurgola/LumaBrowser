const ContributionRegistry = require('../../shared/registry/ContributionRegistry');

class ChatModeRegistry extends ContributionRegistry {
  static ERROR_PREFIX = 'registerMode';
  static ENTRY_NOUN = 'descriptor';
  static RESERVED_ID = 'chat';

  notifyConversationDeleted(meta) {
    try {
      const mode = meta && meta.mode ? this.get(meta.mode) : null;
      if (mode && typeof mode.onConversationDeleted === 'function') {
        Promise.resolve(mode.onConversationDeleted({ conversationId: meta.conversationId, meta })).catch(() => {});
      }
    } catch (_) {}
  }

  _validate(_descriptor, id) {
    if (id === ChatModeRegistry.RESERVED_ID) throw new Error('registerMode: "chat" is reserved for the built-in mode');
  }

  _toListed(mode) {
    return {
      id: mode.id,
      label: mode.label || mode.id,
      description: mode.description || '',
      icon: mode.icon || '',
      requirements: Array.isArray(mode.requirements) ? mode.requirements.slice() : [],
      setupSchema: mode.setupSchema || null,
      hasBuildTurn: typeof mode.buildTurn === 'function',
      agent: mode.agent === true,
      launcher: mode.launcher === 'sidebar' ? 'sidebar' : 'landing',
      hidden: mode.hidden === true,
      chatUiUrl: mode.chatUiUrl || null,
      chatUiModule: mode.chatUiModule === true,
    };
  }

  static shared = new ChatModeRegistry();
}

module.exports = ChatModeRegistry;

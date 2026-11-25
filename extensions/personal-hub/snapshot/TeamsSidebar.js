const ConversationList = require('./ConversationList');

function listedTeamsChats() {
  return [...document.querySelectorAll('[role="treeitem"][data-fui-tree-item-value]')].map((row) => {
    const text = row.innerText || row.textContent || '';
    return {
      id: String(row.getAttribute('data-fui-tree-item-value')).split('|').pop(),
      name: (text.split('\n').map((line) => line.trim()).find(Boolean) || ''),
    };
  });
}

class TeamsSidebar extends ConversationList {
  static HOSTS = ['teams.cloud.microsoft', 'teams.microsoft.com', 'teams.live.com'];
  static READY = '[role="treeitem"][data-fui-tree-item-value*="ChatConversation"]';
  static ROWS_JS = `(${listedTeamsChats.toString()})()`;
  static CONVERSATION_ID = /^19:[^/|]+@(unq\.gbl\.spaces|thread\.v2)$/;
  static KNOWN_KEY = 'teams.conversations';

  static spaceOf(tab) {
    try {
      const url = new URL(String((tab && tab.url) || ''));
      return TeamsSidebar.HOSTS.includes(url.hostname) ? url.origin : null;
    } catch (_) {
      return null;
    }
  }

  static home(origin) {
    return `${origin}/v2/`;
  }

  static address(origin, id) {
    return `${origin}/v2/#/l/chat/${id}/conversations`;
  }
}

module.exports = TeamsSidebar;

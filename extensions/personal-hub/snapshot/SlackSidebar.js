const ConversationList = require('./ConversationList');

class SlackSidebar extends ConversationList {
  static ROW = '.p-channel_sidebar__static_list__item[id]';
  static READY = '.p-channel_sidebar__static_list__item .p-channel_sidebar__channel';
  static ROWS_JS = `(() => [...document.querySelectorAll('${SlackSidebar.ROW}')].map((row) => {
  const name = row.querySelector('.p-channel_sidebar__name');
  const own = name && name.firstElementChild;
  return { id: row.id, name: ((own || name || {}).textContent || '').trim() };
}))()`;
  static CONVERSATION_ID = /^[CDG][A-Z0-9]{6,}$/;
  static TEAM = /\/client\/([A-Z0-9]+)/;
  static KNOWN_KEY = 'slack.conversations';

  static spaceOf(tab) {
    return (String((tab && tab.url) || '').match(SlackSidebar.TEAM) || [])[1] || null;
  }

  static home(team) {
    return `https://app.slack.com/client/${team}`;
  }

  static address(team, id) {
    return `${SlackSidebar.home(team)}/${id}`;
  }
}

module.exports = SlackSidebar;

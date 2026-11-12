class ActivityKind {
  static CHAT = 'chat';
  static MAIL = 'mail';
  static CALENDAR = 'calendar';
  static TASK = 'task';
  static OTHER = 'other';
  static ALL = ['chat', 'mail', 'calendar', 'task', 'other'];

  static BY_APP = {
    slack: 'chat', teams: 'chat', messages: 'chat', discord: 'chat', whatsapp: 'chat', telegram: 'chat',
    gmail: 'mail', outlook: 'mail', proton: 'mail',
    'google-calendar': 'calendar', calendar: 'calendar',
    clickup: 'task',
  };

  static HINTS = [
    [/calendar|meet\.|zoom\./, 'calendar'],
    [/mail/, 'mail'],
    [/chat|messag/, 'chat'],
    [/jira|linear|asana|trello|github|gitlab/, 'task'],
  ];

  static forApp(app) {
    const name = String(app || '').toLowerCase();
    if (ActivityKind.BY_APP[name]) return ActivityKind.BY_APP[name];
    for (const [pattern, kind] of ActivityKind.HINTS) {
      if (pattern.test(name)) return kind;
    }
    return ActivityKind.OTHER;
  }

  static of(item) {
    const own = ActivityKind.clean(item && item.context && item.context.kind);
    return own || ActivityKind.forApp(item && item.app);
  }

  static clean(value) {
    const kind = String(value || '').trim().toLowerCase();
    return ActivityKind.ALL.includes(kind) ? kind : '';
  }
}

module.exports = ActivityKind;

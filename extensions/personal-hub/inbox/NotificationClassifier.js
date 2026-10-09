const ThreadKey = require('./ThreadKey');

class NotificationClassifier {
  static HOSTS = [
    ['slack.com', 'slack'],
    ['teams.microsoft.com', 'teams'],
    ['teams.cloud.microsoft', 'teams'],
    ['teams.live.com', 'teams'],
    ['mail.google.com', 'gmail'],
    ['outlook.office.com', 'outlook'],
    ['outlook.live.com', 'outlook'],
    ['outlook.office365.com', 'outlook'],
    ['outlook.cloud.microsoft', 'outlook'],
    ['messages.google.com', 'messages'],
    ['app.clickup.com', 'clickup'],
    ['mail.proton.me', 'proton'],
    ['calendar.proton.me', 'proton'],
    ['discord.com', 'discord'],
    ['web.whatsapp.com', 'whatsapp'],
    ['web.telegram.org', 'telegram'],
  ];

  static MAX_NAME_LENGTH = 40;
  static CLICKUP_ACTION_RE = /^(.+?)\s+(commented on|assigned you|assigned|mentioned you in|mentioned|changed|updated|created)\s+(.*)$/i;

  static RULES = {
    slack: (n) => NotificationClassifier._slack(n),
    teams: (n) => NotificationClassifier._teams(n),
    gmail: (n) => NotificationClassifier._mail(n),
    outlook: (n) => NotificationClassifier._mail(n),
    proton: (n) => NotificationClassifier._mail(n),
    messages: (n) => NotificationClassifier._contact(n),
    whatsapp: (n) => NotificationClassifier._contact(n),
    telegram: (n) => NotificationClassifier._contact(n),
    clickup: (n) => NotificationClassifier._clickup(n),
  };

  static classify(input) {
    const n = NotificationClassifier._clean(input);
    const app = NotificationClassifier.appFor(n.host);
    const rule = NotificationClassifier.RULES[app] || NotificationClassifier._default;
    let parsed;
    try { parsed = rule(n) || {}; } catch (_) { parsed = {}; }
    return NotificationClassifier._finish(app, n, parsed);
  }

  static appFor(host) {
    const h = String(host || '').toLowerCase().replace(/^www\./, '');
    if (!h) return 'unknown';
    for (const [suffix, app] of NotificationClassifier.HOSTS) {
      if (h === suffix || h.endsWith(`.${suffix}`)) return app;
    }
    return h;
  }

  static hostOf(url, fallback) {
    try { return new URL(String(url)).hostname.toLowerCase(); } catch (_) { return String(fallback || '').toLowerCase(); }
  }

  static _slack(n) {
    const lead = NotificationClassifier._leadingName(n.body);
    const channelId = n.data && (n.data.channel_id || n.data.channel);
    return {
      sender: lead || n.title,
      threadKey: channelId ? `channel:${String(channelId)}` : ThreadKey.normalize(n.title),
      threadTitle: n.title,
    };
  }

  static _teams(n) {
    const inIndex = n.title.indexOf(' in ');
    if (inIndex > 0) {
      const sender = n.title.slice(0, inIndex).trim();
      const chat = n.title.slice(inIndex + 4).trim();
      return { sender, threadKey: ThreadKey.normalize(chat), threadTitle: chat };
    }
    const lead = NotificationClassifier._leadingName(n.body);
    return { sender: lead || n.title, threadKey: ThreadKey.normalize(n.title), threadTitle: n.title };
  }

  static _mail(n) {
    const subject = NotificationClassifier._firstLine(n.body);
    return {
      sender: n.title,
      threadKey: subject ? ThreadKey.normalize(subject) : ThreadKey.normalize(n.title),
      threadTitle: subject || n.title,
    };
  }

  static _contact(n) {
    return { sender: n.title, threadKey: ThreadKey.normalize(n.title), threadTitle: n.title };
  }

  static _clickup(n) {
    const match = n.title.match(NotificationClassifier.CLICKUP_ACTION_RE);
    const taskName = match ? match[3] : n.title;
    return {
      sender: match ? match[1].trim() : '',
      threadKey: n.tag ? ThreadKey.normalize(n.tag) : ThreadKey.normalize(taskName),
      threadTitle: taskName || n.title,
    };
  }

  static _default(n) {
    return { sender: '', threadKey: ThreadKey.normalize(n.tag || n.title), threadTitle: n.title };
  }

  static _leadingName(body) {
    const index = body.indexOf(': ');
    if (index <= 0 || index > NotificationClassifier.MAX_NAME_LENGTH) return '';
    const name = body.slice(0, index);
    if (/[\n\r]/.test(name)) return '';
    return name.trim();
  }

  static _firstLine(text) {
    return String(text || '').split(/\r?\n/)[0].trim();
  }

  static _clean(input) {
    const i = input && typeof input === 'object' ? input : {};
    const str = (v) => (v == null ? '' : String(v)).trim();
    return {
      host: str(i.host) || NotificationClassifier.hostOf(i.url, ''),
      url: str(i.url),
      title: str(i.title),
      body: str(i.body),
      tag: str(i.tag),
      tabTitle: str(i.tabTitle),
      data: i.data && typeof i.data === 'object' ? i.data : null,
    };
  }

  static _finish(app, n, parsed) {
    const sender = String(parsed.sender || '').trim();
    const threadTitle = String(parsed.threadTitle || n.title || n.tabTitle || app).trim();
    let threadKey = String(parsed.threadKey || '').trim();
    if (!threadKey) threadKey = ThreadKey.normalize(n.tag || n.title || n.body) || app;
    return { app, sender, threadKey, threadTitle, participants: sender ? [sender] : [] };
  }
}

module.exports = NotificationClassifier;

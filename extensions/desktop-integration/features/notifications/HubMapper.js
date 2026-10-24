const OsNotification = require('./OsNotification');
const AppFilter = require('./AppFilter');

let Classifier = null;
let ThreadKey = null;
try { Classifier = require('../../../personal-hub/inbox/NotificationClassifier'); } catch (_) { Classifier = null; }
try { ThreadKey = require('../../../personal-hub/inbox/ThreadKey'); } catch (_) { ThreadKey = null; }

class HubMapper {
  static LABEL = 'os-notification';
  static MAX_KEY = 200;

  static KNOWN = [
    { app: 'slack', host: 'slack.com', names: ['slack'], ids: ['com.squirrel.slack.slack', '*slack*'] },
    { app: 'teams', host: 'teams.microsoft.com', names: ['microsoft teams', 'teams', 'microsoft teams (work or school)', 'microsoft teams classic'], ids: ['msteams_*', 'com.squirrel.teams.teams', '*microsoftteams*'] },
    { app: 'outlook', host: 'outlook.office.com', names: ['outlook', 'microsoft outlook', 'outlook (new)'], ids: ['microsoft.office.outlook.exe*', 'microsoft.outlookforwindows*'] },
    { app: 'whatsapp', host: 'web.whatsapp.com', names: ['whatsapp', 'whatsapp beta'], ids: ['*whatsappdesktop*'] },
    { app: 'telegram', host: 'web.telegram.org', names: ['telegram', 'telegram desktop'], ids: ['telegramdesktop*', '*telegram*'] },
    { app: 'discord', host: 'discord.com', names: ['discord'], ids: ['com.squirrel.discord.discord', '*discord*'] },
    { app: 'clickup', host: 'app.clickup.com', names: ['clickup'], ids: ['*clickup*'] },
    { app: 'proton', host: 'mail.proton.me', names: ['proton mail', 'proton mail beta'], ids: ['*protonmail*', '*proton.mail*'] },
  ];

  static hubAppFor(item) {
    const name = String(item.app || '').trim().toLowerCase();
    const id = String(item.appId || '').trim().toLowerCase();
    for (const known of HubMapper.KNOWN) {
      if (name && known.names.includes(name)) return known.app;
      if (id && known.ids.some((p) => AppFilter.matches(p, id))) return known.app;
    }
    return '';
  }

  static toQueueItem(item) {
    const hubApp = HubMapper.hubAppFor(item);
    const { sender, threadKey } = hubApp ? HubMapper._classified(hubApp, item) : { sender: '', threadKey: '' };
    return {
      app: hubApp || item.app,
      threadKey: (threadKey || HubMapper._genericKey(item)).slice(0, HubMapper.MAX_KEY),
      title: item.title,
      body: item.body || item.title,
      sender,
      participants: sender ? [sender] : [],
      at: item.at,
      url: OsNotification.webUrl(item.launchUri),
      ...(hubApp ? {} : { labels: [HubMapper.LABEL] }),
      context: {
        source: 'desktop',
        osApp: item.app,
        appId: item.appId,
        client: item.client,
        tag: item.tag,
        group: item.group,
        launchUri: item.launchUri,
        imagePath: item.imagePath,
      },
    };
  }

  static _classified(hubApp, item) {
    if (!Classifier) return { sender: '', threadKey: '' };
    const known = HubMapper.KNOWN.find((k) => k.app === hubApp);
    try {
      const c = Classifier.classify({ host: known.host, title: item.title, body: item.body, tag: item.tag });
      return { sender: c.sender || '', threadKey: c.threadKey === hubApp ? '' : (c.threadKey || '') };
    } catch (_) {
      return { sender: '', threadKey: '' };
    }
  }

  static _genericKey(item) {
    const scope = (item.appId || item.app).toLowerCase();
    if (item.group) return `${scope}|group:${item.group}`;
    if (item.tag) return `${scope}|tag:${item.tag}`;
    const text = HubMapper._normalize(item.title || item.body.split('\n')[0]);
    return text ? `${scope}|${text}` : scope;
  }

  static _normalize(text) {
    if (ThreadKey) return ThreadKey.normalize(text);
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 120);
  }
}

module.exports = HubMapper;

class HubItemMapper {
  static LABEL = 'android';
  static MAX_KEY = 200;

  static KNOWN = Object.freeze({
    'com.Slack': 'slack',
    'com.microsoft.teams': 'teams',
    'com.microsoft.office.outlook': 'outlook',
    'com.whatsapp': 'whatsapp',
    'org.telegram.messenger': 'telegram',
    'com.discord': 'discord',
    'ch.protonmail.android': 'proton',
  });

  static toQueueItem(deviceName, notification) {
    const title = String(notification.title || '').trim();
    const app = HubItemMapper.KNOWN[notification.packageName] || notification.packageName;
    return {
      app,
      threadKey: `${notification.packageName}:${title.toLowerCase()}`.slice(0, HubItemMapper.MAX_KEY),
      title: title || notification.packageName,
      body: String(notification.text || title),
      sender: title,
      participants: title ? [title] : [],
      at: notification.postedAtMs ? new Date(notification.postedAtMs).toISOString() : undefined,
      labels: [HubItemMapper.LABEL],
      context: { source: 'android', device: deviceName, package: notification.packageName, key: notification.key },
    };
  }
}

module.exports = HubItemMapper;

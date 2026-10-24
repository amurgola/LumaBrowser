const NotificationRelay = require('./NotificationRelay');

const settingsSchema = [
  { key: 'forwardToHub', label: 'Send to the Personal Hub queue', type: 'bool', default: true, help: 'Off: notifications are only listed under recent, not filed in the Hub.' },
  {
    key: 'filterMode', label: 'Which apps', type: 'select', default: 'all',
    options: [{ value: 'all', label: 'Every app except the blocked ones' }, { value: 'allowlist', label: 'Only the allowed apps' }],
  },
  { key: 'allowApps', label: 'Allowed apps', type: 'textarea', default: '', help: 'One per line: the app name, its AUMID or the Hub app (slack, teams, outlook). * is a wildcard. Used when "Which apps" is "Only the allowed apps".' },
  { key: 'denyApps', label: 'Blocked apps', type: 'textarea', default: '', help: 'One per line, same format. Always wins over the allowed list.' },
  { key: 'ignoreLuma', label: "Skip LumaBrowser's own notifications", type: 'bool', default: true },
  { key: 'dedupeWindowSec', label: 'Treat repeats as one for (seconds)', type: 'number', default: 120, min: 0, max: 3600, help: 'Same app and tag, or same title and body. 0 turns it off.' },
];

module.exports = {
  id: 'notifications',
  label: 'OS notifications',
  description: 'Files the notifications Windows (or another OS) shows into the Personal Hub queue, reported by a desktop client such as the luma-notification-relay Windhawk mod.',
  defaultEnabled: true,
  settingsSchema,

  create(deps) {
    const relay = new NotificationRelay({
      settings: deps.settings,
      getHub: () => deps.extensions['personal-hub'] || null,
      broadcast: deps.broadcast,
      log: deps.log,
    });

    return {
      relay,

      mount(router) {
        router.post('/', (req, res) => {
          const list = NotificationRelay.itemsOf(req.body);
          if (!list || !list.length) {
            res.status(400).json({ success: false, error: 'Send a notification object, an array, or { notifications: [...] }' });
            return;
          }
          const out = relay.ingest(list, { client: req.get('X-Luma-Client') || '' });
          if (out.counts.invalid === out.received) {
            res.status(400).json({ success: false, error: (out.results[0] && out.results[0].error) || 'No valid notification', ...out });
            return;
          }
          res.json({ success: true, hubAvailable: relay.hubAvailable(), pending: relay.pendingCount(), ...out });
        });

        router.get('/recent', (req, res) => {
          const status = String(req.query.status || '');
          if (status && !NotificationRelay.STATUSES.includes(status)) {
            res.status(400).json({ success: false, error: `status must be one of ${NotificationRelay.STATUSES.join(', ')}` });
            return;
          }
          res.json({ success: true, items: relay.recent({ limit: req.query.limit, status }), pending: relay.pendingCount(), hubAvailable: relay.hubAvailable() });
        });

        router.get('/apps', (_req, res) => {
          res.json({ success: true, apps: relay.apps() });
        });

        router.get('/config', (_req, res) => {
          res.json({ success: true, ...relay.config(), hubAvailable: relay.hubAvailable() });
        });

        router.post('/flush', (_req, res) => {
          res.json({ success: true, hubAvailable: relay.hubAvailable(), ...relay.flush() });
        });
      },

      onSettingsChanged(key) {
        if (key === 'forwardToHub') relay.flush();
      },

      dispose() {
        relay.dispose();
      },
    };
  },
};

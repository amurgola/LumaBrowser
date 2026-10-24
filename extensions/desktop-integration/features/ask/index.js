const AskHotkey = require('./AskHotkey');
const AskService = require('./AskService');
const AskSettings = require('./AskSettings');
const WindowCapture = require('./WindowCapture');

function electronNotify(title, body) {
  try {
    const { Notification } = require('electron');
    if (Notification && (typeof Notification.isSupported !== 'function' || Notification.isSupported())) {
      new Notification({ title, body: String(body || '').slice(0, 250), silent: true }).show();
    }
  } catch (_) {}
}

function createWith(deps, parts = {}) {
  const service = new AskService({
    settings: deps.settings,
    handoff: deps.handoff,
    windows: deps.windows,
    capture: parts.capture || new WindowCapture(),
    notify: parts.notify || electronNotify,
    log: deps.log,
    now: parts.now,
  });
  const hotkey = new AskHotkey({ globalShortcut: parts.globalShortcut || null, onPress: () => service.askForeground('luma-hotkey'), log: deps.log });
  const applyHotkey = () => {
    const r = hotkey.set(new AskSettings(deps.settings).get('hotkey'));
    if (!r.ok) deps.log.warn(`hotkey not registered: ${r.error}`);
    return r;
  };
  applyHotkey();
  const send = (res, r) => res.status(r.status).json(r.body);
  const clientOf = (req) => (typeof req.get === 'function' && req.get('X-Luma-Client')) || null;
  return {
    service,
    hotkey,
    mount(router) {
      router.get('/', (_req, res) => send(res, service.config()));
      router.post('/window', async (req, res) => send(res, await service.askWindow(req.body || {}, clientOf(req))));
      router.post('/content', async (req, res) => send(res, await service.askContent(req.body || {}, clientOf(req))));
    },
    onSettingsChanged(key) {
      if (key === 'hotkey') applyHotkey();
    },
    dispose() {
      hotkey.clear();
    },
  };
}

module.exports = {
  id: 'ask',
  label: 'Ask about a window',
  description: 'POST /api/desktop/ask/window asks Luma about another app\'s window: Luma reads its text and takes a screenshot, then opens a chat with them. POST /api/desktop/ask/content hands over content a client captured itself.',
  defaultEnabled: true,
  settingsSchema: AskSettings.SCHEMA,
  create(deps) {
    return createWith(deps);
  },
  createWith,
};

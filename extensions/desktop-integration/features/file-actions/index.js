const FileSelection = require('./FileSelection');
const FileActionCatalog = require('./FileActionCatalog');
const FileActionEnv = require('./FileActionEnv');
const FileActionRunner = require('./FileActionRunner');

const settingsSchema = [
  { key: 'promptDescribe', label: 'Describe image prompt', type: 'textarea', default: 'Describe this image in detail.', help: 'Sent with the image. {name} is the file name.' },
  { key: 'promptAskImage', label: 'Ask about image prompt', type: 'text', default: '', help: 'Put in the composer (not sent). Empty leaves it blank.' },
  { key: 'promptEditImage', label: 'Edit with Luma prompt', type: 'text', default: 'Edit this image: ', help: 'Put in the composer; finish the sentence and send. Needs an image model.' },
  { key: 'promptSummarize', label: 'Summarize prompt', type: 'textarea', default: 'Summarize {name}: the main points first, then anything notable.', help: 'Sent with the file. {name} is the file name.' },
  { key: 'promptAskFile', label: 'Ask about this file prompt', type: 'text', default: '', help: 'Put in the composer (not sent).' },
  { key: 'promptAskFiles', label: 'Ask about these files prompt', type: 'text', default: '', help: 'Put in the composer (not sent). {count} and {names} work here.' },
  { key: 'maxFiles', label: 'Most files to attach at once', type: 'number', default: 10, min: 1, max: 10, help: 'The chat takes at most 10.' },
  { key: 'kbMaxFiles', label: 'Most documents per knowledge-base import', type: 'number', default: 200, min: 1, max: 2000 },
  { key: 'allowNetworkPaths', label: 'Accept network (UNC) paths', type: 'bool', default: false },
  { key: 'notifyResults', label: 'Show a notification when an action fails or a knowledge-base import ends', type: 'bool', default: true },
];

const DEFAULTS = Object.fromEntries(settingsSchema.map((s) => [s.key, s.default]));
const LIMITS = { maxFiles: [1, 10], kbMaxFiles: [1, 2000] };

function readSetting(deps, key) {
  const value = deps.settings.get(key, DEFAULTS[key]);
  if (!LIMITS[key]) return value;
  const n = Math.floor(Number(value));
  const [lo, hi] = LIMITS[key];
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : DEFAULTS[key];
}

function electronNotify(title, body) {
  const { Notification } = require('electron');
  if (Notification && Notification.isSupported()) new Notification({ title, body: String(body || '').slice(0, 250) }).show();
}

function bad(res, error, extra = {}) {
  return res.status(400).json({ success: false, error, ...extra });
}

module.exports = {
  id: 'file-actions',
  label: 'File actions',
  description: 'Luma actions on files selected in a file manager (describe, summarize, read aloud, add to a knowledge base); clients list them per selection.',
  defaultEnabled: true,
  settingsSchema,

  create(deps, options = {}) {
    const env = options.env || new FileActionEnv(deps);
    const setting = (key) => readSetting(deps, key);
    const runner = options.runner || new FileActionRunner({ deps, env, setting, notify: options.notify || electronNotify });

    const inspect = (paths) => FileSelection.inspect(paths, { allowNetwork: !!setting('allowNetworkPaths'), ...(options.selection || {}) });
    const catalogOptions = () => ({ maxFiles: setting('maxFiles') });

    return {
      mount(router) {
        router.post('/available', async (req, res) => {
          const body = req.body || {};
          const selection = await inspect(body.paths);
          if (selection.error) return bad(res, selection.error);
          const actions = selection.errors.length ? [] : FileActionCatalog.available(selection.items, env, catalogOptions());
          return res.json({ success: true, actions, count: selection.items.length, errors: selection.errors });
        });

        router.post('/run', async (req, res) => {
          const body = req.body || {};
          const actionId = typeof body.action === 'string' ? body.action.trim() : '';
          if (!actionId) return bad(res, 'action is required');
          const selection = await inspect(body.paths);
          if (selection.error) return bad(res, selection.error);
          if (selection.errors.length) return bad(res, 'Some paths cannot be used', { errors: selection.errors });
          const wanted = body.agentId && actionId === 'kb-add' ? FileActionCatalog.KB_PREFIX + String(body.agentId) : actionId;
          const action = FileActionCatalog.resolve(wanted, selection.items, env, catalogOptions());
          if (!action) return bad(res, 'That action is not available for this selection', { action: actionId });
          const source = { client: req.get('X-Luma-Client') || null, app: 'Files' };
          const started = runner.start(action, selection.items, source);
          deps.log.info(`run ${action.id} on ${selection.items.length} item(s)`, { client: source.client });
          if (!started.started) return res.status(500).json({ success: false, error: started.detail, action: action.id });
          return res.json({ success: true, started: true, action: action.id, detail: started.detail });
        });

        router.get('/agents', (_req, res) => {
          res.json({ success: true, agents: env.agents().map((a) => ({ id: a.id, name: a.name || a.id, kbDocs: a.kbDocs || 0 })) });
        });

        router.get('/settings', (_req, res) => {
          res.json({ success: true, settings: Object.fromEntries(settingsSchema.map((s) => [s.key, setting(s.key)])) });
        });
      },
    };
  },
};

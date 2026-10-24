const LinkUnwrap = require('./LinkUnwrap');
const OpenActions = require('./OpenActions');
const OpenText = require('./OpenText');

const settingsSchema = [
  { key: 'askPrefix', label: 'Ask prefix', type: 'text', default: OpenText.DEFAULT_PREFIX, help: 'Text sent to /open/text that starts with this goes to the chat. Empty turns the prefix off.' },
  { key: 'askAutoSend', label: 'Send questions right away', type: 'bool', default: true, help: 'Off: the question is only filled into a new chat.' },
  { key: 'focusWindow', label: 'Bring Luma to the front', type: 'bool', default: true, help: 'Raise the window after opening a link or a search.' },
  { key: 'unwrapLinks', label: 'Unwrap Edge and Bing links', type: 'bool', default: true, help: 'Open the real target of microsoft-edge: links and Bing redirects.' },
  { key: 'bingSearchesAsQuery', label: 'Run Bing searches with my search engine', type: 'bool', default: true, help: 'A Bing results link becomes a search with the engine chosen in Luma.' },
];

function source(req) {
  const body = req.body || {};
  return { client: req.get('X-Luma-Client') || null, app: typeof body.app === 'string' ? body.app : null, windowTitle: typeof body.windowTitle === 'string' ? body.windowTitle : null };
}

function focusOption(body) {
  return typeof body.focus === 'boolean' ? body.focus : undefined;
}

module.exports = {
  id: 'open',
  label: 'Open in Luma',
  description: 'Lets desktop clients open links and web searches in Luma, or ask the chat; unwraps links Windows forces through Edge and Bing.',
  defaultEnabled: true,
  settingsSchema,

  create(deps) {
    const actions = new OpenActions(deps);
    const setting = (key) => {
      const field = settingsSchema.find((f) => f.key === key);
      const value = deps.settings.get(key, field.default);
      return value === undefined || value === null ? field.default : value;
    };
    const send = (res, result) => res.status(result.status).json(result.body);
    const run = async (req, choice) => {
      const body = req.body || {};
      if (choice.action === 'url') return actions.openUrl(choice.url, { unwrap: choice.unwrap, focus: focusOption(body) });
      if (choice.action === 'query') return actions.search(choice.query, { focus: focusOption(body), from: choice.from });
      return actions.ask(choice.prompt, { source: source(req) });
    };

    return {
      mount(router) {
        router.get('/', (_req, res) => {
          res.json({
            success: true,
            askPrefix: String(setting('askPrefix') || ''),
            unwrapLinks: !!setting('unwrapLinks'),
            bingSearchesAsQuery: !!setting('bingSearchesAsQuery'),
            searchEngine: actions.searchEngine(),
          });
        });

        router.post('/', async (req, res) => {
          const body = req.body && typeof req.body === 'object' ? req.body : {};
          const given = ['url', 'query', 'ask'].filter((k) => body[k] !== undefined && body[k] !== null);
          if (given.length !== 1) return res.status(400).json({ success: false, error: 'Send exactly one of url, query or ask' });
          const key = given[0];
          if (typeof body[key] !== 'string') return res.status(400).json({ success: false, error: `${key} must be a string` });
          if (key === 'url') return send(res, await run(req, { action: 'url', url: body.url, unwrap: body.unwrap !== false }));
          if (key === 'query') return send(res, await run(req, { action: 'query', query: body.query }));
          return send(res, await run(req, { action: 'ask', prompt: body.ask }));
        });

        router.post('/text', async (req, res) => {
          const body = req.body && typeof req.body === 'object' ? req.body : {};
          if (typeof body.text !== 'string') return res.status(400).json({ success: false, error: 'text must be a string' });
          const choice = OpenText.classify(body.text, { askPrefix: setting('askPrefix') });
          if (choice.error) return res.status(400).json({ success: false, error: choice.error });
          if (choice.action === 'query' && choice.url && !setting('bingSearchesAsQuery')) {
            return send(res, await run(req, { action: 'url', url: choice.url, unwrap: false }));
          }
          return send(res, await run(req, { ...choice, unwrap: false, from: choice.wrapped ? body.text.trim() : undefined }));
        });

        router.post('/unwrap', (req, res) => {
          const body = req.body && typeof req.body === 'object' ? req.body : {};
          if (typeof body.link !== 'string') return res.status(400).json({ success: false, error: 'link must be a string' });
          const result = LinkUnwrap.unwrap(body.link);
          if (result.kind === 'invalid') return res.status(400).json({ success: false, error: result.error });
          res.json({ success: true, ...result });
        });
      },
    };
  },
};

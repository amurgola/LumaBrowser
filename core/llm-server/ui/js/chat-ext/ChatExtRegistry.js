import ChatUiScriptLoader from './ChatUiScriptLoader.js';

export default class ChatExtRegistry {
  constructor({ scriptLoader = new ChatUiScriptLoader(), logger = console } = {}) {
    this._loader = scriptLoader;
    this._log = logger;
    this._clientModes = new Map();
    this._backendModes = new Map();
    this._loaded = false;
  }

  registerMode(def) {
    if (!def || !def.id) {
      this._log.error('[chat-ext] registerMode requires an object with an id');
      return;
    }
    this._clientModes.set(def.id, def);
  }

  getBackend(id) {
    return this._backendModes.get(id) || null;
  }

  getClient(id) {
    return this._clientModes.get(id) || null;
  }

  getMerged(id) {
    const backend = this._backendModes.get(id);
    if (!backend) return null;
    return { ...backend, ...(this._clientModes.get(id) || {}), id };
  }

  list() {
    return Array.from(this._backendModes.values());
  }

  hasModes() {
    return this._backendModes.size > 0;
  }

  async load(api) {
    if (this._loaded) return this.list();
    this._loaded = true;
    const modes = await this._fetchModes(api);
    for (const mode of modes) this._backendModes.set(mode.id, mode);
    await this._injectBundles(modes);
    return this.list();
  }

  async _fetchModes(api) {
    try {
      const res = api && api.chat && api.chat.listModes ? await api.chat.listModes() : null;
      return res && res.success && Array.isArray(res.modes) ? res.modes : [];
    } catch (err) {
      this._log.error('[chat-ext] listModes failed:', err);
      return [];
    }
  }

  _injectBundles(modes) {
    return Promise.all(modes.map((mode) => this._loader.load(mode.chatUiUrl, { module: ChatUiScriptLoader.isModule(mode) })));
  }
}

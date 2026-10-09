const BrowserTools = require('./BrowserTools');
const ManagedServers = require('./service/ManagedServers');
const EphemeralProviders = require('./service/EphemeralProviders');
const SlotConfigStore = require('./service/SlotConfigStore');
const SlotResolver = require('./service/SlotResolver');
const SlotRequestRunner = require('./service/SlotRequestRunner');
const AvailableModels = require('./service/AvailableModels');

class LLMService {
  static DEFAULT_SLOT = 'default';
  static MANAGED_LOCAL_PROVIDER_ID = ManagedServers.LOCAL_ID;
  static GROUNDING_PROVIDER_ID = ManagedServers.GROUNDING_ID;

  constructor(db, providers) {
    this.db = db;
    this.providers = providers;
    this.slots = new Map([[LLMService.DEFAULT_SLOT, { extensionId: 'core', label: 'Default (Active Provider)', required: false }]]);
    this.queueManager = null;
    this.browserTools = BrowserTools;
    this._managed = new ManagedServers();
    this._slotStore = new SlotConfigStore(db);
    this._resolver = new SlotResolver({
      db, providers, managedServers: this._managed, ephemeralProviders: new EphemeralProviders(db),
    });
    this._runner = new SlotRequestRunner({ managedServers: this._managed, resolveSlot: (id) => this.resolveSlot(id) });
  }

  setQueueManager(queueManager) {
    this.queueManager = queueManager;
  }

  getQueueManager() {
    return this.queueManager;
  }

  setLlmServerService(llmServerService) {
    this._managed.llmServerService = llmServerService;
  }

  setGroundingServerService(groundingServerService) {
    this._managed.groundingServerService = groundingServerService || null;
  }

  registerSlot(slotId, config) {
    this.slots.set(slotId, config);
    console.log(`LLMService: registered slot "${slotId}" (${config.label}) for ${config.extensionId}`);
  }

  unregisterSlot(slotId) {
    this.slots.delete(slotId);
  }

  getSlotConfig(slotId) {
    return this._slotStore.explicitConfig(slotId) || this._resolver.defaultConfig();
  }

  setSlotConfig(slotId, provider, model) {
    this._slotStore.set(slotId, provider, model);
  }

  clearSlotConfig(slotId) {
    this._slotStore.clear(slotId);
  }

  getAllSlots() {
    return [...this.slots]
      .filter(([slotId]) => slotId !== LLMService.DEFAULT_SLOT)
      .map(([slotId, meta]) => this._slotRow(slotId, meta));
  }

  async sendCompletion(slotId, messages, options = {}) {
    const config = this.getSlotConfig(slotId);
    if (!LLMService._isConfigured(config)) return SlotRequestRunner.noProviderResult(slotId);
    const { opts, withVision, label } = this._prepareOptions(slotId, options);
    const run = () => this._runner.run({ slotId, config, options: opts, withVision },
      (provider) => provider.sendChatCompletion(messages, opts));
    return this._dispatch(slotId, config, { messages, options: opts }, { label }, run);
  }

  createStream(slotId, messages, options = {}, handlers = {}) {
    const config = this.getSlotConfig(slotId);
    if (!LLMService._isConfigured(config)) return { abort: () => {}, done: Promise.resolve(SlotRequestRunner.noProviderResult(slotId)) };
    const { opts } = this._prepareOptions(slotId, options, { keepHints: true });
    const stream = { aborted: false, session: null };
    const run = () => this._startStream({ slotId, config, opts, messages, handlers, stream });
    const done = this._dispatch(slotId, config, { messages, options: opts }, {}, run);
    return { abort: () => LLMService._abortStream(stream), done };
  }

  async ensureSlotVision(slotId) {
    const config = this.getSlotConfig(slotId);
    if (!LLMService._isConfigured(config)) return { ok: false, vision: null, error: SlotRequestRunner.noProviderResult(slotId).error };
    if (config.provider === ManagedServers.GROUNDING_ID) return this._groundingVision(config);
    if (config.provider !== ManagedServers.LOCAL_ID) return { ok: true, vision: null };
    return this._localVision(config);
  }

  describeSlot(slotId) {
    const config = this.getSlotConfig(slotId);
    if (!LLMService._isConfigured(config)) return { provider: null, model: null, managedLocal: false };
    const { provider, modelOverride } = this.resolveSlot(slotId);
    const providerModel = provider && provider.getSelectedModel ? provider.getSelectedModel() : null;
    return {
      provider: config.provider,
      model: modelOverride || providerModel || config.model || null,
      managedLocal: ManagedServers.isManaged(config.provider),
    };
  }

  resolveSlot(slotId) {
    return this._resolver.resolve(this.getSlotConfig(slotId));
  }

  getProvider(key) {
    return this.providers[key] || null;
  }

  getProviders() {
    return Object.entries(this.providers).map(([key, provider]) => ({
      key,
      label: AvailableModels.labelFor(key),
      configured: !!(provider && provider.getEndpoint && provider.getEndpoint()),
    }));
  }

  getAllAvailableModels() {
    const managedEntries = [this._managed.localEntry(), this._managed.groundingEntry()];
    return AvailableModels.list({ db: this.db, providers: this.providers, managedEntries });
  }

  getActiveProviderKey() {
    return this.db.get('llm.provider', 'none');
  }

  getActiveProvider() {
    return this.providers[this.getActiveProviderKey()] || null;
  }

  static _isConfigured(config) {
    return !!(config && config.provider);
  }

  _slotRow(slotId, meta) {
    const config = this.getSlotConfig(slotId);
    return {
      slotId,
      extensionId: meta.extensionId,
      label: meta.label,
      required: meta.required,
      provider: (config && config.provider) || '',
      model: (config && config.model) || '',
    };
  }

  _prepareOptions(slotId, options, { keepHints = false } = {}) {
    const opts = { ...options };
    if (!opts.sessionId) opts.sessionId = this._slotStore.sessionId(slotId);
    if (keepHints) return { opts };
    const withVision = opts.needsVision === true;
    const label = opts.label != null ? String(opts.label) : null;
    delete opts.needsVision;
    delete opts.label;
    return { opts, withVision, label };
  }

  _dispatch(slotId, config, payload, meta, run) {
    if (!this.queueManager) return run();
    const modelKey = `${config.provider}::${config.model}`;
    const source = slotId.split('.')[0] || 'unknown';
    return this.queueManager.enqueue(modelKey, payload, { source, ...meta }, () => run());
  }

  _startStream({ slotId, config, opts, messages, handlers, stream }) {
    if (stream.aborted) return Promise.resolve({ ...SlotRequestRunner.ABORTED });
    return this._runner.run({ slotId, config, options: opts, isAborted: () => stream.aborted }, (provider) => {
      stream.session = provider.createChatCompletionStreamSession(messages, opts, handlers);
      return stream.session.done;
    });
  }

  static _abortStream(stream) {
    stream.aborted = true;
    if (stream.session && typeof stream.session.abort === 'function') stream.session.abort();
  }

  async _groundingVision(config) {
    const ready = await this._managed.ensureReady(config);
    return ready.ok ? { ok: true, vision: true } : { ok: false, vision: null, error: ready.error, code: ready.code };
  }

  async _localVision(config) {
    const ready = await this._managed.ensureReady(config, { withVision: true });
    if (!ready.ok) return { ok: false, vision: null, error: ready.error, code: ready.code };
    if (this._managed.localHasVision()) return { ok: true, vision: true };
    return { ok: false, vision: false, code: 'NO_VISION', error: ManagedServers.NO_VISION_MESSAGE };
  }
}

module.exports = LLMService;

const BuilderMeta = require('./BuilderMeta');
const BuilderPrompt = require('./BuilderPrompt');
const BuilderTools = require('./BuilderTools');
const BuilderToolSpecs = require('./BuilderToolSpecs');
const PersistedTabs = require('./PersistedTabs');
const SiteBinding = require('./SiteBinding');
const WorkTabs = require('./WorkTabs');

class SiteApiBuilderMode {
  static ID = 'site-api-builder';
  static LABEL = 'Site API';
  static TEMPERATURE = 0.2;
  static MAX_ITERATIONS = 40;

  static PAGE_TOOLS = Object.freeze([
    'observe_page', 'click', 'click_at', 'locate', 'type', 'fill_form', 'press_key', 'scroll',
    'select_option', 'set_date', 'set_slider',
    'get_source', 'screenshot', 'wait_for', 'get_element', 'extract_data', 'collect_list',
    'navigate',
  ]);

  constructor({ service, browser = null, getChatStore = null, logger = console, workTabs = null } = {}) {
    if (!service) throw new Error('SiteApiBuilderMode requires the service');
    this._service = service;
    this._browser = browser;
    this._getChatStore = getChatStore;
    this._logger = logger;
    this._workTabs = workTabs || new WorkTabs({ browser, logger });
    this._tools = new BuilderTools({ service, browser, getChatStore, logger });
  }

  descriptor() {
    return {
      id: SiteApiBuilderMode.ID,
      label: SiteApiBuilderMode.LABEL,
      icon: String.fromCodePoint(0x1f50c),
      description: 'Record a signed-in site as named endpoints: demonstrate once, get a siteapi_* tool and REST route back.',
      requirements: ['llm'],
      launcher: 'sidebar',
      agent: true,
      buildTurn: (args) => this.buildTurn(args),
      onConversationDeleted: (args) => this.onConversationDeleted(args),
    };
  }

  async buildTurn({ meta, conversationId } = {}) {
    const chatStore = this._chatStore();
    const convId = conversationId || (meta && meta.conversationId) || null;
    let data = meta && meta.data ? BuilderMeta.dataOf(meta) : BuilderMeta.read(chatStore, convId);
    const { site, patch } = SiteBinding.resolve(this._service, convId, data);
    if (!site) return this._unboundTurn(data, patch, chatStore, convId);
    const workTabId = await this._workTabs.ensure(convId, site, data.workTabId);
    const nextPatch = { ...patch, workTabId: workTabId != null ? workTabId : null };
    if (SiteApiBuilderMode._differs(data, nextPatch)) data = BuilderMeta.patch(chatStore, convId, nextPatch);
    const tools = this._tools.build();
    return {
      systemPrompt: BuilderPrompt.build({
        site,
        endpoints: this._service.listEndpoints(site.id),
        workTabId,
        currentEndpoint: this._currentEndpoint(data),
      }),
      temperature: SiteApiBuilderMode.TEMPERATURE,
      agent: true,
      tools,
      allowedTools: [...SiteApiBuilderMode.PAGE_TOOLS, ...tools.map((t) => t.name)],
      ...(workTabId != null ? { workTabId } : { noBrowser: true }),
      agentBudget: { maxIterations: SiteApiBuilderMode.MAX_ITERATIONS },
    };
  }

  async onConversationDeleted({ conversationId, meta } = {}) {
    const data = BuilderMeta.dataOf(meta);
    await this._workTabs.close(conversationId, data.workTabId != null ? data.workTabId : null);
    const site = data.siteId ? this._service.getSite(data.siteId) : null;
    if (site && site.conversationId === conversationId) {
      try { this._service.updateSite(site.id, { conversationId: null }); } catch (_) {}
    }
  }

  dispose() {
    return this._workTabs.dispose();
  }

  _unboundTurn(data, patch, chatStore, convId) {
    if (Object.keys(patch).length) BuilderMeta.patch(chatStore, convId, patch);
    const tools = this._tools.build().filter((t) => BuilderToolSpecs.UNBOUND_NAMES.includes(t.name));
    return {
      systemPrompt: BuilderPrompt.build({ site: null, persistedTabs: PersistedTabs.list(this._browser) }),
      temperature: SiteApiBuilderMode.TEMPERATURE,
      agent: true,
      tools,
      allowedTools: tools.map((t) => t.name),
      noBrowser: true,
      agentBudget: { maxIterations: SiteApiBuilderMode.MAX_ITERATIONS },
    };
  }

  _currentEndpoint(data) {
    if (!data.endpointId) return null;
    const endpoint = this._service.getEndpoint(data.endpointId);
    if (!endpoint) return null;
    const recording = !!(data.recording && data.recording.endpointId === endpoint.id && endpoint.status === 'draft');
    return { ...endpoint, recording };
  }

  _chatStore() {
    try { return (this._getChatStore && this._getChatStore()) || null; } catch (_) { return null; }
  }

  static _differs(data, patch) {
    return Object.entries(patch).some(([key, value]) => (value === null ? data[key] !== undefined : data[key] !== value));
  }
}

module.exports = SiteApiBuilderMode;

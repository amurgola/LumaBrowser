const RendererBroadcast = require('../../core/shell/extensions/RendererBroadcast');
const SiteApiSchema = require('./SiteApiSchema');
const SiteApiStore = require('./SiteApiStore');
const SiteApiService = require('./SiteApiService');
const EndpointRunner = require('./runtime/EndpointRunner');
const SiteApiToolHost = require('./exposure/SiteApiToolHost');
const SiteApiIpcHandlers = require('./exposure/SiteApiIpcHandlers');
const SiteApiBuilderMode = require('./builder/SiteApiBuilderMode');
const ChatRouterDeps = require('./ChatRouterDeps');

class SiteApisExtension {
  constructor(overrides = {}) {
    this._overrides = overrides;
    this._service = null;
    this._runner = null;
    this._toolHost = null;
    this._builder = null;
    this._api = null;
  }

  async activate(context) {
    SiteApiSchema.ensure(context.db);
    const store = new SiteApiStore(context.db);
    const emit = SiteApisExtension._broadcaster(context.ipc);
    const logger = context.logger || console;
    this._runner = this._overrides.runner || new EndpointRunner({
      store,
      browser: context.browser || null,
      chat: context.chat || null,
      llm: context.llm || null,
      logger,
      onSiteStatus: (siteId, status, note) => { store.setSiteStatus(siteId, status, note); emit('changed', { what: 'site', id: siteId }); },
      showSiteTab: (siteId) => this._service && this._service.showSiteTab(siteId),
    });
    this._toolHost = this._overrides.toolHost || new SiteApiToolHost({
      store,
      run: (siteId, endpointName, params, opts) => this._service.run(siteId, endpointName, params, opts),
      getAggregator: () => ChatRouterDeps.aggregator(),
      logger,
    });
    this._service = new SiteApiService({ store, runner: this._runner, toolHost: this._toolHost, browser: context.browser || null, emit });
    this._builder = this._overrides.builder || new SiteApiBuilderMode({
      service: this._service,
      browser: context.browser || null,
      getChatStore: () => ChatRouterDeps.chatStore(),
      logger,
    });
    SiteApiIpcHandlers.register(context.ipc, this._service, { browser: context.browser || null });
    this._api = this._service;
    this._toolHost.refresh();
    logger.log(`site-apis: ${store.listSites().length} site(s), ${store.listEndpoints().length} endpoint(s)`);
    return this._api;
  }

  async deactivate() {
    try { if (this._runner && typeof this._runner.dispose === 'function') await this._runner.dispose(); } catch (_) {}
    try { if (this._toolHost && typeof this._toolHost.dispose === 'function') this._toolHost.dispose(); } catch (_) {}
    try { if (this._builder && typeof this._builder.dispose === 'function') this._builder.dispose(); } catch (_) {}
    this._service = null;
    this._runner = null;
    this._toolHost = null;
    this._builder = null;
    this._api = null;
  }

  getApi() {
    return this._api;
  }

  builderDescriptor() {
    return this._builder ? this._builder.descriptor() : null;
  }

  static _broadcaster(ipc) {
    const channel = ipc ? `${ipc.namespace}.changed` : null;
    return (event, payload) => {
      if (!channel || event !== 'changed') return;
      try { RendererBroadcast.send(channel, payload); } catch (_) {}
    };
  }
}

module.exports = SiteApisExtension;

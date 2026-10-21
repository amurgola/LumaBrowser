const SiteApiStore = require('../SiteApiStore');
const SiteApiService = require('../SiteApiService');
const ChatRouterDeps = require('../ChatRouterDeps');
const ExtensionGlobals = require('../../../core/shell/extensions/ExtensionGlobals');

class BuilderLauncher {
  static MODE_ID = 'site-api-builder';
  static TITLE_PREFIX = 'Site API: ';
  static DEFAULT_PARTITION = 'persist:main';

  constructor({ service, getChatStore, getLlmServer, getTabs } = {}) {
    this._service = service;
    this._getChatStore = getChatStore || (() => ChatRouterDeps.chatStore());
    this._getLlmServer = getLlmServer || (() => ExtensionGlobals.llmServerService());
    this._getTabs = getTabs || (() => null);
  }

  open(input = {}) {
    const store = this._getChatStore();
    if (!store) return { success: false, error: 'The chat is not ready yet; try again in a moment.' };
    const target = input.siteId != null ? this._fromSite(String(input.siteId), input.tabId) : this._fromTab(input.tabId);
    if (target.error) return { success: false, error: target.error };
    const reused = BuilderLauncher._liveConversation(store, target.site);
    const conversation = reused || this._create(store, target);
    if (!reused && target.site) this._service.updateSite(target.site.id, { conversationId: conversation.id });
    const opened = this._show(conversation.id);
    return { success: true, conversationId: conversation.id, siteId: target.site ? target.site.id : null, created: !reused, opened };
  }

  _fromSite(siteId, tabId) {
    const site = this._service.getSite(siteId);
    if (!site) return { error: `Unknown site "${siteId}"` };
    const tabs = this._getTabs();
    const persisted = tabs ? SiteApiService.persistedTabFor(tabs, site) : null;
    const sourceTabId = tabId != null ? tabId : (persisted ? persisted.id : null);
    return { site, data: BuilderLauncher._data(site, sourceTabId, site.id) };
  }

  _fromTab(tabId) {
    if (tabId == null) return { error: 'openBuilder needs { tabId } or { siteId }.' };
    const tabs = this._getTabs();
    const entry = tabs && typeof tabs.getEntry === 'function' ? tabs.getEntry(tabId) : null;
    if (!entry) return { error: `Unknown tab ${tabId}` };
    const origin = SiteApiStore.originOf(entry.url);
    if (!origin) return { error: 'The tab is not on an http(s) page.' };
    const partition = entry.partition || BuilderLauncher.DEFAULT_PARTITION;
    const site = this._service.store.findSite({ partition, origin });
    if (site) return { site, data: BuilderLauncher._data(site, tabId, site.id) };
    return { site: null, data: { partition, origin, startUrl: String(entry.url), sourceTabId: tabId } };
  }

  _create(store, target) {
    const conversation = store.createConversation({
      title: BuilderLauncher.title(target),
      toolsEnabled: true,
      mode: BuilderLauncher.MODE_ID,
    });
    store.setMeta(conversation.id, { mode: BuilderLauncher.MODE_ID, data: target.data });
    return conversation;
  }

  _show(conversationId) {
    const llm = this._getLlmServer();
    if (!llm || typeof llm.openConversation !== 'function') return false;
    try { return !!llm.openConversation(conversationId); } catch (_) { return false; }
  }

  static title(target) {
    const name = target.site ? target.site.name : BuilderLauncher._hostOf(target.data.origin);
    return `${BuilderLauncher.TITLE_PREFIX}${name}`;
  }

  static _liveConversation(store, site) {
    if (!site || !site.conversationId) return null;
    try { return store.getConversation(site.conversationId) || null; } catch (_) { return null; }
  }

  static _data(site, sourceTabId, siteId) {
    const data = { partition: site.partition, origin: site.origin, startUrl: site.startUrl, sourceTabId: sourceTabId == null ? null : sourceTabId };
    if (siteId) data.siteId = siteId;
    return data;
  }

  static _hostOf(origin) {
    try { return new URL(origin).hostname; } catch (_) { return String(origin || 'site'); }
  }
}

module.exports = BuilderLauncher;

class OnDemandService {
  static MODE_ID = 'on-demand';
  static TITLE_PREFIX = 'On Demand: ';
  static TITLE_MAX = 60;
  static SWEEP_LIMIT = 1000;

  static ERRORS = {
    notReady: { success: false, error: 'The chat backend is not ready yet.' },
    empty: { success: false, error: 'Nothing to send.' },
    modeMissing: { success: false, code: 'MODE_MISSING', error: 'Luma On Demand is not loaded yet. Restart LumaBrowser to enable it.' },
    noModel: { success: false, error: 'No language model is set up yet. Open the LLM tab to configure one.', code: 'NO_MODEL' },
  };

  constructor({ getRouter, getTabInfo = null, chatModeRegistry = null, modeId = OnDemandService.MODE_ID, log = null } = {}) {
    if (typeof getRouter !== 'function') throw new Error('OnDemandService: getRouter is required');
    this._getRouter = getRouter;
    this._getTabInfo = typeof getTabInfo === 'function' ? getTabInfo : () => null;
    this._registry = chatModeRegistry;
    this.modeId = modeId;
    this._log = typeof log === 'function' ? log : () => {};
    this._byTab = new Map();
  }

  isReady() {
    return !!this._store();
  }

  modeLoaded() {
    const registry = this._registry;
    if (!registry || typeof registry.get !== 'function') return true;
    try {
      return !!registry.get(this.modeId);
    } catch (_) {
      return false;
    }
  }

  currentModelRef() {
    const listing = this._modelListing();
    return listing ? listing.defaultRef || null : null;
  }

  currentModelLabel() {
    const listing = this._modelListing();
    if (!listing) return null;
    const model = (listing.models || []).find((m) => m.ref === listing.defaultRef);
    return model ? (model.displayName || model.label || model.ref) : (listing.defaultRef || null);
  }

  trackedConversation(tabId) {
    return this._byTab.get(tabId) || null;
  }

  conversationFor(tabId, { create = true } = {}) {
    const store = this._store();
    if (!store || tabId == null) return null;
    const existing = this._liveTrackedConversation(store, tabId);
    if (existing || !create) return existing;
    return this._createConversation(store, tabId);
  }

  refreshTab(tabId) {
    const convId = this._byTab.get(tabId);
    const store = this._store();
    if (!convId || !store) return;
    try {
      const data = this._pageData(tabId);
      const current = store.getMeta(convId);
      store.setMeta(convId, { mode: this.modeId, data: { ...((current && current.data) || {}), ...data } });
      if (typeof store.renameConversation === 'function') store.renameConversation(convId, this._titleFor(data));
    } catch (_) {}
  }

  async send({ tabId, text, send, spoken = false }) {
    const router = this._getRouter();
    const content = String(text == null ? '' : text).trim();
    const refusal = this._refusalFor(router, content);
    if (refusal) return refusal;
    const modelRef = this.currentModelRef();
    if (!modelRef) return { ...OnDemandService.ERRORS.noModel };
    const convId = this.conversationFor(tabId);
    if (!convId) return { ...OnDemandService.ERRORS.notReady };
    this.refreshTab(tabId);
    return router.chat(this._turnRequest({ tabId, convId, modelRef, content, send, spoken }));
  }

  abort() {
    const router = this._getRouter();
    try {
      if (router && typeof router.abort === 'function') return router.abort();
    } catch (_) {}
    return null;
  }

  history(tabId) {
    const convId = this._byTab.get(tabId);
    const store = this._store();
    if (!convId || !store) return [];
    return this._readMessages(store, convId)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content && String(m.content).trim())
      .map((m) => ({ role: m.role, content: String(m.content), error: m.error || null }));
  }

  tabsFor(convId) {
    return [...this._byTab.entries()].filter(([, c]) => c === convId).map(([tabId]) => tabId);
  }

  adoptTab(newTabId, openerTabId) {
    if (newTabId == null || openerTabId == null) return false;
    const convId = this._byTab.get(openerTabId);
    if (!convId || this._byTab.has(newTabId)) return false;
    this._byTab.set(newTabId, convId);
    this._log(`tab ${newTabId} (opened from ${openerTabId}) joined conversation ${convId}`);
    return true;
  }

  onTabClosed(tabId) {
    const convId = this._byTab.get(tabId);
    if (!convId) return false;
    this._byTab.delete(tabId);
    if (this.tabsFor(convId).length) return true;
    const deleted = this._deleteConversation(convId);
    if (deleted) this._log(`conversation ${convId} deleted with tab ${tabId}`);
    return deleted;
  }

  sweep() {
    const store = this._store();
    if (!store || typeof store.listConversations !== 'function') return 0;
    const live = new Set(this._byTab.values());
    const stale = this._listAllConversations(store).filter((c) => c && c.mode === this.modeId && !live.has(c.id));
    const removed = stale.filter((c) => this._deleteConversation(c.id)).length;
    if (removed) this._log(`swept ${removed} stale conversation(s)`);
    return removed;
  }

  dispose() {
    for (const tabId of [...this._byTab.keys()]) this.onTabClosed(tabId);
  }

  _store() {
    const router = this._getRouter();
    return router && router.chatStore ? router.chatStore : null;
  }

  _modelListing() {
    const router = this._getRouter();
    if (!router || typeof router.listModels !== 'function') return null;
    try {
      return router.listModels();
    } catch (_) {
      return null;
    }
  }

  _refusalFor(router, content) {
    if (!router || typeof router.chat !== 'function') return { ...OnDemandService.ERRORS.notReady };
    if (!content) return { ...OnDemandService.ERRORS.empty };
    if (!this.modeLoaded()) return { ...OnDemandService.ERRORS.modeMissing };
    return null;
  }

  _turnRequest({ tabId, convId, modelRef, content, send, spoken }) {
    const prior = this.history(tabId)
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));
    return {
      conversationId: convId,
      modelRef,
      messages: [...prior, { role: 'user', content }],
      userMessage: content,
      agent: true,
      tools: true,
      choicesEnabled: false,
      noThink: true,
      voice: spoken ? true : undefined,
      send: typeof send === 'function' ? send : () => {},
    };
  }

  _liveTrackedConversation(store, tabId) {
    const existing = this._byTab.get(tabId);
    if (!existing) return null;
    try {
      if (store.getConversation(existing)) return existing;
    } catch (_) {}
    this._byTab.delete(tabId);
    return null;
  }

  _createConversation(store, tabId) {
    const data = this._pageData(tabId);
    const conversation = store.createConversation({
      title: this._titleFor(data),
      modelRef: this.currentModelRef(),
      toolsEnabled: true,
      choicesEnabled: false,
      mode: this.modeId,
      hidden: true,
    });
    store.setMeta(conversation.id, { mode: this.modeId, data });
    this._byTab.set(tabId, conversation.id);
    this._log(`conversation ${conversation.id} created for tab ${tabId}`);
    return conversation.id;
  }

  _pageData(tabId) {
    const info = this._getTabInfo(tabId) || {};
    return {
      tabId,
      url: info.url ? String(info.url) : '',
      title: info.title ? String(info.title) : '',
    };
  }

  _titleFor(data) {
    const name = (data.title || '').trim() || OnDemandService._hostOf(data.url) || 'this page';
    const clipped = name.length > OnDemandService.TITLE_MAX ? name.slice(0, OnDemandService.TITLE_MAX - 1) + '…' : name;
    return OnDemandService.TITLE_PREFIX + clipped;
  }

  _readMessages(store, convId) {
    try {
      return typeof store.listActiveMessages === 'function' ? store.listActiveMessages(convId) : store.listMessages(convId);
    } catch (_) {
      return [];
    }
  }

  _listAllConversations(store) {
    try {
      return store.listConversations({ includeHidden: true, includeArchived: true, limit: OnDemandService.SWEEP_LIMIT });
    } catch (_) {
      return [];
    }
  }

  _deleteConversation(convId) {
    const store = this._store();
    if (!store) return false;
    try {
      this._notifyDeleted(store, convId);
      return !!store.deleteConversation(convId);
    } catch (_) {
      return false;
    }
  }

  _notifyDeleted(store, convId) {
    const registry = this._registry;
    if (!registry || typeof registry.notifyConversationDeleted !== 'function') return;
    try {
      registry.notifyConversationDeleted(store.getMeta(convId));
    } catch (_) {}
  }

  static _hostOf(url) {
    if (!url) return '';
    try {
      return new URL(url).host;
    } catch (_) {
      return url;
    }
  }
}

module.exports = OnDemandService;

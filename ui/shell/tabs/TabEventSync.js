import TabStore from './TabStore.js';

export default class TabEventSync {
  constructor(deps) {
    this._d = deps;
  }

  install() {
    const api = window.tabAPI;
    if (!api) {
      console.error('tabAPI not available: preload may not have loaded');
      return;
    }
    api.onState((state) => this.onState(state));
    api.onSwitched((p) => this.onSwitched(p));
    api.onClosed((p) => this.onClosed(p));
    api.onHidden((p) => this.onHidden(p));
    if (typeof api.onMoved === 'function') api.onMoved((p) => this.onMoved(p));
    api.onNotificationIntercepted(({ tabId, notificationData }) => {
      if (typeof window.handleNotification === 'function') window.handleNotification(notificationData, tabId).catch((e) => console.error(e));
    });
  }

  onState(state) {
    const { store, strip, persistedMenu, favicons } = this._d;
    let entry = store.get(state.id);
    if (!entry) {
      entry = this._createMirror(state);
    } else {
      Object.assign(entry, state);
      if (!entry.tabElement && !state.silent && !state.hidden) strip.ensureElement(entry, state);
      strip.refresh(entry);
      persistedMenu.refreshButton();
    }
    if (state.favicon && state.url) favicons.remember(state.url, state.favicon);
    if (state.active || state.id === store.activeTabId) this._applyActiveState(state, entry);
  }

  onSwitched({ id }) {
    const d = this._d;
    d.strip.setActive(id);
    d.store.activeTabId = id;
    d.prompts.render();
    const entry = d.store.get(id);
    if (entry) this._showSwitchedTab(entry, id);
    d.autocomplete.hide();
    d.findBar.close(false);
    d.editBar.close();
    this._emit('activeTabChanged', id);
    d.host.hide();
    d.bounds.queue();
  }

  onClosed({ id }) {
    const { store, strip, closedTabs, persistedMenu } = this._d;
    const entry = store.get(id);
    if (entry && entry.tabElement) entry.tabElement.remove();
    closedTabs.remember(entry);
    store.delete(id);
    strip.updateDensity();
    this._emit('tabClosed', id);
    persistedMenu.refreshButton();
  }

  onHidden({ id }) {
    const entry = this._d.store.get(id);
    if (entry) {
      if (entry.tabElement) { entry.tabElement.remove(); entry.tabElement = null; }
      entry.hidden = true;
    }
    this._d.persistedMenu.refreshButton();
  }

  onMoved(p) {
    const order = p && Array.isArray(p.order) ? p.order : null;
    if (!order || !this._d.strip.tabBar) return;
    this._d.strip.applyOrder(order);
  }

  _createMirror(state) {
    const { store, strip, persistedMenu } = this._d;
    const entry = TabStore.entryFrom(state);
    if (!state.silent && !state.hidden) strip.ensureElement(entry, state);
    store.set(state.id, entry);
    strip.updateDensity();
    this._emit('tabCreated', state.id);
    persistedMenu.refreshButton();
    return entry;
  }

  _applyActiveState(state, entry) {
    const d = this._d;
    d.store.activeTabId = state.id;
    d.addressBar.showUrlUnlessEditing(state.url || '');
    d.nav.setHistoryState(state);
    d.nav.updateReloadButton();
    d.chromeKind.apply(state.kind || (entry && entry.kind) || 'user');
    d.star.refresh(state.url);
    this._emit('tabNavigated', state.id, state.url);
    this._emit('urlChanged', state.id, state.url);
  }

  _showSwitchedTab(entry, id) {
    const d = this._d;
    d.addressBar.showUrl(entry.url || '');
    d.nav.setHistoryState(entry);
    d.nav.updateReloadButton();
    d.chromeKind.apply(entry.kind || 'user');
    d.star.refresh(entry.url);
    if (entry.tabElement && typeof entry.tabElement.scrollIntoView === 'function') {
      entry.tabElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  _emit(event, ...args) {
    const renderer = this._d.browserRenderer;
    if (renderer) renderer.emit(event, ...args);
  }
}

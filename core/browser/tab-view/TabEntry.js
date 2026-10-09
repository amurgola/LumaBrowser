const NavigationGenerations = require('./NavigationGenerations');
const TabKinds = require('./TabKinds');

class TabEntry {
  constructor({ id, view, partition, url, title, kind, silent, pinned, keepAlive, hidden, openerTabId }) {
    this.id = id;
    this.view = view;
    this.webContents = view.webContents;
    this.partition = partition;
    this.silent = !!silent;
    this.kind = kind || TabKinds.DEFAULT;
    this.pinned = !!pinned;
    this.keepAlive = !!keepAlive;
    this.hidden = !!hidden;
    this.url = url;
    this.title = title;
    this.loading = false;
    this.canGoBack = false;
    this.canGoForward = false;
    this.zoomLevel = 1.0;
    this.createdAt = Date.now();
    this.openerTabId = Number.isFinite(openerTabId) ? openerTabId : null;
    this.lastNavigatedAt = null;
    this.lastActivatedAt = null;
    this.lastHttpStatus = null;
    this.favicon = null;
    this.history = [];
    this.consoleLogs = [];
    this.dialogHandler = null;
    this._crashedAt = 0;
    this._errorPageFor = null;
    this._renderedSourceUrl = null;
    this._nav = NavigationGenerations.fresh();
  }

  applyNavEvent(kind, payload) {
    const decision = NavigationGenerations.decide(this._nav, kind, payload);
    this._nav = decision.nav;
    return decision;
  }

  isInternal() {
    return TabKinds.isInternal(this.kind);
  }

  isAutomation() {
    return TabKinds.isAutomation(this.kind);
  }

  isInStrip() {
    return !this.silent && !this.hidden;
  }

  isRegularBrowsing() {
    return !this.silent && !this.isInternal() && !this.isAutomation();
  }
}

module.exports = TabEntry;

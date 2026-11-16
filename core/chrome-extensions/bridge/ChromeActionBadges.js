class ChromeActionBadges {
  static CHANNEL = 'chrome-extensions:badges';
  static OPAQUE = 255;

  constructor({ activeTabs }) {
    this._activeTabs = activeTabs;
    this._byExtension = new Map();
  }

  setText(extId, details) {
    const d = details || {};
    this._set(extId, 'text', ChromeActionBadges._isUnset(d.text) ? undefined : String(d.text), d.tabId);
  }

  setColor(extId, details) {
    const d = details || {};
    this._set(extId, 'color', ChromeActionBadges.cssColor(d.color), d.tabId);
  }

  badgesFor(tabId) {
    const badges = {};
    for (const [extId, state] of this._byExtension) {
      const own = state.tabs.get(tabId) || {};
      const text = own.text !== undefined ? own.text : state.all.text;
      if (text) badges[extId] = { text, color: own.color || state.all.color || null };
    }
    return badges;
  }

  badgesForWindow(win) {
    const shown = this._activeTabs().find((active) => active.window === win);
    return shown ? this.badgesFor(shown.tabId) : {};
  }

  clearTab(tabId) {
    let hadValues = false;
    for (const state of this._byExtension.values()) hadValues = state.tabs.delete(tabId) || hadValues;
    if (hadValues) this.publish(tabId);
  }

  forgetExtension(extId) {
    if (this._byExtension.delete(extId)) this.publish();
  }

  publish(tabId = null) {
    for (const shown of this._activeTabs()) {
      if (tabId !== null && shown.tabId !== tabId) continue;
      try {
        shown.window.webContents.send(ChromeActionBadges.CHANNEL, this.badgesFor(shown.tabId));
      } catch (_) {}
    }
  }

  static cssColor(color) {
    if (typeof color === 'string' && color.trim()) return color.trim();
    if (!Array.isArray(color) || color.length < 3) return undefined;
    const [r, g, b, a = ChromeActionBadges.OPAQUE] = color.map((part) => Math.min(Math.max(Number(part) || 0, 0), ChromeActionBadges.OPAQUE));
    return `rgba(${r}, ${g}, ${b}, ${Number((a / ChromeActionBadges.OPAQUE).toFixed(3))})`;
  }

  _set(extId, key, value, tabId) {
    const state = this._stateOf(extId);
    const forTab = Number.isInteger(tabId);
    const target = forTab ? (state.tabs.get(tabId) || {}) : state.all;
    if (value === undefined) delete target[key];
    else target[key] = value;
    if (forTab) state.tabs.set(tabId, target);
    this.publish(forTab ? tabId : null);
  }

  _stateOf(extId) {
    if (!this._byExtension.has(extId)) this._byExtension.set(extId, { all: {}, tabs: new Map() });
    return this._byExtension.get(extId);
  }

  static _isUnset(value) {
    return value === undefined || value === null;
  }
}

module.exports = ChromeActionBadges;

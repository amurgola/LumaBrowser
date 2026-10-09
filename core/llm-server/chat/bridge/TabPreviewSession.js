const BridgeGlobals = require('./BridgeGlobals');

class TabPreviewSession {
  static forRouter(router, hooks = {}) {
    const hostTabId = (router && router.llmServerService) ? router.llmServerService.pinnedTabId : null;
    return new TabPreviewSession({ preview: BridgeGlobals.tabPreview(), hostTabId, hooks });
  }

  constructor({ preview = null, hostTabId = null, hooks = {} } = {}) {
    this._preview = preview;
    this._hostTabId = hostTabId;
    this._hooks = hooks || {};
    this._active = null;
  }

  tabId() {
    return this._active;
  }

  start(tabId) {
    if (!this._canAttach(tabId)) return;
    if (!this._attach(tabId)) return;
    this._active = tabId;
    this._emit({ phase: 'tab', tabId });
  }

  async end() {
    if (this._active == null) return;
    const tabId = this._active;
    this._active = null;
    const frame = await this._captureFrame();
    try { this._preview.detach(); } catch (_) {}
    this._emit({ phase: 'tab-end', tabId, frame });
  }

  _canAttach(tabId) {
    if (!this._preview || this._hostTabId == null || tabId == null || this._active != null) return false;
    return !(typeof this._preview.isEnabled === 'function' && !this._preview.isEnabled());
  }

  _attach(tabId) {
    try {
      return !!(this._preview.attach({ tabId, hostTabId: this._hostTabId }) || {}).success;
    } catch (_) {
      return false;
    }
  }

  async _captureFrame() {
    try { return await this._preview.captureFrame(); } catch (_) { return null; }
  }

  _emit(payload) {
    if (!this._hooks.onToolEvent) return;
    try { this._hooks.onToolEvent(payload); } catch (_) {}
  }
}

module.exports = TabPreviewSession;

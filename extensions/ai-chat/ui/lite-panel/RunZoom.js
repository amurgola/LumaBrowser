export default class RunZoom {
  static RUN_FACTOR = 0.25;
  static RESET_FACTOR = 1.0;

  constructor({ tabAPI, getActiveTabId }) {
    this._tabAPI = tabAPI;
    this._getActiveTabId = getActiveTabId;
    this._zoomedTabId = null;
  }

  set(running) {
    if (!this._tabAPI || typeof this._tabAPI.setZoom !== 'function') return;
    try {
      if (running) this._zoomOut();
      else this._restore();
    } catch (_) {}
  }

  _zoomOut() {
    const tabId = this._getActiveTabId();
    if (tabId === null || tabId === undefined) return;
    this._zoomedTabId = tabId;
    this._tabAPI.setZoom(tabId, RunZoom.RUN_FACTOR);
  }

  _restore() {
    if (this._zoomedTabId === null || this._zoomedTabId === undefined) return;
    this._tabAPI.setZoom(this._zoomedTabId, RunZoom.RESET_FACTOR);
    this._zoomedTabId = null;
  }
}

export default class AcceleratorActions {
  constructor(deps) {
    this._d = deps;
  }

  handle(action, tabId, { fromPage = false } = {}) {
    const id = tabId != null ? tabId : this._d.store.activeTabId;
    if (this._tabSelection(action)) return;
    if (this._pageAction(action, id, fromPage)) return;
    this._chromeAction(action);
  }

  _tabSelection(action) {
    const { tabActions, strip, store } = this._d;
    const id = store.activeTabId;
    const ids = strip.visibleIds();
    switch (action) {
      case 'new-tab': tabActions.create(undefined, { focusUrl: true }); return true;
      case 'reopen-closed': tabActions.reopenClosed(); return true;
      case 'next-tab':
      case 'prev-tab':
        if (ids.length >= 2) tabActions.switchTo(ids[AcceleratorActions.cycle(ids, id, action === 'next-tab' ? 1 : -1)]);
        return true;
      case 'select-last-tab': if (ids.length) tabActions.switchTo(ids[ids.length - 1]); return true;
      default: {
        const m = /^select-tab-(\d)$/.exec(action);
        if (!m) return false;
        const n = parseInt(m[1]) - 1;
        if (ids[n] != null) tabActions.switchTo(ids[n]);
        return true;
      }
    }
  }

  static cycle(ids, activeId, dir) {
    const cur = Math.max(0, ids.indexOf(activeId));
    return (cur + dir + ids.length) % ids.length;
  }

  _pageAction(action, id, fromPage) {
    const api = window.tabAPI;
    const own = !fromPage && id != null && api;
    switch (action) {
      case 'close-tab': if (id != null) this._d.tabActions.close(id); return true;
      case 'reload': if (own) api.reload(id); return true;
      case 'hard-reload': if (own) (typeof api.hardReload === 'function' ? api.hardReload(id) : api.reload(id)); return true;
      case 'stop': this._stop(id, fromPage); return true;
      case 'back': if (own) api.goBack(id); return true;
      case 'forward': if (own) api.goForward(id); return true;
      case 'print': if (own && typeof api.print === 'function') api.print(id); return true;
      case 'zoom-in': this._zoom(id, fromPage, 0.1, false); return true;
      case 'zoom-out': this._zoom(id, fromPage, -0.1, false); return true;
      case 'zoom-reset': this._zoom(id, fromPage, 0, true); return true;
      case 'devtools': return true;
      default: return false;
    }
  }

  _stop(id, fromPage) {
    const { findBar, host } = this._d;
    const api = window.tabAPI;
    if (findBar.isOpen()) { findBar.close(true); return; }
    if (host.mode) { host.hide(); return; }
    if (!fromPage && id != null && api && typeof api.stop === 'function') api.stop(id);
  }

  _zoom(id, fromPage, delta, reset) {
    if (fromPage) this._d.tabActions.syncZoom(id);
    else this._d.tabActions.zoom(id, delta, reset);
  }

  _chromeAction(action) {
    const d = this._d;
    switch (action) {
      case 'runtime-trace': d.debugTools.startRuntimeTrace(); break;
      case 'focus-url': d.addressBar.focusAndSelect(); break;
      case 'find': d.findBar.open(); break;
      case 'find-next': d.findBar.step(true); break;
      case 'find-prev': d.findBar.step(false); break;
      case 'bookmark': d.star.clicked(); break;
      case 'history': d.historyModal.toggle(); break;
      case 'bookmarks': d.bookmarkManager.open(); break;
      case 'downloads': d.downloads.toggleMenu(); break;
      default: break;
    }
  }
}

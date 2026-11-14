export default class LocalPrefs {
  static SIDEBAR_KEY = 'luma.web.sidebar';
  static MODEL_KEY = 'luma.web.model';
  static NARROW_QUERY = '(max-width: 760px)';

  constructor(storage, win = null) {
    this._storage = storage;
    this._win = win;
  }

  getSidebarCollapsed() {
    const stored = this._get(LocalPrefs.SIDEBAR_KEY, null);
    return Promise.resolve(stored == null ? this._narrowScreen() : stored === '1');
  }

  setSidebarCollapsed(collapsed) {
    this._set(LocalPrefs.SIDEBAR_KEY, collapsed ? '1' : '0');
    return Promise.resolve({ success: true });
  }

  setLastModelRef(ref) {
    this._set(LocalPrefs.MODEL_KEY, ref);
    return Promise.resolve({ success: true });
  }

  _narrowScreen() {
    try {
      return !!(this._win && this._win.matchMedia && this._win.matchMedia(LocalPrefs.NARROW_QUERY).matches);
    } catch (_) {
      return false;
    }
  }

  _get(key, fallback) {
    try {
      const v = this._storage.getItem(key);
      return v == null ? fallback : v;
    } catch (_) {
      return fallback;
    }
  }

  _set(key, value) {
    try {
      this._storage.setItem(key, value);
    } catch (_) {}
  }
}

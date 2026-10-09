export default class LocalPrefs {
  static SIDEBAR_KEY = 'luma.web.sidebar';
  static MODEL_KEY = 'luma.web.model';

  constructor(storage) {
    this._storage = storage;
  }

  getSidebarCollapsed() {
    return Promise.resolve(this._get(LocalPrefs.SIDEBAR_KEY, '0') === '1');
  }

  setSidebarCollapsed(collapsed) {
    this._set(LocalPrefs.SIDEBAR_KEY, collapsed ? '1' : '0');
    return Promise.resolve({ success: true });
  }

  setLastModelRef(ref) {
    this._set(LocalPrefs.MODEL_KEY, ref);
    return Promise.resolve({ success: true });
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

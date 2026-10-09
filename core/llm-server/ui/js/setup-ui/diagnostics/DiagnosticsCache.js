export default class DiagnosticsCache {
  static KEY = 'luma.setup.diagSnapshot.v1';

  static read(storage = window.localStorage) {
    try {
      const raw = storage.getItem(DiagnosticsCache.KEY);
      const cached = raw ? JSON.parse(raw) : null;
      return cached && cached.data && cached.data.platform ? cached.data : null;
    } catch (_) { return null; }
  }

  static write(data, storage = window.localStorage) {
    try { storage.setItem(DiagnosticsCache.KEY, JSON.stringify({ at: Date.now(), data })); } catch (_) {}
  }
}

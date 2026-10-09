export default class FoldMemory {
  static PREFIX = 'luma.setup.fold.';

  static _installed = new WeakSet();

  static isOpen(key, dflt) {
    try {
      const stored = window.localStorage.getItem(FoldMemory.PREFIX + key);
      if (stored === '1') return true;
      if (stored === '0') return false;
    } catch (_) {}
    return !!dflt;
  }

  static attr(key, dflt) {
    return FoldMemory.isOpen(key, dflt) ? 'open' : '';
  }

  static install(doc) {
    if (!doc || FoldMemory._installed.has(doc)) return;
    FoldMemory._installed.add(doc);
    doc.addEventListener('toggle', (event) => FoldMemory._record(event.target), true);
  }

  static _record(details) {
    const key = details && details.getAttribute && details.getAttribute('data-fold-key');
    if (!key) return;
    try { window.localStorage.setItem(FoldMemory.PREFIX + key, details.open ? '1' : '0'); } catch (_) {}
  }
}

export default class TabMenuContributors {
  static WAIT_MS = 300;

  constructor() {
    this._contributors = new Set();
  }

  get size() {
    return this._contributors.size;
  }

  register(fn) {
    if (typeof fn !== 'function') return () => {};
    this._contributors.add(fn);
    return () => { this._contributors.delete(fn); };
  }

  async collect(tab, tabId, map) {
    const extra = [];
    if (!this._contributors.size) return extra;
    const snapshot = TabMenuContributors.snapshot(tab);
    const add = (action, label, fn, opts = {}) => {
      if (!action || !label || typeof fn !== 'function') return;
      extra.push(Object.assign({ action, label }, opts));
      map[action] = fn;
    };
    await Promise.race([this._runAll(snapshot, tabId, add), TabMenuContributors._timeout()]);
    return extra;
  }

  static snapshot(tab) {
    return {
      id: tab.id, url: tab.url, title: tab.title, kind: tab.kind || 'user',
      keepAlive: !!tab.keepAlive, hidden: !!tab.hidden, pinned: !!tab.pinned, active: !!tab.active,
    };
  }

  _runAll(snapshot, tabId, add) {
    return Promise.all([...this._contributors].map(async (fn) => {
      try { await fn({ tab: snapshot, tabId, add }); } catch (err) { console.warn('tab menu contributor failed:', err && err.message); }
    }));
  }

  static _timeout() {
    return new Promise((resolve) => setTimeout(resolve, TabMenuContributors.WAIT_MS));
  }
}

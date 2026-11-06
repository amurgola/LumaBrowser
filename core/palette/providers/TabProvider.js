const PaletteMatcher = require('../PaletteMatcher');

class TabProvider {
  constructor({ getTabs }) {
    this._getTabs = getTabs;
  }

  search(query, { windowId, limit = 5 } = {}) {
    let tabs = [];
    try { tabs = this._getTabs(windowId) || []; } catch (_) { return []; }
    const hits = [];
    for (const tab of tabs) {
      if (!tab || tab.silent || tab.hidden) continue;
      const m = PaletteMatcher.score(query, [{ text: tab.title, weight: 1 }, { text: TabProvider.address(tab.url), weight: 0.75 }]);
      if (m) hits.push({ tab, m });
    }
    hits.sort((a, b) => b.m.score - a.m.score);
    return hits.slice(0, limit).map(({ tab, m }) => ({
      kind: 'tab',
      id: String(tab.id),
      title: tab.title || TabProvider.address(tab.url) || 'Tab',
      subtitle: TabProvider.address(tab.url),
      tag: tab.active ? 'Current' : '',
      marks: m.marks,
      score: m.score,
      data: { tabId: tab.id },
    }));
  }

  static address(url) {
    return String(url || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
}

module.exports = TabProvider;

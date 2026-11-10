const SettingsProvider = require('./providers/SettingsProvider');
const ConversationProvider = require('./providers/ConversationProvider');
const ArtifactProvider = require('./providers/ArtifactProvider');

class PaletteSearch {
  static GROUPS = Object.freeze([
    { id: 'settings', label: 'Settings', limit: 6 },
    { id: 'actions', label: 'Commands', limit: 4 },
    { id: 'tabs', label: 'Open tabs', limit: 4 },
    { id: 'conversations', label: 'Conversations', limit: 6 },
    { id: 'artifacts', label: 'Artifacts', limit: 4 },
  ]);
  static RECENT_LIMIT = 5;
  static MAX_QUERY = 300;

  constructor({ providers, recent, getChatStore = () => null, getArtifactStore = () => null }) {
    this._p = providers;
    this._recent = recent;
    this._getChatStore = getChatStore;
    this._getArtifactStore = getArtifactStore;
  }

  search(rawQuery, { windowId = null } = {}) {
    const query = String(rawQuery || '').slice(0, PaletteSearch.MAX_QUERY).trim();
    if (!query) return { query, groups: this.recentGroups() };
    const groups = [];
    PaletteSearch.GROUPS.forEach((g, order) => {
      const provider = this._p[g.id];
      if (!provider) return;
      let items = [];
      try { items = provider.search(query, { limit: g.limit, windowId }) || []; } catch (_) { items = []; }
      if (items.length) groups.push({ id: g.id, label: g.label, items, best: items[0].score || 0, order });
    });
    groups.sort((a, b) => (b.best - a.best) || (a.order - b.order));
    return { query, groups: groups.map(({ id, label, items }) => ({ id, label, items })) };
  }

  recentGroups() {
    const items = this.recentItems();
    return items.length ? [{ id: 'recent', label: 'Recent', items }] : [];
  }

  recentItems() {
    const out = [];
    for (const place of this._recent.list(40)) {
      const item = this._recentItem(place);
      if (item) out.push(item);
      if (out.length >= PaletteSearch.RECENT_LIMIT) break;
    }
    return out;
  }

  _recentItem(place) {
    switch (place.kind) {
      case 'conversation': return this._recentConversation(place);
      case 'artifact': return this._recentArtifact(place);
      case 'setting': return this._recentSetting(place);
      case 'settings':
        return { kind: 'settings', id: place.ref, title: place.title, subtitle: 'Settings', marks: [], score: 0 };
      case 'setup':
        return { kind: 'setup', id: place.ref, title: place.title, subtitle: 'LLM Setup', marks: [], score: 0 };
      default: return null;
    }
  }

  _recentConversation(place) {
    const store = this._getChatStore();
    const conv = store ? store.getConversation(place.ref) : null;
    if (!conv || conv.hidden) return null;
    return ConversationProvider.item(conv);
  }

  _recentArtifact(place) {
    const store = this._getArtifactStore();
    const versions = store ? store.versions(place.ref) : [];
    if (!versions.length) return null;
    const last = versions[versions.length - 1];
    return ArtifactProvider.item({
      id: last.id, rootId: place.ref, title: last.title || place.title, type: last.type,
      conversationId: last.conversationId, conversationTitle: place.subtitle || null, orphaned: !last.conversationId,
    });
  }

  _recentSetting(place) {
    const entry = this._p.settings && this._p.settings.byId(place.ref);
    return entry ? (this._p.settings.itemFor ? this._p.settings.itemFor(entry) : SettingsProvider.item(entry)) : null;
  }
}

module.exports = PaletteSearch;

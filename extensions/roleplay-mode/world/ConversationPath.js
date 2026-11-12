const HostGlobals = require('../HostGlobals');

class ConversationPath {
  static MAX_DEPTH = 100000;

  constructor(store = ConversationPath._hostStore) {
    this._store = store;
  }

  static _hostStore() {
    const router = HostGlobals.chatRouter();
    return (router && router.chatStore) || null;
  }

  available() {
    const s = this._s();
    return !!(s && typeof s.getMessage === 'function' && typeof s.listActiveMessages === 'function' && typeof s.getMeta === 'function');
  }

  tracks(conversationId, messageId) {
    if (!conversationId || !messageId || !this.available()) return false;
    const m = this._get(messageId);
    return !!(m && m.conversationId === conversationId);
  }

  exists(messageId) {
    return !!this._get(messageId);
  }

  activeMessages(conversationId) {
    const s = this._s();
    if (!s || !conversationId || typeof s.listActiveMessages !== 'function') return [];
    try { return s.listActiveMessages(conversationId) || []; } catch (_) { return []; }
  }

  ancestors(conversationId, messageId) {
    const active = this.activeMessages(conversationId).map((m) => m.id);
    const at = active.indexOf(messageId);
    if (at >= 0) return active.slice(0, at);
    const ids = [];
    const seen = new Set([messageId]);
    let cur = this._get(messageId);
    while (cur && cur.parentId && !seen.has(cur.parentId) && ids.length < ConversationPath.MAX_DEPTH) {
      seen.add(cur.parentId);
      const parent = this._get(cur.parentId);
      if (!parent) break;
      ids.push(parent.id);
      cur = parent;
    }
    return ids.reverse();
  }

  tree(conversationId) {
    const s = this._s();
    if (!s || typeof s.listMessages !== 'function') return [];
    try {
      return (s.listMessages(conversationId) || []).map((m) => ({
        id: m.id, role: m.role, parentId: m.parentId || null, active: m.variantActive !== false && m.variantActive !== 0, content: m.content || '',
      }));
    } catch (_) {
      return [];
    }
  }

  message(messageId) {
    return this._get(messageId);
  }

  liveIds(conversationId) {
    const s = this._s();
    if (!s || typeof s.listMessages !== 'function') return null;
    try { return new Set((s.listMessages(conversationId) || []).map((m) => m.id)); } catch (_) { return null; }
  }

  data(conversationId) {
    const s = this._s();
    try { return (s && s.getMeta(conversationId) && s.getMeta(conversationId).data) || {}; } catch (_) { return {}; }
  }

  _get(messageId) {
    const s = this._s();
    if (!s || !messageId || typeof s.getMessage !== 'function') return null;
    try { return s.getMessage(messageId) || null; } catch (_) { return null; }
  }

  _s() {
    try { return typeof this._store === 'function' ? this._store() : this._store; } catch (_) { return null; }
  }
}

module.exports = ConversationPath;

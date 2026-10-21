class BuilderMeta {
  static MODE = 'site-api-builder';

  static read(chatStore, conversationId) {
    if (!chatStore || !conversationId || typeof chatStore.getMeta !== 'function') return {};
    try {
      const meta = chatStore.getMeta(conversationId);
      return BuilderMeta.dataOf(meta);
    } catch (_) {
      return {};
    }
  }

  static dataOf(meta) {
    const data = meta && meta.data;
    return data && typeof data === 'object' ? { ...data } : {};
  }

  static patch(chatStore, conversationId, patch = {}) {
    const current = BuilderMeta.read(chatStore, conversationId);
    const next = BuilderMeta.merge(current, patch);
    if (chatStore && conversationId && typeof chatStore.setMeta === 'function') {
      try { chatStore.setMeta(conversationId, { mode: BuilderMeta.MODE, data: next }); } catch (_) {}
    }
    return next;
  }

  static merge(current, patch) {
    const next = { ...current };
    for (const [key, value] of Object.entries(patch || {})) {
      if (value === undefined) continue;
      if (value === null) delete next[key];
      else next[key] = value;
    }
    return next;
  }

  static isBound(data) {
    return !!(data && (data.siteId || (data.partition && data.origin)));
  }

  static originOf(url) {
    try {
      const parsed = new URL(String(url || ''));
      return /^https?:$/.test(parsed.protocol) ? parsed.origin : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = BuilderMeta;

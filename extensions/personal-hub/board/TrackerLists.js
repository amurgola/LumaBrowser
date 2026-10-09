class TrackerLists {
  static CACHE_MS = 10 * 60 * 1000;

  constructor({ fetchImpl = null, now = () => new Date() } = {}) {
    this._fetchImpl = fetchImpl;
    this._now = now;
    this._cache = new Map();
  }

  async lists(ctx) {
    const listIds = (ctx.source.config && ctx.source.config.listIds) || [];
    const key = `${ctx.source.id}:${listIds.join(',')}`;
    const cached = this._cache.get(key);
    const nowMs = this._now().getTime();
    if (cached && nowMs - cached.at < TrackerLists.CACHE_MS) return cached.lists;
    const lists = await ctx.provider.describeLists({ token: ctx.token, listIds, fetchImpl: this._fetchImpl });
    this._cache.set(key, { at: nowMs, lists });
    return lists;
  }

  async statuses(ctx, listId = '') {
    let lists;
    try { lists = await this.lists(ctx); } catch (_) { return null; }
    const chosen = listId ? lists.filter((l) => l.id === String(listId)) : lists;
    const pool = chosen.length ? chosen : lists;
    const seen = new Map();
    for (const list of pool) {
      for (const s of list.statuses || []) {
        const key = s && s.status ? String(s.status).toLowerCase() : '';
        if (key && !seen.has(key)) seen.set(key, s);
      }
    }
    return [...seen.values()];
  }

  async listName(ctx, listId) {
    try {
      const found = (await this.lists(ctx)).find((l) => l.id === String(listId));
      return found ? found.name : '';
    } catch (_) {
      return '';
    }
  }
}

module.exports = TrackerLists;

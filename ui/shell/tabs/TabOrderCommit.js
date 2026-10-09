export default class TabOrderCommit {
  static async commit(api, domOrder, movedId) {
    if (!api || typeof api.moveTab !== 'function') return;
    const at = domOrder.indexOf(movedId);
    if (at < 0) return;
    const full = await TabOrderCommit._fullOrder(api);
    api.moveTab(movedId, TabOrderCommit.targetIndex(full, domOrder, movedId));
  }

  static targetIndex(full, domOrder, movedId) {
    const at = domOrder.indexOf(movedId);
    if (!full.length) return at;
    const nextId = domOrder[at + 1];
    const without = full.filter((id) => id !== movedId);
    return nextId != null && without.indexOf(nextId) >= 0 ? without.indexOf(nextId) : without.length;
  }

  static async _fullOrder(api) {
    try {
      const all = typeof api.getAll === 'function' ? await api.getAll() : null;
      return Array.isArray(all) ? all.map((t) => t.id) : [];
    } catch (_) { return []; }
  }
}

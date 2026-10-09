export default class TaskBadges {
  constructor(api, doc) {
    this._api = api;
    this._doc = doc;
  }

  async refresh() {
    const scheduled = await this._scheduledRootIds();
    this._doc.querySelectorAll('.db-card[data-root-id]').forEach((card) => {
      const badge = card.querySelector('.db-task-badge');
      if (badge) badge.hidden = !scheduled.has(card.dataset.rootId);
    });
  }

  async _scheduledRootIds() {
    let tasks = [];
    try {
      const r = await this._api.tasks.list();
      if (r && r.success) tasks = r.tasks || [];
    } catch (_) {}
    return new Set(tasks.filter((t) => t.enabled).map((t) => t.rootId));
  }
}

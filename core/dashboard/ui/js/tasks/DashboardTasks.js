import DashboardModal from './DashboardModal.js';
import TaskBadges from './TaskBadges.js';
import TaskHistory from './TaskHistory.js';
import TaskPanel from './TaskPanel.js';

export default class DashboardTasks {
  constructor(api, doc, { onRunFinished }) {
    this._api = api;
    this._enabled = !!(api && api.tasks);
    this._onRunFinished = onRunFinished;
    if (!this._enabled) return;
    const modal = new DashboardModal(doc);
    this._badges = new TaskBadges(api, doc);
    this._panel = new TaskPanel({ api, doc, modal, badges: this._badges, history: new TaskHistory(api, doc, modal) });
  }

  openPanel(rootId, title) {
    return this._enabled ? this._panel.open(rootId, title) : Promise.resolve();
  }

  refreshBadges() {
    return this._enabled ? this._badges.refresh() : Promise.resolve();
  }

  wireEvents() {
    if (!this._enabled) return;
    this._api.tasks.onEvent(({ type } = {}) => {
      if (type === 'run-finished') this._onRunFinished();
      if (type === 'run-finished' || type === 'run-started') this._badges.refresh();
    });
  }
}

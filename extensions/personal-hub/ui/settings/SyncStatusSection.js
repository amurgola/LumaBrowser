import HubSection from './HubSection.js';

export default class SyncStatusSection extends HubSection {
  constructor(tab) {
    super(tab);
    this._status = null;
  }

  html() {
    return `
    <div class="ext-layout-inline ext-layout-inline--space-between">
      <div class="ext-status-row">
        <span class="luma-dot" id="ext-hub-syncDot"></span>
        <span id="ext-hub-syncText">Loading sync status</span>
      </div>
      <button class="luma-btn luma-btn--sm" id="ext-hub-syncAllBtn">Sync everything now</button>
    </div>`;
  }

  bind(container) {
    super.bind(container);
    this.$('syncAllBtn').addEventListener('click', () => this._syncAll());
  }

  async load() {
    if (!this._root) return;
    const { status } = await this.call('syncStatus');
    this._status = status || { running: false, calendars: [], tasks: [] };
    this._render();
  }

  static text(status) {
    const sources = [...(status.calendars || []), ...(status.tasks || [])];
    const failing = sources.filter((s) => s.lastStatus === 'error').length;
    const calendars = (status.calendars || []).length;
    const trackers = (status.tasks || []).length;
    const head = status.running ? 'Syncing now.' : 'Idle.';
    const parts = [`${calendars} calendar${calendars === 1 ? '' : 's'}`, `${trackers} tracker${trackers === 1 ? '' : 's'}`];
    return `${head} ${parts.join(' and ')}${failing ? `, ${failing} failing` : ''}.`;
  }

  _render() {
    const status = this._status;
    const failing = [...(status.calendars || []), ...(status.tasks || [])].some((s) => s.lastStatus === 'error');
    const dot = this.$('syncDot');
    dot.classList.toggle('bad', failing);
    dot.classList.toggle('ok', !failing && !status.running);
    this.$('syncText').textContent = SyncStatusSection.text(status);
    this.$('syncAllBtn').disabled = !!status.running;
  }

  _syncAll() {
    return this.act(async () => {
      await this.call('syncNow', { kind: 'all' });
      await this._tab.reloadAll();
    }, 'Sync finished.');
  }
}

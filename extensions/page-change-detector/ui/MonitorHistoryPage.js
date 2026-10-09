import MonitorHistoryMarkup from './MonitorHistoryMarkup.js';
import MonitorText from './MonitorText.js';

export default class MonitorHistoryPage {
  static PAGE_SIZE = 25;

  static freshView(monitorId = null) {
    return { monitorId, page: 0, pageSize: MonitorHistoryPage.PAGE_SIZE, changedOnly: true };
  }

  constructor(root, { view, invoke, getMonitors, onOpenPanel }) {
    this.view = view;
    this._invoke = invoke;
    this._getMonitors = getMonitors;
    this._refs = MonitorHistoryPage._findRefs(root);
    this._bind(onOpenPanel);
  }

  show(monitorId) {
    this.view = MonitorHistoryPage.freshView(monitorId);
    this.refresh();
  }

  refresh() {
    const r = this._refs;
    const monitors = this._getMonitors();
    if (r.summary) r.summary.textContent = MonitorText.settingsSummary(monitors);
    if (r.monitor) {
      const current = this.view.monitorId || r.monitor.value;
      r.monitor.innerHTML = MonitorHistoryMarkup.monitorOptions(monitors);
      if (current && monitors.some((m) => m.id === current)) r.monitor.value = current;
      this.view.monitorId = r.monitor.value || null;
    }
    if (r.mode) {
      r.mode.querySelectorAll('button').forEach((b) => b.classList.toggle('active', (b.dataset.mode === 'changed') === this.view.changedOnly));
    }
    this.loadPage();
  }

  syncMonitors() {
    const r = this._refs;
    if (!r.monitor) return;
    const monitors = this._getMonitors();
    const current = this.view.monitorId;
    r.monitor.innerHTML = MonitorHistoryMarkup.monitorOptions(monitors);
    if (current && monitors.some((m) => m.id === current)) r.monitor.value = current;
    else this.view.monitorId = r.monitor.value || null;
    if (r.summary) r.summary.textContent = MonitorText.settingsSummary(monitors);
  }

  async loadPage() {
    const r = this._refs;
    if (!r.list || !r.pager || !r.stats) return;
    if (!this.view.monitorId) return this._showNoMonitor();
    const result = await this._fetchPage();
    if (!result || !Array.isArray(result.items)) {
      r.list.innerHTML = '<div class="luma-error">Could not load history.</div>';
      return;
    }
    this._renderPage(result);
  }

  static _findRefs(root) {
    const q = (sel) => root.querySelector(sel);
    return {
      summary: q('#ext-pcd-settingsSummary'),
      monitor: q('#ext-pcd-historyMonitor'),
      mode: q('#ext-pcd-historyMode'),
      stats: q('#ext-pcd-historyStats'),
      list: q('#ext-pcd-historyList'),
      pager: q('#ext-pcd-historyPager'),
      openBtn: q('#ext-pcd-openPanelBtn'),
    };
  }

  _bind(onOpenPanel) {
    const r = this._refs;
    if (r.openBtn) r.openBtn.addEventListener('click', () => onOpenPanel());
    if (r.monitor) {
      r.monitor.addEventListener('change', () => {
        this.view.monitorId = r.monitor.value || null;
        this.view.page = 0;
        this.loadPage();
      });
    }
    if (r.mode) r.mode.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => this._setMode(btn)));
  }

  _setMode(btn) {
    const changedOnly = btn.dataset.mode === 'changed';
    if (this.view.changedOnly === changedOnly) return;
    this.view.changedOnly = changedOnly;
    this.view.page = 0;
    this._refs.mode.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
    this.loadPage();
  }

  _showNoMonitor() {
    const r = this._refs;
    r.stats.textContent = '';
    r.list.innerHTML = '<div class="luma-empty">Create a monitor in the panel to see its check history here.</div>';
    r.pager.innerHTML = '';
  }

  async _fetchPage() {
    const { monitorId, page, pageSize, changedOnly } = this.view;
    try {
      return await this._invoke('getHistoryPaged', monitorId, { page, pageSize, changedOnly });
    } catch (err) {
      return null;
    }
  }

  _renderPage(result) {
    const r = this._refs;
    const { page, pageSize, changedOnly } = this.view;
    const total = result.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    r.stats.textContent = this._statsText(total);
    if (result.items.length === 0) {
      r.list.innerHTML = `<div class="luma-empty">${changedOnly ? 'No changes recorded yet.' : 'No checks recorded yet.'}</div>`;
      r.pager.innerHTML = '';
      return;
    }
    r.list.innerHTML = MonitorHistoryMarkup.pageItems(result.items, changedOnly);
    r.pager.innerHTML = MonitorHistoryMarkup.pager(page, totalPages);
    this._bindPager(totalPages);
  }

  _statsText(total) {
    const { monitorId, changedOnly } = this.view;
    const monitor = this._getMonitors().find((m) => m.id === monitorId);
    const recorded = monitor ? `${monitor.change_count} change${monitor.change_count !== 1 ? 's' : ''} recorded` : '';
    return `${recorded}${recorded ? ', ' : ''}${total} ${changedOnly ? 'change' : 'check'}${total !== 1 ? 's' : ''} in this view`;
  }

  _bindPager(totalPages) {
    const pager = this._refs.pager;
    pager.querySelector('.pcd-pager-prev').addEventListener('click', () => {
      if (this.view.page > 0) { this.view.page--; this.loadPage(); }
    });
    pager.querySelector('.pcd-pager-next').addEventListener('click', () => {
      if (this.view.page < totalPages - 1) { this.view.page++; this.loadPage(); }
    });
  }
}

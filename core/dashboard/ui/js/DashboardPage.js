import DashboardGrid from './DashboardGrid.js';
import DashboardMode from './DashboardMode.js';
import FatalNotice from './FatalNotice.js';
import LayoutSaver from './LayoutSaver.js';
import WidgetCards from './WidgetCards.js';
import WidgetCatalog from './WidgetCatalog.js';
import WidgetDock from './WidgetDock.js';
import WidgetMounts from './WidgetMounts.js';
import DashboardTasks from './tasks/DashboardTasks.js';

export default class DashboardPage {
  static NO_API = 'This page must run inside LumaBrowser\'s Dashboard tab.';
  static FILE_PROTOCOL = 'The Dashboard needs the local API server to load widget assets. Enable the REST API in Settings, then reopen the Dashboard.';
  static NO_ASSETS = 'Dashboard assets failed to load. Restart the app if you just updated.';

  constructor(win, doc) {
    this._win = win;
    this._doc = doc;
    this._api = win.dashboardAPI;
  }

  async start() {
    if (!this._checkEnvironment()) return;
    this._build();
    this._wireGrid();
    this._wireControls();
    this._wireLifecycle();
    this._wirePinned();
    await this._restoreLayout();
  }

  addWidget(rootId, pos) {
    if (!this._grid.isReady() || this._grid.isPlaced(rootId)) return;
    const meta = this._catalog.get(rootId);
    const card = meta ? this._cards.card(rootId, meta.title, { kind: meta.kind }) : this._cards.tombstone();
    this._grid.add(rootId, card, DashboardPage._sizedPos(pos, meta));
    if (meta) this._mounts.mount(rootId, card);
    this._dock.render();
    this._mode.syncEmpty();
    this._tasks.refreshBadges();
  }

  async refreshDock() {
    await this._catalog.refresh();
    this._dock.render();
  }

  _checkEnvironment() {
    if (!this._api) return this._fail(DashboardPage.NO_API);
    if (this._win.location.protocol === 'file:') return this._fail(DashboardPage.FILE_PROTOCOL);
    if (!this._win.GridStack) return this._fail(DashboardPage.NO_ASSETS);
    return true;
  }

  _fail(message) {
    FatalNotice.show(this._doc, message);
    return false;
  }

  _build() {
    const api = this._api;
    const doc = this._doc;
    const refreshDock = () => this.refreshDock();
    this._catalog = new WidgetCatalog(api);
    this._grid = new DashboardGrid(this._win.GridStack).init();
    this._saver = new LayoutSaver(api, this._grid);
    this._tasks = new DashboardTasks(api, doc, { onRunFinished: () => this._mounts.remountStale() });
    this._cards = new WidgetCards(doc, this._cardHandlers());
    this._mounts = new WidgetMounts({ api, doc, catalog: this._catalog, cards: this._cards, refreshDock });
    this._dock = new WidgetDock({ doc, catalog: this._catalog, grid: this._grid, onAdd: (rootId) => this._addAndSave(rootId) });
    this._mode = new DashboardMode({ doc, grid: this._grid, refreshDock });
  }

  _cardHandlers() {
    return {
      remove: (card) => this._grid.removeCard(card),
      reload: (rootId, card) => this._mounts.remount(rootId, card),
      chat: (rootId) => {
        const meta = this._catalog.get(rootId);
        this._api.openChat(meta && meta.conversationId ? meta.conversationId : null);
      },
      schedule: (rootId, title) => this._tasks.openPanel(rootId, title),
    };
  }

  _addAndSave(rootId) {
    this.addWidget(rootId, null);
    this._saver.schedule();
  }

  _wireGrid() {
    this._grid.on('dropped', (_ev, _prev, node) => this._onDropped(node));
    this._grid.on('change', () => this._saver.schedule());
    this._grid.on('added', () => this._mode.syncEmpty());
    this._grid.on('removed', (_ev, nodes) => this._onRemoved(nodes));
  }

  _onDropped(node) {
    const rootId = node && node.el ? node.el.getAttribute('data-root-id') : null;
    const pos = node ? { x: node.x, y: node.y, w: node.w || DashboardGrid.DEFAULT_W, h: node.h || DashboardGrid.DEFAULT_H } : null;
    if (node && node.el) this._grid.discardDropped(node.el);
    if (rootId) this.addWidget(rootId, pos);
    this._saver.schedule();
  }

  _onRemoved(nodes) {
    for (const n of nodes || []) {
      if (n && n.id) this._mounts.dispose(String(n.id));
    }
    this._dock.syncPlaced();
    this._mode.syncEmpty();
    this._saver.schedule();
  }

  _wireControls() {
    this._doc.querySelectorAll('#dbModeSlider button').forEach((b) => {
      b.addEventListener('click', () => this._mode.set(b.dataset.mode === 'edit'));
    });
    this._doc.getElementById('dbDockRefresh').addEventListener('click', () => this.refreshDock());
    this._doc.getElementById('dbHiddenToggle').addEventListener('click', () => this._dock.toggleShowHidden());
  }

  _wireLifecycle() {
    this._doc.addEventListener('visibilitychange', () => {
      if (this._doc.hidden) this._saver.flush();
      else this._mounts.remountStale();
    });
    this._win.addEventListener('pagehide', () => this._saver.flush());
  }

  _wirePinned() {
    if (!this._api.onPinned) return;
    this._api.onPinned(async ({ rootId, pos } = {}) => {
      if (!rootId) return;
      await this.refreshDock();
      this.addWidget(rootId, pos || null);
    });
  }

  async _restoreLayout() {
    await this.refreshDock();
    const layout = await this._savedLayout();
    for (const item of layout) {
      if (item && item.rootId) this.addWidget(item.rootId, item);
    }
    this._mode.set(layout.length === 0);
    this._tasks.wireEvents();
    this._tasks.refreshBadges();
  }

  static _sizedPos(pos, meta) {
    if (!meta || meta.kind !== 'extension' || !(meta.w || meta.h)) return pos;
    const base = pos && typeof pos === 'object' ? pos : {};
    return { ...base, w: base.w || meta.w, h: base.h || meta.h };
  }

  async _savedLayout() {
    try {
      const r = await this._api.layout.get();
      if (r && r.success) return r.layout || [];
    } catch (_) {}
    return [];
  }
}

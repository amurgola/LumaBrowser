import TabStripDrag from './TabStripDrag.js';

export default class TabStripInput {
  constructor({ strip, tabActions, contextMenu, persistedMenu }) {
    this._strip = strip;
    this._tabs = tabActions;
    this._contextMenu = contextMenu;
    this._persistedMenu = persistedMenu;
    this._drag = new TabStripDrag({ strip });
  }

  install() {
    const bar = this._strip.tabBar;
    document.getElementById('newTabBtn').addEventListener('click', () => { this._tabs.create(undefined, { focusUrl: true }); });
    bar.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    this._drag.install();
    document.getElementById('persistedTabsBtn')?.addEventListener('click', () => { this._persistedMenu.show(); });
    bar.addEventListener('click', (e) => this._onClick(e));
    bar.addEventListener('mousedown', (e) => this._onMiddleDown(e));
    bar.addEventListener('contextmenu', (e) => this._onContextMenu(e));
  }

  static _tabId(tabEl) {
    return parseInt(tabEl.dataset.tabId);
  }

  _onWheel(e) {
    const bar = this._strip.tabBar;
    if (e.ctrlKey || bar.scrollWidth <= bar.clientWidth) return;
    e.preventDefault();
    bar.scrollLeft += (e.deltaY || e.deltaX);
  }

  _onClick(e) {
    const tab = e.target.closest('.tab');
    const closeBtn = e.target.closest('.tab-close');
    if (closeBtn && tab) {
      e.stopPropagation();
      this._tabs.close(TabStripInput._tabId(tab));
    } else if (tab) {
      this._tabs.switchTo(TabStripInput._tabId(tab));
    }
  }

  _onMiddleDown(e) {
    if (e.button !== 1) return;
    const tab = e.target.closest('.tab');
    if (!tab) return;
    e.preventDefault();
    if (tab.dataset.pinned === 'true') return;
    this._tabs.close(TabStripInput._tabId(tab));
  }

  _onContextMenu(e) {
    const tabEl = e.target.closest('.tab');
    if (!tabEl) return;
    e.preventDefault();
    this._contextMenu.show(e.clientX, e.clientY, TabStripInput._tabId(tabEl));
  }
}

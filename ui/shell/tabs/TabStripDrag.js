import TabOrderCommit from './TabOrderCommit.js';

export default class TabStripDrag {
  static MIME = 'application/x-luma-tab';

  static DROP_BEFORE = 'drop-before';

  static DROP_AFTER = 'drop-after';

  constructor({ strip, getApi = () => window.tabAPI }) {
    this._strip = strip;
    this._getApi = getApi;
    this._dragTabId = null;
    this._droppedHere = false;
  }

  install() {
    const bar = this._strip.tabBar;
    bar.addEventListener('dragstart', (e) => this._onDragStart(e));
    bar.addEventListener('dragover', (e) => this._onDragOver(e));
    bar.addEventListener('dragleave', (e) => this._onDragLeave(e));
    bar.addEventListener('drop', (e) => this._onDrop(e));
    bar.addEventListener('dragend', () => this._onDragEnd());
  }

  get draggingTabId() {
    return this._dragTabId;
  }

  static _tabId(tabEl) {
    return parseInt(tabEl.dataset.tabId);
  }

  _onDragStart(e) {
    const tab = e.target.closest('.tab');
    if (!tab || tab.draggable !== true) { e.preventDefault(); return; }
    this._dragTabId = TabStripDrag._tabId(tab);
    this._droppedHere = false;
    tab.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData(TabStripDrag.MIME, String(this._dragTabId)); } catch (_) {}
  }

  _onDragOver(e) {
    if (this._dragTabId != null) { this._reorderLive(e); return; }
    if (!TabStripDrag._carriesTab(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this._markDropAt(e);
  }

  _reorderLive(e) {
    const over = e.target.closest('.tab');
    if (!over || over.draggable !== true) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dragging = this._strip.tabBar.querySelector('.tab.dragging');
    if (!dragging || dragging === over) return;
    if (TabStripDrag._inLeftHalf(e, over)) over.before(dragging); else over.after(dragging);
  }

  _onDragLeave(e) {
    const bar = this._strip.tabBar;
    if (e.relatedTarget && bar.contains(e.relatedTarget)) return;
    this._clearMarks();
  }

  _onDrop(e) {
    if (this._dragTabId != null) {
      e.preventDefault();
      this._droppedHere = true;
      return;
    }
    if (!TabStripDrag._carriesTab(e)) return;
    e.preventDefault();
    const tabId = parseInt(e.dataTransfer.getData(TabStripDrag.MIME));
    const order = this._orderWithDropAt(e, tabId);
    this._clearMarks();
    if (Number.isInteger(tabId)) this._dropIn(tabId, order);
  }

  _onDragEnd() {
    const tabId = this._dragTabId;
    this._dragTabId = null;
    const dragging = this._strip.tabBar.querySelector('.tab.dragging');
    if (dragging) dragging.classList.remove('dragging');
    if (tabId == null) return null;
    if (this._droppedHere) return this._commit(tabId);
    return this._dragOff(tabId);
  }

  async _dragOff(tabId) {
    const api = this._getApi();
    if (!api || typeof api.dragOut !== 'function') return this._commit(tabId);
    let result = null;
    try { result = await api.dragOut(tabId); } catch (_) { result = null; }
    if (!result || !result.moved) await this._commit(tabId);
    return result;
  }

  _commit(tabId) {
    return TabOrderCommit.commit(this._getApi(), this._strip.domOrder(), tabId);
  }

  async _dropIn(tabId, order) {
    const api = this._getApi();
    if (!api || typeof api.dropIn !== 'function') return;
    const index = await TabOrderCommit.indexFor(api, order, tabId);
    try { await api.dropIn(tabId, index); } catch (_) {}
  }

  _orderWithDropAt(e, tabId) {
    const order = this._strip.domOrder().filter((id) => id !== tabId);
    const target = this._dropTarget(e);
    if (!target) return order.concat(tabId);
    const at = order.indexOf(TabStripDrag._tabId(target.el));
    order.splice(target.after ? at + 1 : at, 0, tabId);
    return order;
  }

  _dropTarget(e) {
    const el = e.target && e.target.closest ? e.target.closest('.tab') : null;
    if (!el || el.draggable !== true) return null;
    return { el, after: !TabStripDrag._inLeftHalf(e, el) };
  }

  _markDropAt(e) {
    const target = this._dropTarget(e);
    this._clearMarks(target && target.el);
    if (!target) return;
    target.el.classList.toggle(TabStripDrag.DROP_BEFORE, !target.after);
    target.el.classList.toggle(TabStripDrag.DROP_AFTER, target.after);
  }

  _clearMarks(except = null) {
    for (const el of this._strip.tabBar.querySelectorAll(`.${TabStripDrag.DROP_BEFORE}, .${TabStripDrag.DROP_AFTER}`)) {
      if (el !== except) el.classList.remove(TabStripDrag.DROP_BEFORE, TabStripDrag.DROP_AFTER);
    }
  }

  static _carriesTab(e) {
    const types = e.dataTransfer && e.dataTransfer.types;
    return !!types && Array.from(types).includes(TabStripDrag.MIME);
  }

  static _inLeftHalf(e, el) {
    const r = el.getBoundingClientRect();
    return e.clientX < r.left + r.width / 2;
  }
}

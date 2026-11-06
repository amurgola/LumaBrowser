import PaletteHtml from './PaletteHtml.js';
import DigView from './DigView.js';

export default class PaletteApp {
  static DEBOUNCE_MS = 50;
  static DOUBLE_SHIFT_MS = 400;
  static MAX_HOLD_MS = 350;

  constructor({ api = window.paletteAPI, doc = document } = {}) {
    this._api = api;
    this._doc = doc;
    this._input = doc.getElementById('input');
    this._list = doc.getElementById('list');
    this._seq = 0;
    this._rows = [];
    this._active = 0;
    this._timer = null;
    this._lastShiftUp = 0;
    this._shiftClean = false;
    this._dig = new DigView({ el: doc.getElementById('dig'), api, onOpen: (item) => this._open(item) });
    this._dig.onBack = () => this._leaveDig();
  }

  start() {
    this._api.onShow((info) => this._onShow(info || {}));
    this._api.onHidden(() => this._doc.body.classList.remove('is-open'));
    this._api.onDigEvent((p) => this._dig.handle(p));
    this._input.addEventListener('input', () => this._queueSearch());
    this._doc.addEventListener('keydown', (e) => this._onKey(e), true);
    this._doc.addEventListener('keyup', (e) => this._onKeyUp(e), true);
    this._doc.getElementById('scrim').addEventListener('mousedown', () => this._api.close());
    this._list.addEventListener('mousemove', (e) => this._hover(e));
    this._list.addEventListener('click', (e) => this._click(e));
  }

  _onShow(info) {
    this._dig.stop();
    this._list.hidden = false;
    this._footer(false);
    this._doc.getElementById('privateBadge').hidden = !info.private;
    this._input.value = '';
    this._doc.body.classList.add('is-open');
    this._input.focus();
    this._search();
  }

  _queueSearch() {
    clearTimeout(this._timer);
    if (this._dig.active) this._leaveDig();
    this._timer = setTimeout(() => this._search(), PaletteApp.DEBOUNCE_MS);
  }

  async _search() {
    const seq = ++this._seq;
    const query = this._input.value.trim();
    let r = null;
    try { r = await this._api.search(query); } catch (_) { r = null; }
    if (seq !== this._seq) return;
    this._render(query, (r && r.groups) || []);
  }

  _render(query, groups) {
    this._rows = [];
    for (const g of groups) for (const item of g.items || []) this._rows.push(item);
    const canDig = !!query;
    if (canDig) this._rows.push({ kind: 'dig' });
    this._list.innerHTML = PaletteHtml.list(groups, { query, canDig });
    this._doc.getElementById('footDig').hidden = !canDig;
    this._setActive(0, false);
  }

  _setActive(index, scroll = true) {
    if (!this._rows.length) return;
    this._active = (index + this._rows.length) % this._rows.length;
    for (const el of this._list.querySelectorAll('.pal-row.is-active')) el.classList.remove('is-active');
    const row = this._list.querySelector(`.pal-row[data-index="${this._active}"]`);
    if (!row) return;
    row.classList.add('is-active');
    this._input.setAttribute('aria-activedescendant', row.id);
    if (scroll && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' });
  }

  _onKey(e) {
    if (e.key !== 'Shift' || e.ctrlKey || e.altKey || e.metaKey) this._shiftClean = false;
    if (e.key === 'Shift' && !e.repeat) this._shiftDownAt = Date.now();
    if (e.key === 'Escape') { e.preventDefault(); this._escape(); return; }
    if (this._dig.active) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); this._setActive(this._active + 1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); this._setActive(this._active - 1); return; }
    if (e.key === 'Enter') { e.preventDefault(); this._choose(this._active); return; }
    if (e.key === 'Tab' && !e.shiftKey && this._input.value.trim()) { e.preventDefault(); this._enterDig(); }
  }

  _onKeyUp(e) {
    if (e.key !== 'Shift') return;
    const now = Date.now();
    if (!this._shiftDownAt || now - this._shiftDownAt > PaletteApp.MAX_HOLD_MS || e.ctrlKey || e.altKey || e.metaKey) {
      this._shiftClean = false;
      this._shiftDownAt = 0;
      return;
    }
    this._shiftDownAt = 0;
    if (this._shiftClean && now - this._lastShiftUp <= PaletteApp.DOUBLE_SHIFT_MS) {
      this._shiftClean = false;
      this._api.close();
      return;
    }
    this._lastShiftUp = now;
    this._shiftClean = true;
  }

  _escape() {
    if (this._dig.active) { this._leaveDig(); return; }
    if (this._input.value) { this._input.value = ''; this._search(); return; }
    this._api.close();
  }

  _choose(index) {
    const item = this._rows[index];
    if (!item) return;
    if (item.kind === 'dig') this._enterDig();
    else this._open(item);
  }

  _open(item) {
    this._dig.stop();
    this._api.open(item);
  }

  _enterDig() {
    const query = this._input.value.trim();
    if (!query) return;
    this._list.hidden = true;
    this._dig.start(query);
    this._footer(true);
  }

  _leaveDig() {
    this._dig.stop();
    this._list.hidden = false;
    this._footer(false);
    this._input.focus();
  }

  _footer(digging) {
    for (const el of this._doc.querySelectorAll('[data-list-hint]')) el.hidden = digging;
    this._doc.getElementById('footDig').hidden = digging || !this._input.value.trim();
    this._doc.getElementById('footEsc').textContent = digging ? 'back' : 'close';
  }

  _hover(e) {
    const row = e.target.closest('.pal-row[data-index]');
    if (row && Number(row.dataset.index) !== this._active) this._setActive(Number(row.dataset.index), false);
  }

  _click(e) {
    const row = e.target.closest('.pal-row[data-index]');
    if (row) this._choose(Number(row.dataset.index));
  }
}

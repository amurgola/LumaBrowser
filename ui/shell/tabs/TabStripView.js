import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import FaviconCache from '../favicons/FaviconCache.js';

export default class TabStripView {
  static CLOSE_BUTTON = '<button class="tab-close" title="Close tab" aria-label="Close tab"><svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true"><path d="M3.5 3.5l7 7m0-7l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg></button>';

  static CDP_BADGE = '<span class="tab-kind-badge" title="CDP-owned automation tab">CDP</span>';

  static ICON_SLOT = '<span class="tab-icon" aria-hidden="true"></span>';

  static FLAGS = '<span class="tab-flags" aria-hidden="true">'
    + '<svg class="tab-flag tab-flag-persist" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'
    + '<svg class="tab-flag tab-flag-audio" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>'
    + '<svg class="tab-flag tab-flag-muted" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
    + '</span>';

  static DENSE_AT = 8;

  static VERY_DENSE_AT = 14;

  constructor({ store, favicons, tabBar }) {
    this._store = store;
    this._favicons = favicons;
    this._tabBar = tabBar;
  }

  get tabBar() {
    return this._tabBar;
  }

  ensureElement(entry, state) {
    if (entry.tabElement) return;
    const el = this._buildElement(entry, state);
    entry.tabElement = el;
    this.refresh(entry);
    this._insert(el, state);
  }

  refresh(entry) {
    const el = entry && entry.tabElement;
    if (!el) return;
    this._syncTitle(el, entry);
    el.classList.toggle('loading', !!entry.loading);
    el.classList.toggle('persisted', !!entry.keepAlive);
    el.classList.toggle('audible', !!entry.audible && !entry.muted);
    el.classList.toggle('muted', !!entry.muted);
    this._syncIcon(el.querySelector('.tab-icon'), entry);
  }

  refreshHost(host) {
    for (const entry of this._store.values()) {
      if (entry.tabElement && !entry.favicon && FaviconCache.host(entry.url) === host) this.refresh(entry);
    }
  }

  updateDensity() {
    const strip = document.getElementById('tabStrip');
    if (!strip) return;
    let visible = 0;
    for (const t of this._store.values()) if (t.tabElement && t.tabElement.parentNode) visible++;
    strip.classList.toggle('dense', visible >= TabStripView.DENSE_AT);
    strip.classList.toggle('very-dense', visible >= TabStripView.VERY_DENSE_AT);
  }

  setActive(id) {
    for (const [tabId, entry] of this._store.entries()) {
      if (entry.tabElement) entry.tabElement.classList.toggle('active', tabId === id);
    }
  }

  domOrder() {
    return [...this._tabBar.querySelectorAll('.tab')].map((t) => parseInt(t.dataset.tabId));
  }

  visibleIds() {
    return this.domOrder().filter((id) => this._store.has(id));
  }

  applyOrder(order) {
    for (const id of order) {
      const entry = this._store.get(id);
      if (entry && entry.tabElement && entry.tabElement.parentNode === this._tabBar) this._tabBar.appendChild(entry.tabElement);
    }
  }

  static tabMarkup(entry, state) {
    const kind = state.kind || 'user';
    const pinned = !!state.pinned;
    const badge = kind === 'cdp' ? TabStripView.CDP_BADGE : '';
    const iconSlot = kind === 'user' ? TabStripView.ICON_SLOT : '';
    const closeBtn = pinned ? '' : TabStripView.CLOSE_BUTTON;
    return `
    ${badge}${iconSlot}
    <span class="tab-title">${HtmlEscaper.escape(state.title || entry.title || 'New Tab')}</span>
    ${TabStripView.FLAGS}
    ${closeBtn}
  `;
  }

  _buildElement(entry, state) {
    const el = document.createElement('div');
    const kind = state.kind || 'user';
    const pinned = !!state.pinned;
    const classes = ['tab'];
    if (kind !== 'user') classes.push(`kind-${kind}`);
    if (pinned) classes.push('pinned');
    if (state.active) classes.push('active');
    el.className = classes.join(' ');
    el.dataset.tabId = state.id;
    el.dataset.kind = kind;
    if (pinned) el.dataset.pinned = 'true';
    el.draggable = !pinned && kind === 'user';
    el.innerHTML = TabStripView.tabMarkup(entry, state);
    return el;
  }

  _insert(el, state) {
    const bar = this._tabBar;
    if (state.pinned) {
      bar.insertBefore(el, bar.firstChild);
    } else if ((state.kind || 'user') === 'dashboard') {
      const pinnedTab = bar.querySelector('.tab[data-pinned="true"]');
      if (pinnedTab) pinnedTab.after(el);
      else bar.insertBefore(el, bar.firstChild);
    } else {
      bar.appendChild(el);
    }
  }

  _syncTitle(el, entry) {
    const title = entry.title || (entry.loading ? 'Loading...' : 'New Tab');
    const titleEl = el.querySelector('.tab-title');
    if (titleEl && titleEl.textContent !== title) titleEl.textContent = title;
    const tip = entry.url && entry.url !== title ? `${title}\n${entry.url}` : title;
    if (el.title !== tip) el.title = tip;
  }

  _syncIcon(icon, entry) {
    if (!icon) return;
    const fav = entry.favicon || this._favicons.urlFor(entry.url);
    const letter = FaviconCache.letter(entry.url, entry.title);
    if (fav) {
      if (icon.dataset.src !== fav) TabStripView._showImage(icon, fav, letter);
    } else if (icon.dataset.src !== '' || icon.textContent !== letter) {
      TabStripView._showLetter(icon, letter);
    }
  }

  static _showImage(icon, fav, letter) {
    icon.dataset.src = fav;
    icon.innerHTML = '';
    const img = document.createElement('img');
    img.src = fav;
    img.alt = '';
    img.addEventListener('error', () => TabStripView._showLetter(icon, letter));
    icon.appendChild(img);
    icon.classList.remove('bd-fallback');
  }

  static _showLetter(icon, letter) {
    icon.dataset.src = '';
    icon.innerHTML = '';
    icon.textContent = letter;
    icon.classList.add('bd-fallback');
  }
}

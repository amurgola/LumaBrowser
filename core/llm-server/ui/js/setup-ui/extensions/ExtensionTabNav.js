import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ExtensionTabNav {
  static FALLBACK_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3.5a2 2 0 0 1 4 0V6h2.5a1.5 1.5 0 0 1 0 3H18v3h2.5a1.5 1.5 0 0 1 0 3H18v2.5a2 2 0 0 1-4 0V15h-3v2.5a2 2 0 0 1-4 0V15H4.5a1.5 1.5 0 0 1 0-3H7V9H4.5a1.5 1.5 0 0 1 0-3H7V3.5a2 2 0 0 1 4 0V6h3z"/></svg>';

  static LOADING_HTML = '<div class="luma-empty luma-empty--plain ext-setup-state"><span class="luma-spinner"></span>Loading…</div>';

  constructor(doc = document) {
    this._doc = doc;
    this._buttons = new Map();
    this._panes = new Map();
  }

  hosts() {
    const nav = this._doc.getElementById('pageNav');
    const root = this._doc.getElementById('setupRoot');
    return nav && root ? { nav, root } : null;
  }

  has(tabId) {
    return this._buttons.has(tabId);
  }

  ids() {
    return [...this._buttons.keys()];
  }

  pane(tabId) {
    return this._panes.get(tabId) || null;
  }

  add(hosts, tab) {
    const view = 'ext:' + tab.id;
    this._ensureGroup(hosts.nav);
    const btn = this._button(view, tab);
    hosts.nav.appendChild(btn);
    this._buttons.set(tab.id, btn);
    const pane = this._pane(view, tab.id);
    hosts.root.appendChild(pane);
    this._panes.set(tab.id, pane);
  }

  remove(nav, tabId) {
    const btn = this._buttons.get(tabId);
    const pane = this._panes.get(tabId);
    const wasActive = !!(btn && btn.classList.contains('active'));
    if (btn) btn.remove();
    if (pane) pane.remove();
    this._buttons.delete(tabId);
    this._panes.delete(tabId);
    this._dropGroupIfEmpty(nav);
    return wasActive;
  }

  static failedHtml(message) {
    return '<div class="luma-callout bad ext-setup-state">Failed to load this tab: '
      + HtmlEscaper.escape(message || 'unknown error') + '</div>';
  }

  _button(view, tab) {
    const btn = this._doc.createElement('button');
    btn.dataset.view = view;
    btn.className = 'pagenav-ext';
    btn.title = tab.description || tab.label || tab.id;
    btn.innerHTML = '<span class="pagenav-ico" aria-hidden="true">' + ExtensionTabNav._icon(tab) + '</span><span class="pagenav-label"></span>';
    btn.querySelector('.pagenav-label').textContent = tab.label || tab.id;
    return btn;
  }

  static _icon(tab) {
    return (typeof tab.icon === 'string' && /^\s*<svg[\s>]/i.test(tab.icon)) ? tab.icon : ExtensionTabNav.FALLBACK_ICON;
  }

  _pane(view, tabId) {
    const pane = this._doc.createElement('div');
    pane.dataset.viewPane = view;
    pane.id = 'extPane-' + tabId;
    pane.className = 'ext-setup-pane';
    pane.hidden = true;
    pane.innerHTML = ExtensionTabNav.LOADING_HTML;
    return pane;
  }

  _ensureGroup(nav) {
    if (nav.querySelector('.pagenav-group')) return;
    const sep = this._doc.createElement('span');
    sep.className = 'pagenav-sep';
    sep.setAttribute('aria-hidden', 'true');
    const label = this._doc.createElement('span');
    label.className = 'pagenav-group';
    label.textContent = 'Extensions';
    nav.appendChild(sep);
    nav.appendChild(label);
  }

  _dropGroupIfEmpty(nav) {
    if (this._buttons.size) return;
    nav.querySelectorAll('.pagenav-sep, .pagenav-group').forEach((n) => n.remove());
  }
}

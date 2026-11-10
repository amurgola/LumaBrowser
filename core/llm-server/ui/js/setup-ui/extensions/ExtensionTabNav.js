import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ExtensionTabNav {
  static FALLBACK_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3.5a2 2 0 0 1 4 0V6h2.5a1.5 1.5 0 0 1 0 3H18v3h2.5a1.5 1.5 0 0 1 0 3H18v2.5a2 2 0 0 1-4 0V15h-3v2.5a2 2 0 0 1-4 0V15H4.5a1.5 1.5 0 0 1 0-3H7V9H4.5a1.5 1.5 0 0 1 0-3H7V3.5a2 2 0 0 1 4 0V6h3z"/></svg>';

  static LOADING_HTML = '<div class="luma-empty luma-empty--plain ext-setup-state"><span class="luma-spinner"></span>Loading…</div>';

  static OFFLINE_HTML = '<div class="luma-callout warn ext-setup-state">Extension tabs load from LumaBrowser\'s local API server, '
    + 'which is not running. Open Settings, then API &amp; MCP: turn the REST API on, or pick another port if its port '
    + '(3000 by default) is already used by another program, then restart LumaBrowser.</div>';

  static GROUP_LABELS = { integrations: 'Integrations', developer: 'Developer' };

  static GROUP_ORDER = ['integrations', 'developer'];

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
    const btn = this._button(view, tab);
    this._place(hosts.nav, btn, ExtensionTabNav.groupOf(tab));
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
    this._dropEmptyGroups(nav);
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
    btn.dataset.group = ExtensionTabNav.groupOf(tab);
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

  static groupOf(tab) {
    const g = tab && tab.group;
    return g === 'engines' || g === 'developer' ? g : 'integrations';
  }

  _place(nav, btn, group) {
    if (group === 'engines') {
      const advanced = nav.querySelector('#navAdvanced');
      nav.insertBefore(btn, advanced && advanced.parentNode === nav ? advanced : null);
      return;
    }
    this._ensureGroup(nav, group);
    nav.insertBefore(btn, this._groupEnd(nav, group));
  }

  _groupEnd(nav, group) {
    const later = ExtensionTabNav.GROUP_ORDER.slice(ExtensionTabNav.GROUP_ORDER.indexOf(group) + 1);
    for (const g of later) {
      const sep = nav.querySelector(`.pagenav-sep[data-group="${g}"]`);
      if (sep) return sep;
    }
    return null;
  }

  _ensureGroup(nav, group) {
    if (nav.querySelector(`.pagenav-group[data-group="${group}"]`)) return;
    const sep = this._doc.createElement('span');
    sep.className = 'pagenav-sep';
    sep.dataset.group = group;
    sep.setAttribute('aria-hidden', 'true');
    const label = this._doc.createElement('span');
    label.className = 'pagenav-group';
    label.dataset.group = group;
    label.textContent = ExtensionTabNav.GROUP_LABELS[group];
    const before = this._groupEnd(nav, group);
    nav.insertBefore(sep, before);
    nav.insertBefore(label, before);
  }

  _dropEmptyGroups(nav) {
    for (const group of ExtensionTabNav.GROUP_ORDER) {
      if (nav.querySelector(`button.pagenav-ext[data-group="${group}"]`)) continue;
      nav.querySelectorAll(`.pagenav-sep[data-group="${group}"], .pagenav-group[data-group="${group}"]`).forEach((n) => n.remove());
    }
  }
}

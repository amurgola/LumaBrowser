import ChatIcons from '../ChatIcons.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class Sidebar {
  constructor(ctx) {
    this._ctx = ctx;
    this._searchKeyBound = false;
  }

  build() {
    const { els } = this._ctx;
    this._ctx.convList.registerTemplates();
    els.sidebar.innerHTML = this._markup();
    els.sideModes = els.sidebar.querySelector('.cm-side-modes');
    this._ctx.sideModes.render();
    this._wireSearchBox();
    els.recents = els.sidebar.querySelector('.cm-recents');
    els.chatsList = els.sidebar.querySelector('.cm-chats-list');
    els.artsList = els.sidebar.querySelector('.cm-arts-list');
    els.artsList.addEventListener('click', (e) => this._ctx.artsSidebar.onClick(e));
    this._wireActions();
    this._ctx.convList.registerList();
    this._bindSearchKey();
  }

  applyExpanded() {
    const { els, state } = this._ctx;
    els.sidebar.classList.toggle('expanded', state.sidebarExpanded);
    const col = els.sidebar.querySelector('[data-act="collapse"]');
    if (col) col.title = state.sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar';
  }

  toggle() {
    const { state, api } = this._ctx;
    state.sidebarExpanded = !state.sidebarExpanded;
    this.applyExpanded();
    try { api.setSidebarCollapsed(!state.sidebarExpanded); } catch (_) {}
  }

  expand() {
    const { state, api } = this._ctx;
    if (state.sidebarExpanded) return;
    state.sidebarExpanded = true;
    this.applyExpanded();
    try { api.setSidebarCollapsed(false); } catch (_) {}
  }

  toggleSearch() {
    const { els, state } = this._ctx;
    this.expand();
    state.searchOn = !state.searchOn;
    els.searchBox.classList.toggle('on', state.searchOn);
    const btn = els.sidebar.querySelector('[data-act="search"]');
    if (btn) btn.classList.toggle('active', state.searchOn);
    const input = els.searchBox.querySelector('input');
    if (state.searchOn) {
      if (state.sideMode === 'artifacts' || state.sideMode === 'all-artifacts') this._ctx.artsSidebar.returnToChats();
      input.focus();
      return;
    }
    input.value = '';
    this._ctx.convList.render(state.conversations);
  }

  applySettingsMenu(open) {
    const { els, state } = this._ctx;
    state.settingsMenuOpen = !!open;
    if (!els.sidebar) return;
    const row = els.sidebar.querySelector('.cm-settings-row');
    if (!row) return;
    row.classList.toggle('open', state.settingsMenuOpen);
    const tray = els.sidebar.querySelector('.cm-settings-tray');
    if (tray) tray.classList.toggle('open', state.settingsMenuOpen);
    const chev = row.querySelector('.cm-new-chev');
    if (chev) {
      chev.classList.toggle('open', state.settingsMenuOpen);
      chev.setAttribute('aria-expanded', state.settingsMenuOpen ? 'true' : 'false');
    }
  }

  static iconButton(icon, act, label, cls) {
    return '<button type="button" class="cm-icon-btn' + (cls ? ' ' + cls : '') + '" data-act="'
      + act + '" title="' + label + '">' + icon + '<span class="cm-label">' + HtmlEscaper.escape(label) + '</span></button>';
  }

  _markup() {
    const ib = Sidebar.iconButton;
    return '<div class="cm-side-head">'
      +   ib(ChatIcons.search, 'search', 'Search chats (Ctrl+K)')
      +   ib(ChatIcons.panel, 'collapse', 'Collapse sidebar')
      + '</div>'
      + '<div class="cm-side-top">'
      +   '<div class="cm-new-row">'
      +     ib(ChatIcons.plus, 'new', 'New chat (Ctrl+Shift+N)', 'cm-accent')
      +     '<button type="button" class="cm-new-chev" data-act="newModes" title="Start in a mode" aria-expanded="false">' + ChatIcons.chevron + '</button>'
      +   '</div>'
      + '</div>'
      + '<div class="cm-side-modes"></div>'
      + '<div class="cm-search-box"><input type="text" placeholder="Search chats..." res-oninput="res.cmSearch" /></div>'
      + '<div class="cm-recents">'
      +   '<div class="cm-chats-list">'
      +     '<div res="cm.visible" res-use="cmConvRow" res-empty="cmEmptyChats"></div>'
      +   '</div>'
      +   '<div class="cm-arts-list" style="display:none"></div>'
      + '</div>'
      + '<div class="cm-side-foot">' + this._footMarkup() + '</div>';
  }

  _footMarkup() {
    const ib = Sidebar.iconButton;
    const api = this._ctx.api;
    const settings = api && api.openAppSettings
      ? '<div class="cm-new-row cm-settings-row">'
        +   ib(ChatIcons.gear, 'settingsMenu', 'Settings')
        +   '<button type="button" class="cm-new-chev" data-act="settingsMenu" title="Settings" aria-expanded="false">' + ChatIcons.chevron + '</button>'
        + '</div>'
        + '<div class="cm-side-new-modes cm-settings-tray"><div class="cm-side-new-inner">'
        +   ib(ChatIcons.sliders, 'setup', 'Advanced / Setup', 'cm-side-mode-sub')
        +   ib(ChatIcons.gear, 'appSettings', 'General', 'cm-side-mode-sub')
        + '</div></div>'
      : ib(ChatIcons.sliders, 'setup', 'Advanced / Setup');
    return settings
      + ib(ChatIcons.doc, 'allArts', 'All artifacts')
      + (api && api.openDashboard ? ib(ChatIcons.grid, 'dashboard', 'Dashboard') : '')
      + '<div class="cm-brand"><span class="cm-star">' + ChatIcons.logo + '</span></div>';
  }

  _wireSearchBox() {
    const { els, resonant, state } = this._ctx;
    els.searchBox = els.sidebar.querySelector('.cm-search-box');
    resonant.handler('cmSearch', (item, e) => this._ctx.convList.search(e.target.value));
    resonant.bindEvents(els.searchBox);
    els.searchBox.querySelector('input').addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.searchOn) { e.stopPropagation(); this.toggleSearch(); }
    });
  }

  _wireActions() {
    const acts = this._actions();
    this._ctx.els.sidebar.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', (e) => acts[b.dataset.act](e));
    });
  }

  _actions() {
    const ctx = this._ctx;
    return {
      new: () => ctx.conversation.newChat(),
      search: () => this.toggleSearch(),
      collapse: () => this.toggle(),
      newModes: () => { ctx.state.newModesOpen = !ctx.state.newModesOpen; ctx.sideModes.applyActive(); },
      settingsMenu: () => this._toggleSettingsMenu(),
      setup: () => { this.applySettingsMenu(false); ctx.switchToSetup(); },
      appSettings: () => { this.applySettingsMenu(false); if (ctx.api.openAppSettings) ctx.api.openAppSettings('general'); },
      allArts: () => ctx.artsSidebar.toggleAll(),
      dashboard: () => { if (ctx.api.openDashboard) ctx.api.openDashboard(); },
    };
  }

  _toggleSettingsMenu() {
    const { state } = this._ctx;
    if (!state.sidebarExpanded) { this.toggle(); this.applySettingsMenu(true); return; }
    this.applySettingsMenu(!state.settingsMenuOpen);
  }

  _bindSearchKey() {
    if (this._searchKeyBound) return;
    this._searchKeyBound = true;
    document.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || (e.key !== 'k' && e.key !== 'K')) return;
      const { els, state } = this._ctx;
      if (!els.sidebar || els.sidebar.offsetParent === null) return;
      e.preventDefault();
      if (!state.searchOn) this.toggleSearch();
      else els.searchBox.querySelector('input').focus();
    });
  }
}

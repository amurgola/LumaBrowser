export default class SettingsMenu {
  static WIDTH = 260;

  constructor({ popupMenu, host, store, tabActions, downloads, findBar, historyModal, bookmarkManager, settings, cleaner }) {
    this._menu = popupMenu;
    this._host = host;
    this._store = store;
    this._tabs = tabActions;
    this._downloads = downloads;
    this._findBar = findBar;
    this._history = historyModal;
    this._bookmarks = bookmarkManager;
    this._settings = settings;
    this._cleaner = cleaner;
    this.btn = document.getElementById('settingsBtn');
    this.open = false;
    host.onHide(() => this._onHidden());
    host.addDismissExemption((e) => this.open && this.btn && this.btn.contains(e.target));
  }

  install() {
    this.btn.addEventListener('click', () => {
      if (this.open) this._host.hide();
      else this.show();
    });
  }

  show() {
    this._host.hide();
    const r = this.btn.getBoundingClientRect();
    const width = SettingsMenu.WIDTH;
    this._menu.open('settings-menu', this.items(), this._actions(), { x: r.right - width, y: r.bottom + 6, width });
    this.open = true;
    this.btn.setAttribute('aria-expanded', 'true');
  }

  items() {
    const tab = this._store.active();
    const pct = tab ? Math.round((tab.zoomLevel || 1) * 100) : 100;
    const webTab = !!tab && (tab.kind || 'user') === 'user';
    const canPrint = webTab && !!(window.tabAPI && typeof window.tabAPI.print === 'function');
    return [
      { action: 'new-tab', label: 'New tab', hint: 'Ctrl+T' },
      { sep: true },
      { action: 'history', label: 'History', hint: 'Ctrl+H' },
      { action: 'bookmarks', label: 'Bookmarks', hint: 'Ctrl+Shift+O' },
      { action: 'downloads', label: 'Downloads', hint: 'Ctrl+J', disabled: this._downloads.size === 0 },
      { sep: true },
      { action: 'find', label: 'Find in page', hint: 'Ctrl+F', disabled: !webTab },
      { action: 'print', label: 'Print', hint: 'Ctrl+P', disabled: !canPrint },
      { action: 'zoom-reset', label: `Zoom ${pct}%`, hint: 'Ctrl+0 resets' },
      { sep: true },
      { action: 'clear-history', label: 'Clear browsing history' },
      { action: 'clear-cache', label: 'Clear cache' },
      { sep: true },
      { action: 'settings', label: 'Settings' },
      { action: 'extensions', label: 'Extensions' },
      { action: 'about', label: 'About LumaBrowser' },
      { sep: true },
      { action: 'exit', label: 'Exit', danger: true },
    ];
  }

  _actions() {
    const activeId = () => this._store.activeTabId;
    return {
      'new-tab': () => this._tabs.create(undefined, { focusUrl: true }),
      history: () => this._history.open(),
      bookmarks: () => this._bookmarks.open(),
      downloads: () => this._downloads.toggleMenu(),
      find: () => this._findBar.open(),
      print: () => { if (activeId() != null && window.tabAPI && typeof window.tabAPI.print === 'function') window.tabAPI.print(activeId()); },
      'zoom-reset': () => this._tabs.zoom(activeId(), 0, true),
      settings: () => this._settings.open('general'),
      extensions: () => this._settings.open('extensions'),
      about: () => this._settings.open('about'),
      'clear-history': () => this._cleaner.clearHistory(),
      'clear-cache': () => this._cleaner.clearCache(),
      exit: () => { if (window.windowAPI && window.windowAPI.close) window.windowAPI.close(); else window.close(); },
    };
  }

  _onHidden() {
    if (this.open && this.btn) this.btn.setAttribute('aria-expanded', 'false');
    this.open = false;
  }
}

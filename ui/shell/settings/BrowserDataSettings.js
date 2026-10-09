import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import SearchEngineChoice from '../omnibox/SearchEngineChoice.js';

export default class BrowserDataSettings {
  static ENGINE_KEY = 'bd.searchEngine';

  static LEGACY_BAR_KEY = 'bd.showBookmarksBar';

  constructor({ tabActions, engine, addressBar, bookmarksBar, feedback }) {
    this._tabActions = tabActions;
    this._engine = engine;
    this._addressBar = addressBar;
    this._bookmarksBar = bookmarksBar;
    this._feedback = feedback;
  }

  async load() {
    await this._loadStartPage();
    await this._loadSearchEngine();
    await this._loadOnDemand();
    await this._loadBookmarksBar();
    await this._loadDarkMode();
  }

  async _loadStartPage() {
    const input = document.getElementById('gsStartPage');
    const api = window.browserSettingsAPI;
    if (!input || !api) return;
    try {
      input.value = await api.getStartPage();
      if (input.value) this._tabActions.startPageUrl = input.value;
    } catch (_) {}
    const save = () => {
      api.setStartPage(input.value.trim()).then((saved) => {
        input.value = saved;
        if (saved) this._tabActions.startPageUrl = saved;
      }).catch(() => {});
    };
    input.addEventListener('change', save);
    input.addEventListener('blur', save);
  }

  async _loadSearchEngine() {
    const api = window.browserSettingsAPI;
    let stored = null;
    if (api && typeof api.getSearchEngine === 'function') {
      try { stored = await api.getSearchEngine(); } catch (_) { stored = null; }
    }
    if (!stored) stored = localStorage.getItem(BrowserDataSettings.ENGINE_KEY);
    this._engine.select(stored);
    const select = document.getElementById('gsSearchEngine');
    if (select) this._wireEngineSelect(select, api);
    this._addressBar.setPlaceholder(this._engine.placeholder());
  }

  _wireEngineSelect(select, api) {
    select.innerHTML = Object.entries(SearchEngineChoice.ENGINES)
      .map(([id, e]) => `<option value="${id}">${HtmlEscaper.escape(e.name)}</option>`).join('');
    select.value = this._engine.id;
    select.addEventListener('change', () => {
      const v = SearchEngineChoice.isKnown(select.value) ? select.value : SearchEngineChoice.DEFAULT;
      this._engine.select(v);
      localStorage.setItem(BrowserDataSettings.ENGINE_KEY, v);
      if (api && typeof api.setSearchEngine === 'function') api.setSearchEngine(v).catch(() => {});
      this._addressBar.setPlaceholder(this._engine.placeholder());
    });
  }

  async _loadOnDemand() {
    const toggle = document.getElementById('gsOnDemand');
    if (!toggle) return;
    try { toggle.checked = (await window.ipcBridge.invoke('on-demand:get-enabled')) !== false; }
    catch (_) { toggle.checked = true; }
    toggle.addEventListener('change', async () => {
      try {
        await window.ipcBridge.invoke('on-demand:set-enabled', toggle.checked);
        this._feedback.markSaved(toggle, true);
      } catch (e) {
        this._feedback.markSaved(toggle, false, e.message);
      }
    });
  }

  async _loadBookmarksBar() {
    const toggle = document.getElementById('gsShowBookmarksBar');
    if (!toggle) return;
    const show = await BrowserDataSettings.bookmarksBarPreference();
    toggle.checked = show;
    this._bookmarksBar.applyVisibility(show);
    toggle.addEventListener('change', async () => {
      this._bookmarksBar.applyVisibility(toggle.checked);
      try {
        await window.ipcBridge.invoke('core.settings.setShowBookmarksBar', toggle.checked);
        this._feedback.markSaved(toggle, true);
      } catch (e) {
        this._feedback.markSaved(toggle, false, e.message);
      }
    });
  }

  static async bookmarksBarPreference() {
    try {
      const stored = await window.ipcBridge.invoke('core.settings.getShowBookmarksBar');
      if (stored != null) return !!stored;
      const legacy = localStorage.getItem(BrowserDataSettings.LEGACY_BAR_KEY);
      if (legacy == null) return true;
      const show = legacy === 'true';
      await window.ipcBridge.invoke('core.settings.setShowBookmarksBar', show);
      localStorage.removeItem(BrowserDataSettings.LEGACY_BAR_KEY);
      return show;
    } catch (_) {
      const legacy = localStorage.getItem(BrowserDataSettings.LEGACY_BAR_KEY);
      return legacy == null ? true : legacy === 'true';
    }
  }

  async _loadDarkMode() {
    const toggle = document.getElementById('gsDarkMode');
    const api = window.browserSettingsAPI;
    if (!toggle || !api || !api.getDarkMode) return;
    try { toggle.checked = await api.getDarkMode(); } catch (_) {}
    toggle.addEventListener('change', () => {
      api.setDarkMode(toggle.checked)
        .then((saved) => { toggle.checked = saved; this._feedback.markSaved(toggle, true); })
        .catch((e) => this._feedback.markSaved(toggle, false, e.message));
    });
  }
}

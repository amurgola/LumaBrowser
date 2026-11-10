const DoubleShift = require('./DoubleShift');
const PaletteView = require('./PaletteView');
const PaletteSearch = require('./PaletteSearch');
const PaletteOpener = require('./PaletteOpener');
const RecentPlaces = require('./RecentPlaces');
const ConversationIndex = require('./ConversationIndex');
const DigDeeper = require('./DigDeeper');
const SettingsProvider = require('./providers/SettingsProvider');
const ConversationProvider = require('./providers/ConversationProvider');
const ArtifactProvider = require('./providers/ArtifactProvider');
const TabProvider = require('./providers/TabProvider');
const ActionProvider = require('./providers/ActionProvider');
const ShellSettingsCatalog = require('./catalog/ShellSettingsCatalog');
const LlmSettingsCatalog = require('./catalog/LlmSettingsCatalog');
const SettingValueReader = require('./SettingValueReader');

class PaletteService {
  static DOUBLE_SHIFT_KEY = 'core.palette.doubleShift';
  static WARM_INDEX_MS = 20000;

  constructor(deps) {
    this._d = deps;
    this._views = new Map();
    this.recent = new RecentPlaces(deps.settingsDb);
    this.index = new ConversationIndex(deps.settingsDb);
    const values = new SettingValueReader({ settingsDb: deps.settingsDb });
    const settings = new SettingsProvider({
      catalogs: [ShellSettingsCatalog, LlmSettingsCatalog],
      listExtensions: deps.listExtensions || (() => []),
      valueOf: (entry) => values.valueOf(entry),
    });
    const conversations = new ConversationProvider({ getChatStore: deps.getChatStore, index: this.index });
    const actions = new ActionProvider();
    this.providers = {
      settings,
      actions,
      conversations,
      artifacts: new ArtifactProvider({ getArtifactStore: deps.getArtifactStore }),
      tabs: new TabProvider({ getTabs: (windowId) => { const tvm = deps.getTabViewManager(); return tvm ? tvm.getWindowTabs(windowId) : []; } }),
    };
    this.search = new PaletteSearch({ providers: this.providers, recent: this.recent, getChatStore: deps.getChatStore, getArtifactStore: deps.getArtifactStore });
    this.opener = new PaletteOpener({
      settings, actions, recent: this.recent, getLlm: deps.getLlm, getTabViewManager: deps.getTabViewManager, getArtifactStore: deps.getArtifactStore,
    });
    this.digDeeper = new DigDeeper({ settings, conversations, docs: deps.docs || null, getRouter: deps.getRouter || (() => null) });
    DoubleShift.enabled = this.isDoubleShiftEnabled();
  }

  start() {
    this._warmTimer = setTimeout(() => { try { this.index.ensure(); } catch (_) {} }, PaletteService.WARM_INDEX_MS);
    if (this._warmTimer.unref) this._warmTimer.unref();
  }

  isDoubleShiftEnabled() {
    return this._d.settingsDb.get(PaletteService.DOUBLE_SHIFT_KEY, true) !== false;
  }

  setDoubleShiftEnabled(enabled) {
    this._d.settingsDb.set(PaletteService.DOUBLE_SHIFT_KEY, !!enabled);
    DoubleShift.enabled = !!enabled;
    return { success: true, enabled: !!enabled };
  }

  toggle(win) {
    const view = this._viewFor(win);
    if (view) view.toggle();
    return { success: !!view };
  }

  close(win, opts) {
    const view = win ? this._views.get(win.id) : null;
    if (view) view.hide(opts);
    if (view && view.view) this.digDeeper.abort(view.view.webContents);
  }

  windowForSender(sender) {
    for (const view of this._views.values()) {
      if (view.isSender(sender)) return view.win;
    }
    return null;
  }

  viewForSender(sender) {
    for (const view of this._views.values()) {
      if (view.isSender(sender)) return view;
    }
    return null;
  }

  windowIdOf(win) {
    const tvm = this._d.getTabViewManager();
    return tvm && win ? tvm.windowIdForSender(win.webContents) : null;
  }

  query(win, text) {
    return this.search.search(text, { windowId: this.windowIdOf(win) });
  }

  async open(win, item) {
    this.close(win, { restoreFocus: false });
    try {
      return await this.opener.open(item, win);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  continueInChat(query) {
    const llm = this._d.getLlm();
    if (!llm) return { success: false, error: 'The chat is turned off.' };
    llm.setChatIntent({ compose: { prompt: String(query || '').slice(0, 2000), attachments: [], autoSend: false, docs: true } });
    return llm.openChat() ? { success: true } : { success: false, error: 'The chat is turned off.' };
  }

  record(place) {
    return this.recent.record(place);
  }

  _viewFor(win) {
    if (!win || win.isDestroyed()) return null;
    const winId = win.id;
    let view = this._views.get(winId);
    if (!view) {
      const tvm = () => this._d.getTabViewManager();
      view = new PaletteView(win, {
        electron: this._d.electron,
        info: () => { const t = tvm(); const id = this.windowIdOf(win); return { private: !!(t && id != null && t.isPrivateWindow(id)) }; },
      });
      this._views.set(winId, view);
      win.once('closed', () => { view.destroy(); this._views.delete(winId); });
    }
    return view;
  }

  raiseAll() {
    for (const view of this._views.values()) view.raiseIfVisible();
  }
}

module.exports = PaletteService;

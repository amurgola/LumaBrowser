class PaletteOpener {
  constructor({ settings, actions, recent, getLlm = () => null, getTabViewManager = () => null, getArtifactStore = () => null }) {
    this._settings = settings;
    this._actions = actions;
    this._recent = recent;
    this._getLlm = getLlm;
    this._getTvm = getTabViewManager;
    this._getArtifactStore = getArtifactStore;
  }

  async open(item, win) {
    if (!item || typeof item !== 'object' || !item.kind) return { success: false, error: 'Nothing to open.' };
    switch (item.kind) {
      case 'setting': return this._setting(String(item.id || ''), win);
      case 'settings': return this._settingsTab(String(item.id || ''), item.title, win);
      case 'setup': return this._setup(String(item.id || ''), item.title);
      case 'conversation': return this._conversation(item);
      case 'artifact': return this._artifact(item);
      case 'tab': return this._tab(item, win);
      case 'action': return this._action(String(item.id || ''), win);
      default: return { success: false, error: `Unknown result kind "${item.kind}".` };
    }
  }

  _setting(id, win) {
    const entry = this._settings.byId(id);
    if (!entry || !entry.target) return { success: false, error: 'That setting is no longer available.' };
    const t = entry.target;
    if (t.surface === 'shell' || t.surface === 'extension') PaletteOpener._toShell(win, { action: 'palette-reveal', target: t });
    else if (t.surface === 'setup' || t.surface === 'tune') this._llm().revealSetting(t);
    else return { success: false, error: 'That setting has no place to open.' };
    this._recent.record({ kind: 'setting', ref: id, title: entry.label });
    return { success: true };
  }

  _settingsTab(tab, title, win) {
    PaletteOpener._toShell(win, { action: 'palette-reveal', target: { surface: 'shell', tab } });
    this._recent.record({ kind: 'settings', ref: tab, title: title || tab });
    return { success: true };
  }

  _setup(page, title) {
    this._llm().openSetup({ page });
    this._recent.record({ kind: 'setup', ref: page, title: title || page });
    return { success: true };
  }

  _conversation(item) {
    const ok = this._llm().openConversation(String(item.id));
    if (ok) this._recent.record({ kind: 'conversation', ref: String(item.id), title: item.title });
    return ok ? { success: true } : { success: false, error: 'The chat is turned off.' };
  }

  _artifact(item) {
    const data = item.data || {};
    const artifactId = String(data.artifactId || item.id);
    if (data.conversationId) {
      if (!this._llm().openArtifact({ conversationId: String(data.conversationId), artifactId })) {
        return { success: false, error: 'The chat is turned off.' };
      }
    } else if (!this._openArtifactInTab(artifactId)) {
      return { success: false, error: 'That artifact is no longer available.' };
    }
    this._recent.record({ kind: 'artifact', ref: String(item.id), title: item.title, subtitle: data.conversationTitle || '' });
    return { success: true };
  }

  _openArtifactInTab(artifactId) {
    const store = this._getArtifactStore();
    const tvm = this._getTvm();
    if (!store || !tvm || !store.ensureFile(artifactId)) return false;
    tvm.createTab(store.urlFor(artifactId));
    return true;
  }

  _tab(item, win) {
    const tvm = this._getTvm();
    const tabId = Number(item.data && item.data.tabId != null ? item.data.tabId : item.id);
    if (!tvm || !Number.isFinite(tabId) || !tvm.getEntry(tabId)) return { success: false, error: 'That tab is closed.' };
    tvm.switchToTab(tabId);
    const owner = tvm.windowOfTab ? tvm.windowOfTab(tabId) : null;
    if (owner && owner !== win && !owner.isDestroyed()) owner.focus();
    return { success: true };
  }

  _action(id, win) {
    const action = this._actions.byId(id);
    if (!action) return { success: false, error: 'Unknown command.' };
    if (action.run.shell) {
      PaletteOpener._toShell(win, { action: 'palette-run', run: action.run.shell });
      return { success: true };
    }
    if (action.run.main === 'open-chat') {
      return this._llm().openChat() ? { success: true } : { success: false, error: 'The chat is turned off.' };
    }
    if (action.run.main === 'open-settings') return this._settingsTab('general', 'General', win);
    return { success: false, error: 'Unknown command.' };
  }

  _llm() {
    const llm = this._getLlm();
    if (!llm) throw new Error('The chat service is not ready yet.');
    return llm;
  }

  static _toShell(win, payload) {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('tab-view:accelerator', payload);
  }
}

module.exports = PaletteOpener;

const KeyedSettings = require('./KeyedSettings');

class LlmUiState extends KeyedSettings {
  static KEYS = {
    mode: 'core.llmServer.ui.mode',
    pendingSetupExpand: 'core.llmServer.ui.pendingSetupExpand',
    sidebarCollapsed: 'core.llmServer.ui.sidebarCollapsed',
    lastModelRef: 'core.llmServer.chat.lastModelRef',
  };

  static MODES = Object.freeze(['setup', 'chat']);

  constructor(settingsDb, { isConfigured }) {
    super(settingsDb);
    this._isConfigured = isConfigured;
    this._chatIntent = null;
  }

  getMode() {
    const stored = this._db.get(LlmUiState.KEYS.mode, null);
    if (LlmUiState.MODES.includes(stored)) return stored;
    return this._isConfigured() ? 'chat' : 'setup';
  }

  setMode(mode) {
    this._setOrDelete(LlmUiState.KEYS.mode, LlmUiState.MODES.includes(mode) ? mode : null);
    return this.getMode();
  }

  getSidebarCollapsed() {
    return !!this._db.get(LlmUiState.KEYS.sidebarCollapsed, false);
  }

  setSidebarCollapsed(collapsed) {
    this._setOrDelete(LlmUiState.KEYS.sidebarCollapsed, collapsed ? true : null);
    return this.getSidebarCollapsed();
  }

  getLastModelRef() {
    return this._db.get(LlmUiState.KEYS.lastModelRef, null) || null;
  }

  setLastModelRef(ref) {
    this._setOrDelete(LlmUiState.KEYS.lastModelRef, ref ? String(ref) : null);
    return this.getLastModelRef();
  }

  setPendingSetupExpand(expand) {
    this._setOrDelete(LlmUiState.KEYS.pendingSetupExpand, expand || null);
  }

  consumePendingSetupExpand() {
    const value = this._db.get(LlmUiState.KEYS.pendingSetupExpand, null);
    if (value != null) this._db.delete(LlmUiState.KEYS.pendingSetupExpand);
    return value || null;
  }

  setChatIntent(intent) {
    this._chatIntent = intent || null;
  }

  takeChatIntent() {
    const intent = this._chatIntent;
    this._chatIntent = null;
    return intent;
  }
}

module.exports = LlmUiState;

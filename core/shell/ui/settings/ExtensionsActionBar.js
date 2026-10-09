import ActionPromptModal from './ActionPromptModal.js';
import ShellHooks from './ShellHooks.js';

export default class ExtensionsActionBar {
  static DEFAULTS_CHANNEL = 'core.llmServer.getDefaults';

  static INTENT_CHANNEL = 'core.llmServer.startModeIntent';

  static CORE_BUTTONS = `
      <button class="btn btn-primary" id="ext-browse-addons-btn">Browse Add-ons</button>
      <button class="btn btn-secondary" id="ext-new-btn">New Extension</button>
      <button class="btn btn-secondary" id="ext-install-btn">Install from .zip</button>
    `;

  constructor({ meta, hooks, onBrowseAddons, onNewExtension, onInstallZip }) {
    this._meta = meta;
    this._hooks = hooks;
    this._onBrowseAddons = onBrowseAddons;
    this._onNewExtension = onNewExtension;
    this._onInstallZip = onInstallZip;
  }

  static clear() {
    const footer = document.getElementById('settingsFooter');
    if (footer) footer.innerHTML = '';
  }

  async render() {
    const footer = document.getElementById('settingsFooter');
    if (!footer) return;
    const llmReady = await ExtensionsActionBar._isLlmConfigured();
    const section = document.getElementById('extensionsSettings');
    if (!section || !section.classList.contains('active')) return;
    footer.innerHTML = ExtensionsActionBar.CORE_BUTTONS;
    footer.querySelector('#ext-browse-addons-btn').addEventListener('click', () => this._onBrowseAddons());
    footer.querySelector('#ext-new-btn').addEventListener('click', () => this._onNewExtension());
    footer.querySelector('#ext-install-btn').addEventListener('click', () => this._onInstallZip());
    this._prependContributed(footer, llmReady);
  }

  _prependContributed(footer, llmReady) {
    const firstCore = footer.firstElementChild;
    for (const ext of this._meta.enabledInLoadOrder()) {
      for (const action of ExtensionsActionBar._actionsOf(ext)) {
        if (!action || !ExtensionsActionBar._gatePasses(action.gate, llmReady)) continue;
        const btn = document.createElement('button');
        btn.className = `btn btn-${action.variant === 'secondary' ? 'secondary' : 'primary'}`;
        btn.textContent = action.label;
        btn.addEventListener('click', () => this.run(action));
        footer.insertBefore(btn, firstCore);
      }
    }
  }

  static _actionsOf(ext) {
    if (Array.isArray(ext.extensionsActions) && ext.extensionsActions.length) return ext.extensionsActions;
    return ext.extensionsAction ? [ext.extensionsAction] : [];
  }

  static _gatePasses(gate, llmReady) {
    return gate === 'llm' ? llmReady : (gate == null || gate === true || gate === 'always');
  }

  static async _isLlmConfigured() {
    try {
      const d = await window.ipcBridge.invoke(ExtensionsActionBar.DEFAULTS_CHANNEL);
      return !!(d && d.runtimeId && d.modelPath);
    } catch (_) { return false; }
  }

  async run(action) {
    let data = {};
    if (action.prompt) {
      data = await ActionPromptModal.open(action.prompt);
      if (data === null) return;
    }
    try {
      const r = await window.ipcBridge.invoke(ExtensionsActionBar.INTENT_CHANNEL, { mode: action.modeIntent, data });
      if (r && r.success) ShellHooks.hideSettingsModal();
      else this._hooks.toast((r && r.error) || `Could not start "${action.label}". Make sure the AI chat is enabled and a model is set up.`, 'bad');
    } catch (e) {
      this._hooks.toast(`"${action.label}" failed to launch: ${e.message}`, 'bad');
    }
  }
}

import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import SettingsPage from './SettingsPage.js';

export default class SiteApisRenderer {
  static EXTENSION_ID = 'site-apis';
  static MENU_ACTION = 'ext-sapi-create';
  static MENU_LABEL = 'Create Site API from this tab';
  static RELOAD_COALESCE_MS = 150;

  constructor() {
    this._active = false;
    this._resetState();
  }

  async activate(context) {
    if (this._active) this.deactivate();
    this._active = true;
    this._ipc = context.ipcBridge;
    const root = context.containers ? context.containers.settingsContainer : null;
    this._page = new SettingsPage(root, {
      invoke: (channel, ...args) => this._invoke(channel, ...args),
      reload: () => this.load(),
      openBuilder: (input) => this.openBuilder(input),
    });
    this._registerSettingsCallback(context.slotManager);
    this._listenForChanges();
    this._contributeTabMenu();
    await this.load();
  }

  deactivate() {
    if (this._reloadTimer) clearTimeout(this._reloadTimer);
    for (const off of this._unsubs) { try { off(); } catch (_) {} }
    if (this._unregisterMenu) { try { this._unregisterMenu(); } catch (_) {} }
    this._resetState();
    this._active = false;
  }

  async load() {
    if (!this._active) return;
    try {
      const sites = await this._invoke('listSites');
      if (this._page) this._page.render(sites || []);
    } catch (err) {
      console.error('site-apis: failed to load sites:', err);
    }
  }

  async openBuilder(input) {
    let result;
    try {
      result = await this._invoke('openBuilder', input);
    } catch (err) {
      result = { success: false, error: err && err.message ? err.message : String(err) };
    }
    if (!result || !result.success) {
      await Dialogs.alert(`Could not open the Site API builder: ${(result && result.error) || 'unknown error'}`);
      return result;
    }
    if (result.opened) SiteApisRenderer._closeSettings();
    else await Dialogs.alert('The builder conversation is ready in the AI chat tab; open the chat to continue.');
    return result;
  }

  _resetState() {
    this._ipc = null;
    this._page = null;
    this._reloadTimer = null;
    this._unsubs = [];
    this._unregisterMenu = null;
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${SiteApisRenderer.EXTENSION_ID}.${channel}`, ...args);
  }

  _registerSettingsCallback(slotManager) {
    if (!slotManager || typeof slotManager.setCallback !== 'function') return;
    slotManager.setCallback('settings-tab', SiteApisRenderer.EXTENSION_ID, 'onActivate', () => this.load());
  }

  _listenForChanges() {
    if (!this._ipc || typeof this._ipc.on !== 'function') return;
    this._unsubs.push(this._ipc.on(`ext.${SiteApisRenderer.EXTENSION_ID}.changed`, () => this._onChanged()));
  }

  _onChanged() {
    if (this._reloadTimer) clearTimeout(this._reloadTimer);
    this._reloadTimer = setTimeout(() => {
      this._reloadTimer = null;
      this.load();
    }, SiteApisRenderer.RELOAD_COALESCE_MS);
  }

  _contributeTabMenu() {
    if (typeof window.registerTabMenuContributor !== 'function') return;
    this._unregisterMenu = window.registerTabMenuContributor((ctx) => this.contributeMenu(ctx));
  }

  contributeMenu({ tab, tabId, add }) {
    if (!tab || !tab.keepAlive) return;
    add(SiteApisRenderer.MENU_ACTION, SiteApisRenderer.MENU_LABEL, () => this.openBuilder({ tabId }));
  }

  static _closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
  }
}

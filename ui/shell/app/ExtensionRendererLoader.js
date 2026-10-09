import BootLog from '../boot/BootLog.js';

export default class ExtensionRendererLoader {
  constructor({ slotManager, browserRenderer }) {
    this._slotManager = slotManager;
    this._browserRenderer = browserRenderer;
  }

  async load() {
    if (!window.ipcBridge || !this._slotManager) return;
    try {
      const extensionList = await window.ipcBridge.getExtensions();
      if (!extensionList || extensionList.length === 0) return;
      BootLog.log(`loading ${extensionList.length} extension renderer(s)`);
      await this._slotManager.loadExtensions(extensionList, {
        electronAPI: window.electronAPI,
        ipcBridge: window.ipcBridge,
        browserRenderer: this._browserRenderer,
        slotManager: this._slotManager,
      });
      BootLog.log('extension renderers loaded');
    } catch (err) {
      console.error('Failed to load extension renderers:', err);
    }
  }

  loadWhenSetupComplete() {
    const api = window.electronAPI;
    if (!api || !api.getSetupComplete) return;
    api.getSetupComplete().then((flag) => {
      if (flag) this.load();
      else BootLog.log('extension renderer load deferred (setup not complete)');
    }).catch(() => this.load());
  }
}

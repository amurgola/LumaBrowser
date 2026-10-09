import UpdateControls from './UpdateControls.js';

export default class AboutPanel {
  static PRODUCT_NAME = 'LumaBrowser';

  constructor(hooks) {
    this._updates = new UpdateControls(hooks);
    this._loaded = false;
  }

  async load() {
    if (this._loaded) return;
    try {
      const data = await window.electronAPI.getLicenses();
      AboutPanel._fill(data);
      await this._updates.wire();
      this._loaded = true;
    } catch (err) {
      console.error('Failed to load license info:', err);
    }
  }

  static productName(name) {
    return (name && /luma/i.test(name) && name !== 'lumabrowser') ? name : AboutPanel.PRODUCT_NAME;
  }

  static _fill(data) {
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('aboutAppName', AboutPanel.productName(data.name));
    set('aboutAppVersion', `v${data.version || '1.0.0'}`);
    set('aboutAppLicense', data.appLicense || 'No license file found.');
    set('aboutThirdParty', data.thirdParty || 'No third-party licenses found.');
  }
}

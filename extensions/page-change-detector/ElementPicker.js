const fs = require('fs');
const path = require('path');

class ElementPicker {
  static SCRIPT_PATH = path.join(__dirname, 'picker.js');
  static LOAD_TIMEOUT_MS = 5000;
  static _script = null;

  constructor({ browser, tabs }) {
    this._browser = browser;
    this._tabs = tabs;
  }

  async pick(monitor) {
    const tabId = await this._openVisibleTab(monitor.url);
    await this._browser.executeJs(tabId, ElementPicker.initialSelectorsScript(monitor.selectors));
    await this._tabs.bringToFront(tabId);
    return ElementPicker._pickedFrom(await this._browser.executeJs(tabId, ElementPicker.script()));
  }

  static initialSelectorsScript(selectors) {
    return `window.__pcdInitialSelectors = ${JSON.stringify(Array.isArray(selectors) ? selectors : [])};`;
  }

  static script() {
    if (ElementPicker._script === null) ElementPicker._script = fs.readFileSync(ElementPicker.SCRIPT_PATH, 'utf8');
    return ElementPicker._script;
  }

  async _openVisibleTab(url) {
    const tabId = await this._tabs.findOrCreate(url, { silent: false, allowSilentMatch: false });
    await this._tabs.waitForLoad(tabId, ElementPicker.LOAD_TIMEOUT_MS);
    return tabId;
  }

  static _pickedFrom(result) {
    if (!result || !result.success) throw new Error((result && result.error) || 'Element picker failed to run');
    const picked = result.data ? result.data.result : undefined;
    if (picked === null || picked === undefined) return null;
    if (!Array.isArray(picked)) throw new Error('Picker returned an unexpected value');
    return picked;
  }
}

module.exports = ElementPicker;

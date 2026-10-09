const ActionWatcher = require('../ActionWatcher');

class TabPage {
  static NO_RESULT_ERROR = 'In-page script returned no result';

  constructor(entry, tabId, tabViewManager) {
    this.entry = entry;
    this.tabId = tabId;
    this.tabViewManager = tabViewManager;
  }

  get webContents() {
    return this.entry.webContents;
  }

  get view() {
    return this.entry.view;
  }

  url() {
    return this.webContents.getURL();
  }

  run(script) {
    return this.webContents.executeJavaScript(script, false);
  }

  async runEnvelope(script, emptyError = TabPage.NO_RESULT_ERROR) {
    const result = await this.run(script);
    if (!result || !result.success) {
      return { success: false, error: (result && result.error) || emptyError };
    }
    const { success: _flag, ...data } = result;
    return { success: true, data };
  }

  watchAction() {
    return new ActionWatcher(this.webContents, { tabId: this.tabId, tabViewManager: this.tabViewManager });
  }
}

module.exports = TabPage;

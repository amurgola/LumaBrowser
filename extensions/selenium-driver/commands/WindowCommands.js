const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');
const WindowHandle = require('../WindowHandle');

class WindowCommands extends WebDriverCommandGroup {
  commandNames() {
    return [
      'getWindowHandle', 'getWindowHandles', 'switchToWindow', 'newWindow', 'closeWindow',
      'getWindowRect', 'setWindowRect', 'maximize', 'minimize', 'fullscreen',
      'switchToFrame', 'switchToParentFrame',
    ];
  }

  async getWindowHandle(session) {
    return WindowHandle.fromTabId(session.tabId);
  }

  async getWindowHandles() {
    const res = await this._browser.getTabs();
    if (!res.success) throw WebDriverError.unknownError(res.error || 'listing tabs failed');
    return WindowCommands._handlesOf(res);
  }

  async switchToWindow(session, _params, req) {
    const { handle } = WindowCommands._body(req);
    const tabId = WindowHandle.toTabId(handle);
    if (tabId == null) throw WebDriverError.noSuchWindow(`Unknown handle: ${handle}`);
    if (!await this._tabExists(tabId)) throw WebDriverError.noSuchWindow(`No tab for handle: ${handle}`);
    session.tabId = tabId;
    session.currentFrameChain = [];
    return null;
  }

  async newWindow(_session, _params, req) {
    const type = WindowCommands._body(req).type === 'window' ? 'window' : 'tab';
    const created = await this._browser.createTab('about:blank');
    if (!created.success) throw WebDriverError.unknownError(created.error || 'tab create failed');
    return { handle: WindowHandle.fromTabId(created.tab.id), type };
  }

  async closeWindow(session) {
    await this._browser.closeTab(session.tabId);
    return WindowCommands._handlesOf(await this._browser.getTabs());
  }

  async getWindowRect() { throw WindowCommands._noWindowRect(); }

  async setWindowRect() { throw WindowCommands._noWindowRect(); }

  async maximize() { throw WindowCommands._noWindowRect(); }

  async minimize() { throw WindowCommands._noWindowRect(); }

  async fullscreen() { throw WindowCommands._noWindowRect(); }

  async switchToFrame(session, _params, req) {
    const { id } = WindowCommands._body(req);
    if (id !== null && id !== undefined) throw WebDriverError.unsupportedOperation('frame switching not yet implemented in v1');
    session.currentFrameChain = [];
    return null;
  }

  async switchToParentFrame(session) {
    session.currentFrameChain = session.currentFrameChain.slice(0, -1);
    return null;
  }

  async _tabExists(tabId) {
    const tabs = await this._browser.getTabs();
    if (!tabs.success) throw WebDriverError.unknownError(tabs.error || 'listing tabs failed');
    return (tabs.tabs || []).some((t) => String(t.id) === String(tabId));
  }

  static _handlesOf(listed) {
    return ((listed && listed.success && listed.tabs) || []).map((t) => WindowHandle.fromTabId(t.id));
  }

  static _noWindowRect() {
    return WebDriverError.unsupportedOperation('setWindowRect=false');
  }
}

module.exports = WindowCommands;

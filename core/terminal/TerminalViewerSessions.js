const TerminalPage = require('./TerminalPage');

class TerminalViewerSessions {
  static EVENT_CHANNEL = 'core.terminal.event';

  constructor({ service, getTabViewManager }) {
    this._service = service;
    this._tvm = getTabViewManager;
    this._pageSession = new Map();
    this._owned = new Map();
  }

  async attachPage(sender, size) {
    const id = await this._sessionOfPage(sender, size);
    this._pageSession.set(sender.id, id);
    return this._show(sender, id, size);
  }

  async attachDock(sender, { id = null, profileId = null, cwd = null, size = null, besideTabId = null } = {}) {
    const sessionId = id && this._service.get(id) ? id : (await this._service.open({ profileId, cwd, size, besideTabId, origin: 'user' })).id;
    return this._show(sender, sessionId, size);
  }

  sessionFor(sender, id, fromChrome) {
    const sessionId = fromChrome ? id : this._pageSession.get(sender.id);
    return sessionId && this._service.get(sessionId) ? sessionId : null;
  }

  async restart(sender, id, size) {
    const old = this._service.get(id);
    if (!old) return null;
    await this._service.close(id);
    const fresh = await this._service.open({ profileId: old.profileId, cwd: old.cwd, size, besideTabId: old.besideTabId, origin: 'user' });
    if (this._pageSession.get(sender.id) === id) this._pageSession.set(sender.id, fresh.id);
    return this._show(sender, fresh.id, size);
  }

  openTab({ profileId = null, cwd = null, sessionId = null, windowId = undefined, activate = true } = {}) {
    const tvm = this._tvm();
    if (!tvm) return { success: false, error: 'No browser window is open.' };
    const tab = tvm.createTab(TerminalPage.url({ profileId, cwd, sessionId }), { activate, title: TerminalPage.TITLE, windowId });
    return { success: true, tab };
  }

  closeTabOf(sender) {
    const tvm = this._tvm();
    const tabId = tvm ? tvm.findTabIdByWebContents(sender) : null;
    return tabId == null ? { success: false } : tvm.closeTab(tabId);
  }

  async _sessionOfPage(sender, size) {
    const bound = this._pageSession.get(sender.id);
    if (bound && this._service.get(bound)) return bound;
    const address = TerminalPage.parse(sender.getURL()) || {};
    if (address.sessionId && this._service.get(address.sessionId) && !this._isShownByPage(address.sessionId)) return address.sessionId;
    const options = { cwd: address.cwd, size, origin: 'user' };
    const opened = await this._service.open({ ...options, profileId: address.profileId })
      .catch(() => this._service.open(options));
    return opened.id;
  }

  _isShownByPage(sessionId) {
    return [...this._pageSession.values()].includes(sessionId);
  }

  async _show(sender, id, size) {
    this._own(sender, id);
    if (size) this._service.resize(id, size);
    return this._service.attach(id, TerminalViewerSessions._viewer(sender));
  }

  _own(sender, id) {
    if (!this._owned.has(sender.id)) {
      this._owned.set(sender.id, new Set());
      sender.once('destroyed', () => this._onSenderGone(sender.id));
    }
    this._owned.get(sender.id).add(id);
  }

  _onSenderGone(senderId) {
    const ids = this._owned.get(senderId) || [];
    this._owned.delete(senderId);
    this._pageSession.delete(senderId);
    for (const id of ids) this._service.close(id).catch(() => {});
  }

  static _viewer(sender) {
    return {
      key: sender.id,
      send: (event) => { if (!sender.isDestroyed()) sender.send(TerminalViewerSessions.EVENT_CHANNEL, event); },
    };
  }
}

module.exports = TerminalViewerSessions;
